// migrations/migrations.go
package migrations

import (
	"fmt"
	"jiko-auth/internal/models"
	"log"

	"gorm.io/gorm"
)

func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Create UUID extension if not exists
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).Error; err != nil {
		return fmt.Errorf("failed to create uuid extension: %w", err)
	}

	// Автоматическая миграция всех таблиц в правильном порядке
	tables := []interface{}{
		&models.User{},
		&models.OAuthClient{},
		&models.AuthorizationCode{},
		&models.AccessToken{},
		&models.RefreshToken{},
	}

	for _, table := range tables {
		if err := db.AutoMigrate(table); err != nil {
			return fmt.Errorf("failed to auto migrate table: %w", err)
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}
