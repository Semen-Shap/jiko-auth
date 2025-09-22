// internal/middleware/cors.go
package middleware

import (
	"jiko-auth/pkg/jwt"
	"net/http"
	"strings"
	"time"

	"jiko-auth/internal/repository"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Разрешаем localhost для development
		allowedOrigins := []string{
			"http://localhost:3000", // Next.js dev server
			"http://localhost:8080", // Backend
			"http://localhost:3001", // Alternative port
		}

		// Проверяем, разрешен ли origin
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		// Если origin не найден в списке, разрешаем текущий
		if c.Writer.Header().Get("Access-Control-Allow-Origin") == "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func AuthMiddleware(jwtService *jwt.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractTokenFromHeader(c)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Сохраняем информацию о пользователе в контексте
		c.Set("user_id", claims["sub"])
		if role, exists := claims["role"]; exists {
			c.Set("user_role", role)
		}
		c.Next()
	}
}

func AdminMiddleware(jwtService *jwt.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractTokenFromHeader(c)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		role, exists := claims["role"]
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok || roleStr != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		// Сохраняем информацию о пользователе в контексте
		c.Set("user_id", claims["sub"])
		c.Set("user_role", claims["role"])
		c.Next()
	}
}

func extractTokenFromHeader(c *gin.Context) string {
	bearerToken := c.GetHeader("Authorization")
	if bearerToken == "" {
		return ""
	}

	parts := strings.Split(bearerToken, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}

func OAuthMiddleware(tokenRepo *repository.TokenRepository, userRepo repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractTokenFromHeader(c)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		// Получаем access token из БД
		accessToken, err := tokenRepo.GetAccessToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Проверяем срок действия
		if time.Now().After(accessToken.ExpiresAt) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
			c.Abort()
			return
		}

		// Получаем пользователя
		user, err := userRepo.GetUserByID(c.Request.Context(), accessToken.UserID)
		if err != nil || user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Сохраняем информацию в контексте
		c.Set("user", user)
		c.Set("client_id", accessToken.ClientID.String())
		c.Next()
	}
}

// FlexibleAuthMiddleware проверяет авторизацию по JWT токену из заголовка или параметров
// Подходит для OAuth flow где фронтенд передает токен через query params или Authorization header
func FlexibleAuthMiddleware(jwtService *jwt.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// Пытаемся получить токен из заголовка Authorization
		tokenString = extractTokenFromHeader(c)

		// Если в заголовке нет, пытаемся получить из параметра access_token
		if tokenString == "" {
			tokenString = c.Query("access_token")
		}

		// Если токена нет вообще, не блокируем запрос, но указываем что пользователь не авторизован
		if tokenString == "" {
			c.Set("authenticated", false)
			c.Next()
			return
		}

		// Валидируем JWT токен
		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			c.Set("authenticated", false)
			c.Next()
			return
		}

		// Сохраняем информацию о пользователе в контексте
		c.Set("user_id", claims["sub"])
		if role, exists := claims["role"]; exists {
			c.Set("user_role", role)
		}
		c.Set("authenticated", true)
		c.Next()
	}
}
