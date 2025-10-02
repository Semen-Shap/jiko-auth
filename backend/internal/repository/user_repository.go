package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"jiko-auth/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *models.User) error
	GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) // Изменено на uuid.UUID
	GetUserByIDString(id string) (*models.User, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetUserByUsername(ctx context.Context, username string) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error
	GetUserByVerificationToken(ctx context.Context, token string) (*models.User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error // Изменено на uuid.UUID
	ListUsers(ctx context.Context, limit, offset int) ([]*models.User, error)
	MarkEmailAsVerified(ctx context.Context, userID uuid.UUID) error

	// Admin operations
	GetUsersWithFilters(ctx context.Context, limit, offset int, role, emailVerified string) ([]*models.User, error)
	GetUserCount(ctx context.Context) (int64, error)
	GetUserCountByDateRange(ctx context.Context, start, end time.Time) (int64, error)

	GetVerifiedUserCount(ctx context.Context) (int64, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) CreateUser(ctx context.Context, user *models.User) error {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (r *userRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // User not found - not an error
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}
	return &user, nil
}

func (r *userRepository) GetUserByIDString(id string) (*models.User, error) {
	uuidID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}
	return r.GetUserByID(context.Background(), uuidID)
}

func (r *userRepository) DeleteUser(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.User{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

func (r *userRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	result := r.db.WithContext(ctx).Where("email = ?", email).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // Пользователь не найден - это нормально
		}
		return nil, fmt.Errorf("failed to get user by email: %w", result.Error)
	}
	return &user, nil
}

func (r *userRepository) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	result := r.db.WithContext(ctx).Where("username = ?", username).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // Пользователь не найден - это нормально
		}
		return nil, fmt.Errorf("failed to get user by username: %w", result.Error)
	}
	return &user, nil
}

func (r *userRepository) UpdateUser(ctx context.Context, user *models.User) error {
	if err := r.db.WithContext(ctx).Save(user).Error; err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

func (r *userRepository) ListUsers(ctx context.Context, limit, offset int) ([]*models.User, error) {
	var users []*models.User
	if err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	return users, nil
}

func (r *userRepository) GetUserByVerificationToken(ctx context.Context, token string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("email_verification_token = ?", token).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Токен не найден - это не ошибка
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) MarkEmailAsVerified(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Exec(
		"UPDATE users SET email_verified = true, email_verification_token = NULL, updated_at = ? WHERE id = ?",
		time.Now(), userID,
	).Error
}

// Admin operations
func (r *userRepository) GetUsersWithFilters(ctx context.Context, limit, offset int, role, emailVerified string) ([]*models.User, error) {
	query := r.db.WithContext(ctx)

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if emailVerified != "" {
		if emailVerified == "true" {
			query = query.Where("email_verified = true")
		} else if emailVerified == "false" {
			query = query.Where("email_verified = false")
		}
	}

	var users []*models.User
	if err := query.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to list users with filters: %w", err)
	}
	return users, nil
}

func (r *userRepository) GetUserCount(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get user count: %w", err)
	}
	return count, nil
}

func (r *userRepository) GetUserCountByDateRange(ctx context.Context, start, end time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).
		Where("created_at BETWEEN ? AND ?", start, end).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get user count by date range: %w", err)
	}
	return count, nil
}

func (r *userRepository) GetVerifiedUserCount(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).
		Where("email_verified = ?", true).
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get verified user count: %w", err)
	}
	return count, nil
}
