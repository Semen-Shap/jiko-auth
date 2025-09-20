package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"jiko-auth/internal/config"
	"jiko-auth/internal/database/migrations"
	"jiko-auth/pkg/logger"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var DB *gorm.DB

func Init(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC",
		cfg.DBHost, // Используем определенный хост
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
	)

	logger.Info(fmt.Sprintf("Connecting to database at host: %s, user: %s, dbname: %s", cfg.DBHost, cfg.DBUser, cfg.DBName))

	gormConfig := &gorm.Config{
		Logger: gormLogger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			gormLogger.Config{
				SlowThreshold:             200 * time.Millisecond,
				LogLevel:                  gormLogger.Warn,
				IgnoreRecordNotFoundError: true,
				Colorful:                  true,
			},
		),
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "asset_",
			SingularTable: false,
		},
		TranslateError: true,
	}

	var err error
	var db *gorm.DB

	// Попытки подключения с экспоненциальной задержкой
	for i := 0; i < 10; i++ {
		db, err = gorm.Open(postgres.Open(dsn), gormConfig)
		if err != nil {
			waitTime := time.Duration(i*i) * time.Second
			fmt.Printf("Failed to connect to database (attempt %d/10), waiting %v: %v",
				i+1, waitTime, err)
			time.Sleep(waitTime)
			continue
		}
		break
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database after 10 attempts: %w", err)
	}

	DB = db

	sqlDB, err := DB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.DBMaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.DBMaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.DBMaxLifeTime)
	sqlDB.SetConnMaxIdleTime(cfg.DBMaxIdleTime)

	// Проверка соединения
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	// Миграции
	if err := migrations.RunMigrations(DB); err != nil {
		return nil, fmt.Errorf("migrations failed: %w", err)
	}

	logger.Info("Database connection established")
	return DB, nil
}

func Close() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

func GetDB(ctx context.Context) *gorm.DB {
	return DB.WithContext(ctx)
}

// HealthCheck проверяет доступность базы данных
func HealthCheck(ctx context.Context) error {
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	return sqlDB.PingContext(ctx)
}
