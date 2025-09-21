package repository

import (
	"context"
	"jiko-auth/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OAuthClientRepository struct {
	db *gorm.DB
}

func NewOAuthClientRepository(db *gorm.DB) *OAuthClientRepository {
	return &OAuthClientRepository{db: db}
}

func (r *OAuthClientRepository) CreateClient(client *models.OAuthClient) error {
	return r.db.Create(client).Error
}

func (r *OAuthClientRepository) GetClient(clientID string) (*models.OAuthClient, error) {
	var client models.OAuthClient
	err := r.db.First(&client, "id = ?", clientID).Error
	return &client, err
}

func (r *OAuthClientRepository) ValidateClientSecret(clientID, clientSecret string) (bool, error) {
	var count int64
	err := r.db.Model(&models.OAuthClient{}).
		Where("id = ? AND secret = ?", clientID, clientSecret).
		Count(&count).Error
	return count > 0, err
}

func (r *OAuthClientRepository) GetUserClients(userID uuid.UUID) ([]*models.OAuthClient, error) {
	var clients []*models.OAuthClient
	err := r.db.Where("user_id = ?", userID).Find(&clients).Error
	return clients, err
}

func (r *OAuthClientRepository) GetAllClients() ([]*models.OAuthClient, error) {
	var clients []*models.OAuthClient
	err := r.db.Find(&clients).Error
	return clients, err
}

func (r *OAuthClientRepository) UpdateClient(client *models.OAuthClient) error {
	return r.db.Save(client).Error
}

func (r *OAuthClientRepository) DeleteClient(clientID string) error {
	return r.db.Where("id = ?", clientID).Delete(&models.OAuthClient{}).Error
}

// Admin methods
func (r *OAuthClientRepository) GetClientCount(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.OAuthClient{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *OAuthClientRepository) GetClientCountByDateRange(ctx context.Context, start, end time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.OAuthClient{}).
		Where("created_at BETWEEN ? AND ?", start, end).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *OAuthClientRepository) GetClientsWithPagination(ctx context.Context, limit, offset int) ([]*models.OAuthClient, error) {
	var clients []*models.OAuthClient
	if err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&clients).Error; err != nil {
		return nil, err
	}
	return clients, nil
}

type AuthCodeRepository struct {
	db *gorm.DB
}

func NewAuthCodeRepository(db *gorm.DB) *AuthCodeRepository {
	return &AuthCodeRepository{db: db}
}

func (r *AuthCodeRepository) SaveAuthorizationCode(code, clientID, userID, redirectURI, scope string, expiresAt time.Time) error {
	clientUUID, err := uuid.Parse(clientID)
	if err != nil {
		return err
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	authCode := &models.AuthorizationCode{
		Code:        code,
		ClientID:    clientUUID,
		UserID:      userUUID,
		RedirectURI: redirectURI,
		Scope:       scope,
		ExpiresAt:   expiresAt,
		Used:        false,
		CreatedAt:   time.Now(),
	}

	return r.db.Create(authCode).Error
}

func (r *AuthCodeRepository) GetAuthorizationCode(code string) (*models.AuthorizationCode, error) {
	var authCode models.AuthorizationCode
	err := r.db.First(&authCode, "code = ?", code).Error
	return &authCode, err
}

func (r *AuthCodeRepository) MarkAuthorizationCodeUsed(code string) error {
	return r.db.Model(&models.AuthorizationCode{}).
		Where("code = ?", code).
		Update("used", true).Error
}

type TokenRepository struct {
	db *gorm.DB
}

func NewTokenRepository(db *gorm.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

func (r *TokenRepository) SaveAccessToken(token, clientID, userID, scope string, expiresAt time.Time) error {
	clientUUID, err := uuid.Parse(clientID)
	if err != nil {
		return err
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	accessToken := &models.AccessToken{
		Token:     token,
		ClientID:  clientUUID,
		UserID:    userUUID,
		Scope:     scope,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}

	return r.db.Create(accessToken).Error
}

func (r *TokenRepository) SaveRefreshToken(token, accessToken, clientID, userID, scope string, expiresAt time.Time) error {
	clientUUID, err := uuid.Parse(clientID)
	if err != nil {
		return err
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	refreshToken := &models.RefreshToken{
		Token:       token,
		AccessToken: accessToken,
		ClientID:    clientUUID,
		UserID:      userUUID,
		Scope:       scope,
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now(),
	}

	return r.db.Create(refreshToken).Error
}

func (r *TokenRepository) GetRefreshToken(token string) (*models.RefreshToken, error) {
	var refreshToken models.RefreshToken
	err := r.db.First(&refreshToken, "token = ?", token).Error
	return &refreshToken, err
}

func (r *TokenRepository) GetAccessToken(token string) (*models.AccessToken, error) {
	var accessToken models.AccessToken
	err := r.db.First(&accessToken, "token = ?", token).Error
	return &accessToken, err
}
