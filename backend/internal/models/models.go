package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                      uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Username                string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"username"`
	Email                   string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Password                string         `gorm:"type:varchar(255);not null" json:"-"`
	EmailVerified           bool           `gorm:"default:false" json:"email_verified"`
	EmailVerificationToken  *string        `gorm:"type:varchar(255)" json:"-"`
	EmailVerificationSentAt time.Time      `json:"-"`
	Role                    string         `gorm:"type:varchar(50);default:'user'" json:"role"`
	LastLogin               *time.Time     `json:"last_login,omitempty"`
	LoginAttempts           int            `gorm:"default:0" json:"-"`
	LockedUntil             *time.Time     `json:"-"`
	CreatedAt               time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt               time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt               gorm.DeletedAt `gorm:"index" json:"-"`
}
type OAuthClient struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Name         string    `gorm:"type:varchar(255);not null" json:"name"`
	Secret       string    `gorm:"type:varchar(255);not null" json:"secret"`
	RedirectURIs string    `gorm:"type:text" json:"redirect_uris"` // JSON строка вместо массива
	Grants       string    `gorm:"type:text" json:"grants"`        // JSON строка вместо массива
	Scope        string    `gorm:"type:varchar(500)" json:"scope"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type AuthorizationCode struct {
	Code        string    `gorm:"type:varchar(255);primaryKey" json:"code"`
	ClientID    uuid.UUID `gorm:"type:uuid;not null" json:"client_id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	RedirectURI string    `gorm:"type:text" json:"redirect_uri"`
	Scope       string    `gorm:"type:varchar(500)" json:"scope"`
	ExpiresAt   time.Time `gorm:"not null" json:"expires_at"`
	Used        bool      `gorm:"default:false" json:"used"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type AccessToken struct {
	Token     string    `gorm:"type:varchar(255);primaryKey" json:"token"`
	ClientID  uuid.UUID `gorm:"type:uuid;not null" json:"client_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Scope     string    `gorm:"type:varchar(500)" json:"scope"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type RefreshToken struct {
	Token       string    `gorm:"type:varchar(255);primaryKey" json:"token"`
	AccessToken string    `gorm:"type:varchar(255)" json:"access_token"`
	ClientID    uuid.UUID `gorm:"type:uuid;not null" json:"client_id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Scope       string    `gorm:"type:varchar(500)" json:"scope"`
	ExpiresAt   time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}
