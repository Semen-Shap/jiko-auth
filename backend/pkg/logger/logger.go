package logger

import (
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	once   sync.Once
	logger *zap.Logger
)

func Init(env string) *zap.Logger {
	once.Do(func() {
		config := zap.NewProductionEncoderConfig()
		config.EncodeTime = zapcore.ISO8601TimeEncoder
		config.EncodeLevel = zapcore.CapitalLevelEncoder

		consoleEncoder := zapcore.NewConsoleEncoder(config)

		var core zapcore.Core
		var logLevel zapcore.Level

		if env == "production" {
			logLevel = zapcore.InfoLevel
			core = zapcore.NewTee(
				zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), logLevel),
				zapcore.NewCore(zapcore.NewJSONEncoder(config), zapcore.AddSync(os.Stderr), zapcore.ErrorLevel),
			)
		} else {
			logLevel = zapcore.DebugLevel
			core = zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), logLevel)
		}

		logger = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	})
	return logger
}

func Warn(msg string, fields ...zap.Field) {
	zap.L().Warn(msg, fields...)
}

func Get() *zap.Logger {
	if logger == nil {
		return Init("development")
	}
	return logger
}

func Sync() {
	if logger != nil {
		_ = logger.Sync()
	}
}

// Helper functions for common log operations
func Info(msg string, fields ...zap.Field) {
	Get().Info(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Get().Error(msg, fields...)
}

func Fatal(msg string, fields ...zap.Field) {
	Get().Fatal(msg, fields...)
}

func With(fields ...zap.Field) *zap.Logger {
	return Get().With(fields...)
}

func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		end := time.Now()
		latency := end.Sub(start)

		fields := []zapcore.Field{
			zap.Int("status", c.Writer.Status()),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
			zap.Duration("latency", latency),
		}

		if len(c.Errors) > 0 {
			for _, e := range c.Errors.Errors() {
				Error(e, fields...)
			}
		} else {
			Info(path, fields...)
		}
	}
}
