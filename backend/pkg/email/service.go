package email

import (
	"fmt"
	"jiko-auth/internal/config"
	"jiko-auth/internal/models"
	"jiko-auth/pkg/logger"
	"net/smtp"
	"strings"

	"go.uber.org/zap"
)

type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUsername string
	smtpPassword string
	fromEmail    string
	baseURL      string
}

func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		smtpHost:     cfg.SmtpHost,
		smtpPort:     cfg.SmtpPort,
		smtpUsername: cfg.SmtpUsername,
		smtpPassword: cfg.SmtpPassword,
		fromEmail:    cfg.SmtpFromEmail,
		baseURL:      cfg.AppUrl,
	}
}

func (s *EmailService) SendVerificationEmail(to, token string) error {
	if s.smtpHost == "" || s.smtpUsername == "" || s.smtpPassword == "" {
		logger.Info("SMTP не настроен, письмо не отправлено",
			zap.String("to", to),
			zap.String("token", token))
		return fmt.Errorf("SMTP не настроен")
	}

	verificationLink := fmt.Sprintf("%s/verify-email?token=%s",
		s.baseURL, token)

	htmlBody := fmt.Sprintf(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Подтверждение email для JIKO</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                    line-height: 1.5;
                }
                .verification-link {
                    display: inline-block;
                    margin: 20px 0;
                    padding: 12px 24px;
                    background-color: #2563eb;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 16px;
                }
                .footer {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
                .link-text {
                    word-break: break-all;
                    color: #666;
                    font-size: 14px;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <h2>Добро пожаловать в JIKO!</h2>
            <p>Для подтверждения вашего email нажмите на кнопку ниже:</p>
            <p>
                <a href="%s" class="verification-link">Подтвердить email</a>
            </p>
            <p class="link-text">Или скопируйте ссылку в браузер: %s</p>
            <p>Ссылка действительна 24 часа.</p>
            <div class="footer">
                <p>Если вы не регистрировались в JIKO, проигнорируйте это письмо.</p>
            </div>
        </body>
        </html>
    `, verificationLink, verificationLink)

	// Create email message
	from := s.fromEmail
	toList := []string{to}

	msg := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: Подтверждение email для JIKO\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n%s",
		from, strings.Join(toList, ","), htmlBody))

	// Authenticate with SMTP server
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	// Send email
	err := smtp.SendMail(s.smtpHost+":"+s.smtpPort, auth, from, toList, msg)
	if err != nil {
		logger.Error("Ошибка отправки письма",
			zap.String("to", to),
			zap.Error(err))
		return fmt.Errorf("ошибка отправки: %w", err)
	}

	logger.Info("Письмо подтверждения отправлено",
		zap.String("to", to))
	return nil
}

// Метод по отправке письма о входе
func (s *EmailService) SendSecurityNotification(email string, notification *models.SecurityNotification) error {
	if s.smtpHost == "" || s.smtpUsername == "" || s.smtpPassword == "" {
		logger.Info("SMTP не настроен, письмо безопасности не отправлено",
			zap.String("to", email),
			zap.String("type", notification.Type))
		return fmt.Errorf("SMTP не настроен")
	}

	htmlBody := fmt.Sprintf(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>%s</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                .security-alert { background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
                .info { color: #666; font-size: 14px; margin: 10px 0; }
                .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <h2>%s</h2>
            <div class="security-alert">
                <p>%s</p>
            </div>
            <div class="footer">
                <p>Если вы не совершали этот вход, немедленно смените пароль и проверьте настройки безопасности.</p>
            </div>
        </body>
        </html>
    `, notification.Title, notification.Title, notification.Message)

	from := s.fromEmail
	toList := []string{email}

	msg := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n%s",
		from, strings.Join(toList, ","), notification.Title, htmlBody))

	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	err := smtp.SendMail(s.smtpHost+":"+s.smtpPort, auth, from, toList, msg)
	if err != nil {
		logger.Error("Ошибка отправки письма безопасности",
			zap.String("to", email),
			zap.Error(err))
		return fmt.Errorf("ошибка отправки: %w", err)
	}

	logger.Info("Письмо безопасности отправлено", zap.String("to", email))
	return nil
}
