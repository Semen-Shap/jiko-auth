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
	EmailVerificationToken  string         `gorm:"type:varchar(255);uniqueIndex" json:"-"`
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
	ID           uuid.UUID `json:"id" db:"id"`
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	Name         string    `json:"name" db:"name"`
	Secret       string    `json:"secret" db:"secret"`
	RedirectURIs []string  `json:"redirect_uris" db:"redirect_uris"`
	Grants       []string  `json:"grants" db:"grants"`
	Scope        string    `json:"scope" db:"scope"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type AuthorizationCode struct {
	Code        string    `json:"code" db:"code"`
	ClientID    uuid.UUID `json:"client_id" db:"client_id"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`
	RedirectURI string    `json:"redirect_uri" db:"redirect_uri"`
	Scope       string    `json:"scope" db:"scope"`
	ExpiresAt   time.Time `json:"expires_at" db:"expires_at"`
	Used        bool      `json:"used" db:"used"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type AccessToken struct {
	Token     string    `gorm:"primaryKey" json:"token"`
	ClientID  uuid.UUID `json:"client_id"`
	UserID    uuid.UUID `json:"user_id"`
	Scope     string    `json:"scope"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type RefreshToken struct {
	Token       string    `gorm:"primaryKey" json:"token"`
	AccessToken string    `json:"access_token"`
	ClientID    uuid.UUID `json:"client_id"`
	UserID      uuid.UUID `json:"user_id"`
	Scope       string    `json:"scope"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}
