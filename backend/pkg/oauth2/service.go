// pkg/oauth2/service.go
package oauth2

import (
	"errors"
	"jiko-auth/internal/models"
	"jiko-auth/internal/utils"
	"time"
)

type AuthCodeRepository interface {
	SaveAuthorizationCode(code, clientID, userID, redirectURI, scope string, expiresAt time.Time) error
	GetAuthorizationCode(code string) (*models.AuthorizationCode, error)
	MarkAuthorizationCodeUsed(code string) error
}

type TokenRepository interface {
	SaveAccessToken(token, clientID, userID, scope string, expiresAt time.Time) error
	SaveRefreshToken(token, accessToken, clientID, userID, scope string, expiresAt time.Time) error
	GetRefreshToken(token string) (*models.RefreshToken, error)
	GetAccessToken(token string) (*models.AccessToken, error)
}

type ClientRepository interface {
	GetClient(clientID string) (*models.OAuthClient, error) // Используем models
	ValidateClientSecret(clientID, clientSecret string) (bool, error)
}

type Service struct {
	authCodeRepo AuthCodeRepository
	tokenRepo    TokenRepository
	clientRepo   ClientRepository
}

func NewService(authCodeRepo AuthCodeRepository, tokenRepo TokenRepository, clientRepo ClientRepository) *Service {
	return &Service{
		authCodeRepo: authCodeRepo,
		tokenRepo:    tokenRepo,
		clientRepo:   clientRepo,
	}
}

func (s *Service) GenerateAuthorizationCode(clientID, userID, redirectURI, scope string) (string, error) {
	code, err := utils.GenerateRandomString(32)
	if err != nil {
		return "", err
	}

	expiresAt := time.Now().Add(10 * time.Minute)

	// Сохраняем код перед возвратом
	err = s.authCodeRepo.SaveAuthorizationCode(code, clientID, userID, redirectURI, scope, expiresAt)
	if err != nil {
		return "", err
	}

	return code, nil
}

func (s *Service) RefreshToken(refreshToken, clientID, clientSecret string) (map[string]interface{}, error) {
	// Проверяем client_id и client_secret
	isValid, err := s.clientRepo.ValidateClientSecret(clientID, clientSecret)
	if err != nil || !isValid {
		return nil, errors.New("invalid client credentials")
	}

	// Получаем информацию о refresh token
	refreshTokenInfo, err := s.tokenRepo.GetRefreshToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Проверяем, не истек ли срок действия refresh token
	if time.Now().After(refreshTokenInfo.ExpiresAt) {
		return nil, errors.New("refresh token expired")
	}

	// Генерируем новый access token
	accessToken, err := utils.GenerateRandomString(32)
	if err != nil {
		return nil, err
	}
	accessTokenExp := time.Now().Add(1 * time.Hour)

	// Сохраняем новый access token
	err = s.tokenRepo.SaveAccessToken(accessToken, clientID, refreshTokenInfo.UserID.String(), refreshTokenInfo.Scope, accessTokenExp)
	if err != nil {
		return nil, err
	}

	// Возвращаем новый access token
	return map[string]interface{}{
		"access_token": accessToken,
		"token_type":   "Bearer",
		"expires_in":   int64(time.Until(accessTokenExp).Seconds()),
		"scope":        refreshTokenInfo.Scope,
	}, nil
}

func (s *Service) ExchangeCodeForToken(code, redirectURI, clientID, clientSecret string) (map[string]interface{}, error) {
	// Проверяем client_id и client_secret
	isValid, err := s.clientRepo.ValidateClientSecret(clientID, clientSecret)
	if err != nil || !isValid {
		return nil, err
	}

	// Получаем код авторизации
	authCode, err := s.authCodeRepo.GetAuthorizationCode(code)
	if err != nil {
		return nil, err
	}

	// Проверяем, не использован ли уже код
	if authCode.Used {
		return nil, errors.New("authorization code already used")
	}

	// Проверяем, не истек ли срок действия кода
	if time.Now().After(authCode.ExpiresAt) {
		return nil, errors.New("authorization code expired")
	}

	// Проверяем redirect_uri
	if authCode.RedirectURI != redirectURI {
		return nil, errors.New("redirect_uri mismatch")
	}

	// Помечаем код как использованный
	err = s.authCodeRepo.MarkAuthorizationCodeUsed(code)
	if err != nil {
		return nil, err
	}

	// Генерируем access token
	accessToken, err := utils.GenerateRandomString(32)
	if err != nil {
		return nil, err
	}
	accessTokenExp := time.Now().Add(1 * time.Hour)

	// Генерируем refresh token
	refreshToken, err := utils.GenerateRandomString(32)
	if err != nil {
		return nil, err
	}
	refreshTokenExp := time.Now().Add(7 * 24 * time.Hour)

	// Сохраняем токены
	err = s.tokenRepo.SaveAccessToken(accessToken, clientID, authCode.UserID.String(), authCode.Scope, accessTokenExp)
	if err != nil {
		return nil, err
	}

	err = s.tokenRepo.SaveRefreshToken(refreshToken, accessToken, clientID, authCode.UserID.String(), authCode.Scope, refreshTokenExp)
	if err != nil {
		return nil, err
	}

	// Возвращаем токены
	return map[string]interface{}{
		"access_token":  accessToken,
		"token_type":    "Bearer",
		"expires_in":    int64(time.Until(accessTokenExp).Seconds()),
		"refresh_token": refreshToken,
		"scope":         authCode.Scope,
	}, nil
}
