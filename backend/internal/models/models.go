package models

import (
	"encoding/json"
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
	RedirectURIs string    `gorm:"type:text" json:"redirect_uris"`
	Grants       string    `gorm:"type:text" json:"grants"`
	Scope        string    `gorm:"type:varchar(500)" json:"scope"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type AuthorizationCode struct {
	Code                string    `gorm:"type:varchar(255);primaryKey" json:"code"`
	ClientID            uuid.UUID `gorm:"type:uuid;not null" json:"client_id"`
	UserID              uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	RedirectURI         string    `gorm:"type:text" json:"redirect_uri"`
	Scope               string    `gorm:"type:varchar(500)" json:"scope"`
	ExpiresAt           time.Time `gorm:"not null" json:"expires_at"`
	Used                bool      `gorm:"default:false" json:"used"`
	CreatedAt           time.Time `gorm:"autoCreateTime" json:"created_at"`
	CodeChallenge       string    `gorm:"type:text" json:"codeChallenge"`
	CodeChallengeMethod string    `gorm:"type:text" json:"codeChallengeMethod"`
	Nonce               string    `gorm:"type:varchar(255)" json:"nonce"`
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

// Admin DTOs for API responses
type AdminUserResponse struct {
	ID            uuid.UUID  `json:"id"`
	Username      string     `json:"username"`
	Email         string     `json:"email"`
	EmailVerified bool       `json:"email_verified"`
	Role          string     `json:"role"`
	LastLogin     *time.Time `json:"last_login"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type AdminClientResponse struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	RedirectURIs []string  `json:"redirect_uris"`
	Grants       []string  `json:"grants"`
	Scope        string    `json:"scope"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Admin request structures
type AdminCreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required,oneof=user admin"`
}

type AdminUpdateUserRequest struct {
	Username      *string `json:"username,omitempty" binding:"omitempty,min=3"`
	Email         *string `json:"email,omitempty" binding:"omitempty,email"`
	Password      *string `json:"password,omitempty" binding:"omitempty,min=8"`
	Role          *string `json:"role,omitempty" binding:"omitempty,oneof=user admin"`
	EmailVerified *bool   `json:"email_verified,omitempty"`
}

// Admin statistics
type AdminStats struct {
	TotalUsers         int64 `json:"total_users"`
	TotalVerifiedUsers int64 `json:"total_verified_users"`
	TotalClients       int64 `json:"total_clients"`
	TotalActiveTokens  int64 `json:"total_active_tokens"`
	NewUsersToday      int64 `json:"new_users_today"`
	NewClientsToday    int64 `json:"new_clients_today"`
}

// LoginAttempt представляет попытку входа пользователя
type LoginAttempt struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Email       string    `gorm:"not null" json:"email"`
	Timestamp   time.Time `gorm:"not null" json:"timestamp"`
	IPAddress   string    `gorm:"not null" json:"ip_address"`
	UserAgent   string    `gorm:"type:text" json:"user_agent"`
	DeviceInfo  Device    `gorm:"embedded;embeddedPrefix:device_" json:"device_info"`
	GeoLocation Location  `gorm:"embedded;embeddedPrefix:geo_" json:"geo_location"`
	SessionID   string    `gorm:"type:varchar(255)" json:"session_id"`
	Status      string    `gorm:"type:varchar(20);not null" json:"status"` // "success", "failed", "suspicious"

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// Device содержит информацию об устройстве и браузере
type Device struct {
	Browser        string `json:"browser" gorm:"-"`
	BrowserVersion string `json:"browser_version" gorm:"-"`
	OS             string `json:"os" gorm:"-"`
	OSVersion      string `json:"os_version" gorm:"-"`
	DeviceType     string `json:"device_type" gorm:"-"`
	DeviceModel    string `json:"device_model" gorm:"-"`
	IsMobile       bool   `json:"is_mobile" gorm:"-"`

	// Поля для хранения в БД (сериализованные)
	DeviceData string `gorm:"type:text" json:"-"`
}

// Location содержит географическую информацию
type Location struct {
	City        string  `json:"city" gorm:"-"`
	Country     string  `json:"country" gorm:"-"`
	CountryCode string  `json:"country_code" gorm:"-"`
	Region      string  `json:"region" gorm:"-"`
	Latitude    float64 `json:"latitude" gorm:"-"`
	Longitude   float64 `json:"longitude" gorm:"-"`
	Timezone    string  `json:"timezone" gorm:"-"`

	// Поля для хранения в БД (сериализованные)
	LocationData string `gorm:"type:text" json:"-"`
}

// SecurityNotification представляет уведомление о безопасности
type SecurityNotification struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	LoginAttemptID uuid.UUID `gorm:"type:uuid;not null" json:"login_attempt_id"`
	Title          string    `gorm:"type:varchar(255);not null" json:"title"`
	Message        string    `gorm:"type:text;not null" json:"message"`
	Type           string    `gorm:"type:varchar(50);not null" json:"type"` // "login", "suspicious", "password_change"
	SentAt         time.Time `gorm:"not null" json:"sent_at"`
	Read           bool      `gorm:"default:false" json:"read"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// BeforeSave для сериализации данных перед сохранением в БД
func (la *LoginAttempt) BeforeSave(tx *gorm.DB) error {
	// Сериализуем DeviceInfo в JSON
	if deviceData, err := json.Marshal(la.DeviceInfo); err == nil {
		la.DeviceInfo.DeviceData = string(deviceData)
	}

	// Сериализуем GeoLocation в JSON
	if locationData, err := json.Marshal(la.GeoLocation); err == nil {
		la.GeoLocation.LocationData = string(locationData)
	}

	return nil
}

// AfterFind для десериализации данных после загрузки из БД
func (la *LoginAttempt) AfterFind(tx *gorm.DB) error {
	// Десериализуем DeviceInfo из JSON
	if la.DeviceInfo.DeviceData != "" {
		json.Unmarshal([]byte(la.DeviceInfo.DeviceData), &la.DeviceInfo)
	}

	// Десериализуем GeoLocation из JSON
	if la.GeoLocation.LocationData != "" {
		json.Unmarshal([]byte(la.GeoLocation.LocationData), &la.GeoLocation)
	}

	return nil
}
