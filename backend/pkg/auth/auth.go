package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"regexp"
	"time"

	"jiko-auth/internal/config"
	"jiko-auth/internal/models"
	"jiko-auth/internal/repository"
	"jiko-auth/pkg/email"
	"jiko-auth/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo     repository.UserRepository
	jwtSecret    string
	emailService *email.EmailService
	cfg          *config.Config
}

func NewAuthService(userRepo repository.UserRepository, cfg *config.Config, jwtSecret string, emailService *email.EmailService) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		jwtSecret:    jwtSecret,
		emailService: emailService,
		cfg:          cfg,
	}
}

// InitializeAdmin создает администратора при первом запуске приложения
func (s *AuthService) InitializeAdmin(ctx context.Context) error {
	// Проверяем, заданы ли переменные окружения для админа
	if s.cfg.AppUser == "" || s.cfg.AppPassword == "" {
		logger.Info("Admin credentials not configured, skipping admin initialization")
		return nil
	}

	// Проверяем, существует ли уже администратор
	admin, err := s.userRepo.GetUserByEmail(ctx, s.cfg.AppUser)
	if err != nil {
		logger.Error("Error checking for existing admin", zap.Error(err))
		return fmt.Errorf("failed to check existing admin: %w", err)
	}

	if admin != nil {
		// Админ уже существует, проверяем его роль
		if admin.Role != "admin" {
			admin.Role = "admin"
			if err := s.userRepo.UpdateUser(ctx, admin); err != nil {
				logger.Error("Failed to update admin role", zap.Error(err))
				return fmt.Errorf("failed to update admin role: %w", err)
			}
			logger.Info("Updated existing user to admin role", zap.String("email", s.cfg.AppUser))
		} else {
			logger.Info("Admin user already exists", zap.String("email", s.cfg.AppUser))
		}
		return nil
	}

	// Создаем нового администратора
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(s.cfg.AppPassword), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash admin password", zap.Error(err))
		return fmt.Errorf("failed to hash admin password: %w", err)
	}

	newAdmin := &models.User{
		Username:      s.cfg.AppUser,
		Email:         s.cfg.AppUser,
		Password:      string(hashedPassword),
		Role:          "admin",
		EmailVerified: true,
	}

	if err := s.userRepo.CreateUser(ctx, newAdmin); err != nil {
		logger.Error("Failed to create admin user", zap.Error(err))
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	logger.Info("Admin user created successfully", zap.String("email", s.cfg.AppUser))
	return nil
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"` // Может быть email или username
	Password   string `json:"password" binding:"required"`
}

type AuthResponse struct {
	AccessToken string       `json:"access_token"`
	ExpiresAt   int64        `json:"expires_at"`
	User        *models.User `json:"user"`
}

