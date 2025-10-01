package main

import (
	"context"
	"jiko-auth/internal/config"
	"jiko-auth/internal/database"
	"jiko-auth/internal/handlers"
	"jiko-auth/internal/repository"
	"jiko-auth/internal/routes"
	"jiko-auth/pkg/auth"
	"jiko-auth/pkg/email"
	"jiko-auth/pkg/jwt"
	"jiko-auth/pkg/oauth2"
	"log"
	"net/http"

	_ "github.com/lib/pq"
)

func main() {
	cfg := config.Load()

	db, err := database.Init(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	// Инициализация репозиториев
	userRepo := repository.NewUserRepository(db)
	clientRepo := repository.NewOAuthClientRepository(db)
	authCodeRepo := repository.NewAuthCodeRepository(db)
	tokenRepo := repository.NewTokenRepository(db)

	// Инициализация сервисов
	jwtService := jwt.NewService(cfg.JWTSecret)
	oauthService := oauth2.NewService(authCodeRepo, tokenRepo, clientRepo, userRepo, jwtService)
	emailService := email.NewEmailService(cfg)

	// Инициализация обработчиков
	authHandler := auth.NewAuthService(userRepo, cfg, cfg.JWTSecret, emailService)
	oauthHandler := handlers.NewOAuthHandler(oauthService, clientRepo, userRepo)
	codesHandler := handlers.NewCodesHandler(clientRepo)
	adminHandler := handlers.NewAdminHandler(userRepo, clientRepo)

	// Инициализация администратора
	if err := authHandler.InitializeAdmin(context.Background()); err != nil {
		log.Fatal("Failed to initialize admin:", err)
	}

	// Настройка роутера
	router := routes.SetupRouter(authHandler, oauthHandler, codesHandler, adminHandler, jwtService, tokenRepo, userRepo)

	// Запуск сервера
	server := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: router,
	}

	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := server.ListenAndServe(); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
