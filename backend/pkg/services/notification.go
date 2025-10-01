package services

import (
	"fmt"
	"jiko-auth/internal/models"
	"time"

	"github.com/google/uuid"
)

type NotificationService struct{}

func NewNotificationService() *NotificationService {
	return &NotificationService{}
}

func (s *NotificationService) CreateLoginNotification(attempt *models.LoginAttempt, user *models.User) *models.SecurityNotification {
	parser := NewUserAgentParser()
	browserName := parser.GetFriendlyBrowserName(attempt.DeviceInfo)

	locationInfo := attempt.GeoLocation.City
	if locationInfo == "" {
		locationInfo = "Местоположение неизвестно"
	}

	message := fmt.Sprintf(
		"Совершён вход в ваш аккаунт %s\n\n"+
			"Дата входа: %s\n"+
			"Устройство: %s\n"+
			"Браузер: %s\n"+
			"Местоположение: %s\n\n"+
			"Если это были не вы, срочно завершите этот подозрительный сеанс.",
		user.Email,
		attempt.Timestamp.Format("2 January 2006 в 15:04"),
		attempt.DeviceInfo.DeviceModel,
		browserName,
		locationInfo,
	)

	return &models.SecurityNotification{
		ID:             uuid.New(),
		UserID:         user.ID,
		LoginAttemptID: attempt.ID,
		Title:          "Новый вход в ваш аккаунт",
		Message:        message,
		Type:           "login",
		SentAt:         time.Now(),
		Read:           false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
}
