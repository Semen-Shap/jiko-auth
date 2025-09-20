package handlers

import (
	"encoding/json"
	"jiko-auth/internal/models"
	"jiko-auth/internal/repository"
	"jiko-auth/pkg/logger"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	userRepo   repository.UserRepository
	clientRepo *repository.OAuthClientRepository
}

func NewAdminHandler(userRepo repository.UserRepository, clientRepo *repository.OAuthClientRepository) *AdminHandler {
	return &AdminHandler{
		userRepo:   userRepo,
		clientRepo: clientRepo,
	}
}

// GetStats возвращает статистику для admin панели
func (h *AdminHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	// Получаем общую статистику пользователей
	allUsers, err := h.userRepo.ListUsers(ctx, 10000, 0) // Получаем всех пользователей
	if err != nil {
		logger.Error("Failed to get users for stats", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get statistics"})
		return
	}

	// Считаем статистику
	var totalUsers int64 = int64(len(allUsers))
	var totalVerifiedUsers int64 = 0
	var newUsersToday int64 = 0

	today := time.Now().Truncate(24 * time.Hour)
	for _, user := range allUsers {
		if user.EmailVerified {
			totalVerifiedUsers++
		}
		if user.CreatedAt.After(today) {
			newUsersToday++
		}
	}

	// Получаем статистику клиентов
	allClients, err := h.clientRepo.GetAllClients()
	if err != nil {
		logger.Error("Failed to get clients for stats", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get statistics"})
		return
	}

	var totalClients int64 = int64(len(allClients))
	var newClientsToday int64 = 0

	for _, client := range allClients {
		if client.CreatedAt.After(today) {
			newClientsToday++
		}
	}

	stats := models.AdminStats{
		TotalUsers:         totalUsers,
		TotalVerifiedUsers: totalVerifiedUsers,
		TotalClients:       totalClients,
		TotalActiveTokens:  0, // TODO: подсчет активных токенов
		NewUsersToday:      newUsersToday,
		NewClientsToday:    newClientsToday,
	}

	c.JSON(http.StatusOK, stats)
}

// GetUsers возвращает список всех пользователей с пагинацией
func (h *AdminHandler) GetUsers(c *gin.Context) {
	ctx := c.Request.Context()

	// Получаем параметры пагинации
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	users, err := h.userRepo.ListUsers(ctx, limit, offset)
	if err != nil {
		logger.Error("Failed to get users", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	// Конвертируем в AdminUserResponse
	adminUsers := make([]models.AdminUserResponse, len(users))
	for i, user := range users {
		adminUsers[i] = models.AdminUserResponse{
			ID:            user.ID,
			Username:      user.Username,
			Email:         user.Email,
			EmailVerified: user.EmailVerified,
			Role:          user.Role,
			LastLogin:     user.LastLogin,
			CreatedAt:     user.CreatedAt,
			UpdatedAt:     user.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users":  adminUsers,
		"limit":  limit,
		"offset": offset,
		"count":  len(adminUsers),
	})
}

// GetUser возвращает информацию о конкретном пользователе
func (h *AdminHandler) GetUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	adminUser := models.AdminUserResponse{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		Role:          user.Role,
		LastLogin:     user.LastLogin,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
	}

	c.JSON(http.StatusOK, adminUser)
}

// CreateUser создает нового пользователя
func (h *AdminHandler) CreateUser(c *gin.Context) {
	var req models.AdminCreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Проверяем, не существует ли пользователь с таким email
	existingUser, err := h.userRepo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		logger.Error("Failed to check existing user by email", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	if existingUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User with this email already exists"})
		return
	}

	// Проверяем username
	existingUser, err = h.userRepo.GetUserByUsername(ctx, req.Username)
	if err != nil {
		logger.Error("Failed to check existing user by username", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	if existingUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User with this username already exists"})
		return
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Создаем пользователя
	user := &models.User{
		Username:      req.Username,
		Email:         req.Email,
		Password:      string(hashedPassword),
		Role:          req.Role,
		EmailVerified: true, // Admin создает уже верифицированных пользователей
	}

	if err := h.userRepo.CreateUser(ctx, user); err != nil {
		logger.Error("Failed to create user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Возвращаем созданного пользователя без пароля
	adminUser := models.AdminUserResponse{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		Role:          user.Role,
		LastLogin:     user.LastLogin,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
	}

	c.JSON(http.StatusCreated, adminUser)
}

// UpdateUser обновляет пользователя
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.AdminUpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	user, err := h.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Обновляем поля
	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.EmailVerified != nil {
		user.EmailVerified = *req.EmailVerified
	}
	if req.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			logger.Error("Failed to hash password", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
		user.Password = string(hashedPassword)
	}

	user.UpdatedAt = time.Now()

	if err := h.userRepo.UpdateUser(ctx, user); err != nil {
		logger.Error("Failed to update user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Возвращаем обновленного пользователя
	adminUser := models.AdminUserResponse{
		ID:            user.ID,
		Username:      user.Username,
		Email:         user.Email,
		EmailVerified: user.EmailVerified,
		Role:          user.Role,
		LastLogin:     user.LastLogin,
		CreatedAt:     user.CreatedAt,
		UpdatedAt:     user.UpdatedAt,
	}

	c.JSON(http.StatusOK, adminUser)
}

// DeleteUser удаляет пользователя
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := c.Request.Context()

	// Проверяем, существует ли пользователь
	user, err := h.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Не позволяем удалить самого себя
	adminUserID := c.GetString("user_id")
	if adminUserID == userIDStr {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete yourself"})
		return
	}

	if err := h.userRepo.DeleteUser(ctx, userID); err != nil {
		logger.Error("Failed to delete user", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetAllClientsWithUsers возвращает всех клиентов с информацией о пользователях
func (h *AdminHandler) GetAllClientsWithUsers(c *gin.Context) {
	clients, err := h.clientRepo.GetAllClients()
	if err != nil {
		logger.Error("Failed to get clients", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get clients"})
		return
	}

	ctx := c.Request.Context()
	adminClients := make([]models.AdminClientResponse, 0, len(clients))

	for _, client := range clients {
		// Получаем информацию о пользователе
		user, err := h.userRepo.GetUserByID(ctx, client.UserID)
		if err != nil {
			logger.Error("Failed to get user for client", zap.Error(err))
			continue
		}

		if user == nil {
			logger.Warn("User not found for client", zap.String("client_id", client.ID.String()), zap.String("user_id", client.UserID.String()))
			continue
		}

		// Парсим JSON поля
		var redirectURIs []string
		var grants []string

		if err := json.Unmarshal([]byte(client.RedirectURIs), &redirectURIs); err != nil {
			logger.Error("Failed to unmarshal redirect URIs", zap.Error(err))
			redirectURIs = []string{}
		}

		if err := json.Unmarshal([]byte(client.Grants), &grants); err != nil {
			logger.Error("Failed to unmarshal grants", zap.Error(err))
			grants = []string{}
		}

		adminClients = append(adminClients, models.AdminClientResponse{
			ID:           client.ID,
			UserID:       client.UserID,
			Username:     user.Username,
			Email:        user.Email,
			Name:         client.Name,
			RedirectURIs: redirectURIs,
			Grants:       grants,
			Scope:        client.Scope,
			CreatedAt:    client.CreatedAt,
			UpdatedAt:    client.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, adminClients)
}
