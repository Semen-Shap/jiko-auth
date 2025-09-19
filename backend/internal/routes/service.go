package routes

import (
	"jiko-auth/internal/handlers"
	"jiko-auth/internal/middleware"
	"jiko-auth/pkg/auth"
	"jiko-auth/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func SetupRouter(
	authHandler *auth.AuthService,
	oauthHandler *handlers.OAuthHandler,
	codesHandler *handlers.CodesHandler,
	jwtService *jwt.Service,
) *gin.Engine {
	router := gin.Default()

	// Добавляем CORS middleware
	router.Use(middleware.CORSMiddleware())

	// API routes
	api := router.Group("/api/v1")
	{
		// Auth routes
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.GET("/auth/verify-email", authHandler.VerifyEmail)
		api.POST("/auth/resend-verification", authHandler.ResendVerification)

		// OAuth routes
		api.GET("/oauth/authorize", oauthHandler.Authorize)
		api.POST("/oauth/token", oauthHandler.Token)

		// Client management routes
		api.GET("/clients", middleware.AuthMiddleware(jwtService), oauthHandler.GetClients)
		api.POST("/clients", middleware.AuthMiddleware(jwtService), oauthHandler.CreateClient)
		api.POST("/clients/:id/tokens", middleware.AuthMiddleware(jwtService), oauthHandler.CreateToken)

		// Health check
		api.GET("/healthcheck", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "OK"})
		})
	}

	return router
}
