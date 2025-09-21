package routes

import (
	"jiko-auth/internal/handlers"
	"jiko-auth/internal/middleware"
	"jiko-auth/internal/repository"
	"jiko-auth/pkg/auth"
	"jiko-auth/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func SetupRouter(
	authHandler *auth.AuthService,
	oauthHandler *handlers.OAuthHandler,
	codesHandler *handlers.CodesHandler,
	adminHandler *handlers.AdminHandler,
	jwtService *jwt.Service,
	tokenRepo *repository.TokenRepository,
	userRepo repository.UserRepository,
) *gin.Engine {
	router := gin.Default()

	// Добавляем CORS middleware
	router.Use(middleware.CORSMiddleware())

	router.GET("/verify-email", func(c *gin.Context) {
		token := c.Query("token")
		success := c.Query("success")

		if token != "" {
			// Перенаправляем на API верификации
			authHandler.VerifyEmail(c)
			return
		}

		var title, message string
		var isSuccess bool

		if success == "true" {
			isSuccess = true
			title = "Email успешно подтвержден!"
			message = "Ваш email был успешно подтвержден. Теперь вы можете войти в свой аккаунт."
		} else {
			isSuccess = false
			title = "Ошибка подтверждения"
			message = "Произошла ошибка при подтверждении email. Попробуйте еще раз или свяжитесь с поддержкой."
		}

		c.HTML(200, "verification-result.html", gin.H{
			"Title":   title,
			"Success": isSuccess,
			"Message": message,
		})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Auth routes
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.GET("/auth/verify-email", authHandler.VerifyEmail)

		// OAuth routes
		api.GET("/oauth/authorize", oauthHandler.Authorize)
		api.POST("/oauth/token", oauthHandler.Token)
		api.GET("/oauth/userinfo", middleware.OAuthMiddleware(tokenRepo, userRepo), oauthHandler.UserInfo)

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AdminMiddleware(jwtService))
		{
			// Dashboard & Statistics
			admin.GET("/stats", adminHandler.GetStats)

			// User Management
			admin.GET("/users", adminHandler.GetUsers)
			admin.GET("/users/:id", adminHandler.GetUser)
			admin.POST("/users", adminHandler.CreateUser)
			admin.PUT("/users/:id", adminHandler.UpdateUser)
			admin.DELETE("/users/:id", adminHandler.DeleteUser)

			// Client Management (enhanced)
			admin.GET("/clients", adminHandler.GetAllClientsWithUsers)
			admin.POST("/clients", oauthHandler.AdminCreateClient)
			admin.PUT("/clients/:id", oauthHandler.AdminUpdateClient)
			admin.DELETE("/clients/:id", oauthHandler.AdminDeleteClient)

			// OAuth Client management for admins
			admin.GET("/oauth/clients", oauthHandler.GetClients)
			admin.POST("/oauth/clients", oauthHandler.CreateClient)
			admin.POST("/oauth/clients/:id/tokens", oauthHandler.CreateToken)
		}

		// Health check
		api.GET("/healthcheck", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "OK"})
		})
	}

	return router
}
