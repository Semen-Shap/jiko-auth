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

	// Загружаем HTML шаблоны
	router.LoadHTMLGlob("./static/html/*")

	// Статические файлы
	router.Static("/static", "./static") // HTML страницы
	router.GET("/", func(c *gin.Context) {
		c.HTML(200, "base.html", gin.H{
			"Title": "Вход и регистрация",
		})
	})

	router.GET("/login", func(c *gin.Context) {
		c.HTML(200, "base.html", gin.H{
			"Title": "Вход",
		})
	})

	router.GET("/register", func(c *gin.Context) {
		c.HTML(200, "base.html", gin.H{
			"Title": "Регистрация",
		})
	})

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
		api.POST("/auth/admin/login", authHandler.AdminLogin)
		api.GET("/auth/verify-email", authHandler.VerifyEmail)

		// OAuth routes
		api.GET("/oauth/authorize", oauthHandler.Authorize)
		api.POST("/oauth/token", oauthHandler.Token)

		// Client management routes
		api.GET("/clients", middleware.AuthMiddleware(jwtService), oauthHandler.GetClients)
		api.POST("/clients", middleware.AuthMiddleware(jwtService), oauthHandler.CreateClient)
		api.POST("/clients/:id/tokens", middleware.AuthMiddleware(jwtService), oauthHandler.CreateToken)

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AdminMiddleware(jwtService))
		{
			admin.GET("/clients", oauthHandler.GetAllClients)
			admin.POST("/clients", oauthHandler.AdminCreateClient)
			admin.PUT("/clients/:id", oauthHandler.AdminUpdateClient)
			admin.DELETE("/clients/:id", oauthHandler.AdminDeleteClient)
		}

		// Health check
		api.GET("/healthcheck", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "OK"})
		})
	}

	return router
}