// ValidatePasswordStrength проверяет сложность пароля
func ValidatePasswordStrength(password string) error {
	if len(password) < 12 {
		return fmt.Errorf("password must be at least 12 characters long")
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`).MatchString(password)

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return fmt.Errorf("password must contain uppercase, lowercase, number and special characters")
	}

	return nil
}

// GenerateVerificationToken создает безопасный токен для верификации
func GenerateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *AuthService) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid registration request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Валидация пароля
	if err := ValidatePasswordStrength(req.Password); err != nil {
		logger.Error("Invalid registration request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Проверка существования пользователя по email
	exitingUserByEmail, err := s.userRepo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		logger.Error("Error checking email existence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	// Проверка существования пользователя по username
	exitingUserByUsername, err := s.userRepo.GetUserByUsername(ctx, req.Username)
	if err != nil {
		logger.Error("Error checking username existence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	if exitingUserByUsername != nil {
		logger.Info("Registration attempt with existing username", zap.String("username", req.Username))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пользователь с таким username уже зарегистрирован"})
		return
	}

	if exitingUserByEmail != nil {
		if exitingUserByEmail.EmailVerified {
			logger.Info("Registration attempt with existing verified email", zap.String("email", req.Email))
			c.JSON(http.StatusBadRequest, gin.H{"error": "Пользователь с таким email уже зарегистрирован"})
			return
		} else {
			// Пользователь существует, но не верифицирован
			// Проверяем, прошло ли достаточно времени с момента последней отправки
			if time.Since(exitingUserByEmail.EmailVerificationSentAt) > 3*time.Minute {
				// Генерируем новый токен
				newToken, err := GenerateVerificationToken()
				if err != nil {
					logger.Error("Failed to generate verification token", zap.Error(err))
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
					return
				}

				// Обновляем токен и время отправки
				exitingUserByEmail.EmailVerificationToken = &newToken
				exitingUserByEmail.EmailVerificationSentAt = time.Now()

				if err := s.userRepo.UpdateUser(ctx, exitingUserByEmail); err != nil {
					logger.Error("Failed to update user verification token", zap.Error(err))
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
					return
				}

				// Отправляем письмо
				if s.cfg.AppEnv == "production" {
					if err := s.emailService.SendVerificationEmail(exitingUserByEmail.Email, newToken); err != nil {
						logger.Error("Не удалось отправить письмо подтверждения",
							zap.Error(err),
							zap.String("email", exitingUserByEmail.Email))
					}
				}

				logger.Info("Resent verification email for existing unverified user", zap.String("email", req.Email))
				c.JSON(http.StatusOK, gin.H{
					"message": "Письмо с подтверждением отправлено повторно. Проверьте вашу почту.",
				})
				return
			} else {
				c.JSON(http.StatusTooManyRequests, gin.H{"error": "Письмо уже было отправлено недавно. Попробуйте позже."})
				return
			}
		}
	}

	// Хеширование пароля
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	// Генерация токена верификации
	verificationToken, err := GenerateVerificationToken()
	if err != nil {
		logger.Error("Failed to generate verification token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	// Создание пользователя
	newUser := &models.User{
		Username:                req.Username,
		Email:                   req.Email,
		Password:                string(hashedPassword),
		Role:                    "user",
		EmailVerified:           false,
		EmailVerificationToken:  &verificationToken,
		EmailVerificationSentAt: time.Now(),
	}

	if s.cfg.AppEnv == "production" {
		if err := s.emailService.SendVerificationEmail(newUser.Email, verificationToken); err != nil {
			logger.Error("Не удалось отправить письмо подтверждения",
				zap.Error(err),
				zap.String("email", newUser.Email))
		}
	} else {
		newUser.EmailVerified = true
		newUser.EmailVerificationToken = nil
	}

	if err := s.userRepo.CreateUser(ctx, newUser); err != nil {
		logger.Error("Failed to create user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	logger.Info("User registered successfully", zap.String("email", req.Email))
	c.JSON(http.StatusOK, gin.H{
		"message": "Registration successful. Please check your email to verify your account.",
	})
}

func (s *AuthService) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	ctx := c.Request.Context()

	// Обычный пользователь - поиск по email или username
	user, err := s.userRepo.GetUserByEmail(ctx, req.Identifier)
	if err != nil || user == nil {
		// Если не найдено по email, попробуем по username
		user, err = s.userRepo.GetUserByUsername(ctx, req.Identifier)
		if err != nil || user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
	}

	// Проверка верификации email
	if !user.EmailVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email not verified"})

		// Если пользователь существует но не верифицирован, отправляем письмо повторно
		if !user.EmailVerified && time.Since(user.EmailVerificationSentAt) > 3*time.Minute {
			newToken, err := GenerateVerificationToken()
			if err != nil {
				logger.Error("Failed to generate verification token", zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
				return
			}

			// Обновляем токен и время отправки
			user.EmailVerificationToken = &newToken
			user.EmailVerificationSentAt = time.Now()

			if err := s.userRepo.UpdateUser(ctx, user); err != nil {
				logger.Error("Failed to update user verification token", zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
				return
			}

			// Отправляем письмо
			if s.cfg.AppEnv == "production" {
				if err := s.emailService.SendVerificationEmail(user.Email, newToken); err != nil {
					logger.Error("Не удалось отправить письмо подтверждения",
						zap.Error(err),
						zap.String("email", user.Email))
				}
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "Письмо с подтверждением отправлено повторно. Проверьте вашу почту.",
			})
			return
		}

		logger.Info("Registration attempt with existing email", zap.String("identifier", req.Identifier))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пользователь с таким email уже зарегистрирован"})
		return
	}

	// Проверка пароля
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Генерация JWT токена
	token, expiresAt, err := s.GenerateJWTToken(user.ID, user.Role)
	if err != nil {
		logger.Error("Failed to generate JWT token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Не возвращаем пароль в ответе
	user.Password = ""

	c.JSON(http.StatusOK, AuthResponse{
		AccessToken: token,
		ExpiresAt:   expiresAt,
		User:        user,
	})
}

func (s *AuthService) GenerateJWTToken(userID uuid.UUID, role string) (string, int64, error) {
	expiresAt := time.Now().Add(time.Hour * 24).Unix()

	claims := jwt.MapClaims{
		"sub":  userID.String(),
		"role": role,
		"exp":  expiresAt,
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	return tokenString, expiresAt, err
}

func (s *AuthService) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	logger.Info("VerifyEmail called", zap.String("token", token))
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Токен верификации отсутствует",
		})
		return
	}

	ctx := c.Request.Context()

	// Находим пользователя по токену
	user, err := s.userRepo.GetUserByVerificationToken(ctx, token)
	if err != nil {
		logger.Error("Error finding user by verification token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Ошибка при поиске пользователя",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Неверный токен верификации",
		})
		return
	}

	// Проверяем срок действия токена (3 минуты для тестирования)
	if time.Since(user.EmailVerificationSentAt) > 3*time.Minute {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Срок действия токена истек",
		})
		return
	}

	logger.Info("User found by token", zap.Any("user", user))
	logger.Info("Token timing",
		zap.Time("sent_at", user.EmailVerificationSentAt),
		zap.Time("now", time.Now()),
		zap.Duration("elapsed", time.Since(user.EmailVerificationSentAt)))

	// Обновляем пользователя с помощью специального метода
	if err := s.userRepo.MarkEmailAsVerified(ctx, user.ID); err != nil {
		logger.Error("Error updating user during email verification", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Ошибка при верификации email",
		})
		return
	}

	// Возвращаем результат
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Email успешно подтвержден",
	})
}

func (s *AuthService) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractToken(c)
		if tokenString == "" {

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization required"})
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(s.jwtSecret), nil
		})

		if err != nil || token == nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		userID, err := uuid.Parse(claims["sub"].(string))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID"})
			return
		}

		user, err := s.userRepo.GetUserByID(c.Request.Context(), userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

func extractToken(c *gin.Context) string {
	bearer := c.GetHeader("Authorization")
	if len(bearer) > 7 && bearer[:7] == "Bearer " {
		return bearer[7:]
	}
	return ""
}

func GetUserFromContext(c *gin.Context) *models.User {
	user, exists := c.Get("user")
	if !exists {
		return nil
	}
	return user.(*models.User)
}

func CurrentUserHandler(c *gin.Context) {
	user := GetUserFromContext(c)
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
	})
}
