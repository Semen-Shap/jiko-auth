package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	AppEnv         string
	AppUser        string
	AppPassword    string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	ServerPort     string
	JWTSecret      string
	DBMaxOpenConns int
	DBMaxIdleConns int
	DBMaxIdleTime  time.Duration
	DBMaxLifeTime  time.Duration
	SmtpHost       string
	SmtpPort       string
	SmtpUsername   string
	SmtpPassword   string
	SmtpFromEmail  string
	AppUrl         string
}

func Load() *Config {
	return &Config{
		AppEnv:         getEnv("APP_ENV", "development"),
		AppUrl:         getEnv("APP_URL", "http://localhost:8080"),
		AppUser:        getEnv("APP_USER", "admin"),
		AppPassword:    getEnv("APP_PASSWORD", "admin"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "admin"),
		DBPassword:     getEnv("DB_PASSWORD", "admin"),
		DBName:         getEnv("DB_NAME", "assetdb"),
		ServerPort:     getEnv("SERVER_PORT", "8080"),
		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key"),
		DBMaxOpenConns: getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
		DBMaxIdleConns: getEnvAsInt("DB_MAX_IDLE_CONNS", 25),
		DBMaxIdleTime:  getEnvAsDuration("DB_MAX_IDLE_TIME", time.Minute*5),
		DBMaxLifeTime:  getEnvAsDuration("DB_MAX_LIFE_TIME", time.Hour*1),
		SmtpHost:       getEnv("SMTP_HOST", ""),
		SmtpPort:       getEnv("SMTP_PORT", ""),
		SmtpUsername:   getEnv("SMTP_USERNAME", ""),
		SmtpPassword:   getEnv("SMTP_PASSWORD", ""),
		SmtpFromEmail:  getEnv("SMTP_FROM_EMAIL", ""),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvAsInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	result, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return result
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	result, err := time.ParseDuration(value)
	if err != nil {
		return defaultValue
	}
	return result
}
