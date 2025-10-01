package repository

import (
	"context"
	"jiko-auth/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SecurityRepository interface {
	CreateLoginAttempt(ctx context.Context, attempt *models.LoginAttempt) error
	GetUserLoginHistory(ctx context.Context, userID uuid.UUID, limit int) ([]*models.LoginAttempt, error)
	GetLoginAttemptByID(ctx context.Context, id uuid.UUID) (*models.LoginAttempt, error)
	CreateNotification(ctx context.Context, notification *models.SecurityNotification) error
	GetUserNotifications(ctx context.Context, userID uuid.UUID, unreadOnly bool) ([]*models.SecurityNotification, error)
	MarkNotificationAsRead(ctx context.Context, notificationID uuid.UUID) error
}

type securityRepository struct {
	db *gorm.DB
}

func NewSecurityRepository(db *gorm.DB) SecurityRepository {
	return &securityRepository{db: db}
}

func (r *securityRepository) CreateLoginAttempt(ctx context.Context, attempt *models.LoginAttempt) error {
	return r.db.WithContext(ctx).Create(attempt).Error
}

func (r *securityRepository) GetUserLoginHistory(ctx context.Context, userID uuid.UUID, limit int) ([]*models.LoginAttempt, error) {
	var attempts []*models.LoginAttempt
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&attempts).Error
	return attempts, err
}

func (r *securityRepository) GetLoginAttemptByID(ctx context.Context, id uuid.UUID) (*models.LoginAttempt, error) {
	var attempt models.LoginAttempt
	err := r.db.WithContext(ctx).First(&attempt, "id = ?", id).Error
	return &attempt, err
}

func (r *securityRepository) CreateNotification(ctx context.Context, notification *models.SecurityNotification) error {
	return r.db.WithContext(ctx).Create(notification).Error
}

func (r *securityRepository) GetUserNotifications(ctx context.Context, userID uuid.UUID, unreadOnly bool) ([]*models.SecurityNotification, error) {
	var notifications []*models.SecurityNotification
	query := r.db.WithContext(ctx).Where("user_id = ?", userID)

	if unreadOnly {
		query = query.Where("read = ?", false)
	}

	err := query.Order("sent_at DESC").Find(&notifications).Error
	return notifications, err
}

func (r *securityRepository) MarkNotificationAsRead(ctx context.Context, notificationID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&models.SecurityNotification{}).
		Where("id = ?", notificationID).
		Update("read", true).Error
}
