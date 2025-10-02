// pkg/oauth2/service.go
package oauth2

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"jiko-auth/internal/models"
	"jiko-auth/internal/utils"
	"time"
)

type AuthCodeRepository interface {
	SaveAuthorizationCode(code, clientID, userID, redirectURI, scope string, expiresAt time.Time) error
	GetAuthorizationCode(code string) (*models.AuthorizationCode, error)
	MarkAuthorizationCodeUsed(code string) error
	SaveAuthorizationCodeWithPKCE(code, clientID, userID, redirectURI, scope string, expiresAt time.Time, codeChallenge, codeChallengeMethod string) error
	GetAuthorizationCodeWithPKCE(code string) (*models.AuthorizationCode, error)
}

type TokenRepository interface {
	SaveAccessToken(token, clientID, userID, scope string, expiresAt time.Time) error
	SaveRefreshToken(token, accessToken, clientID, userID, scope string, expiresAt time.Time) error
	GetRefreshToken(token string) (*models.RefreshToken, error)
	GetAccessToken(token string) (*models.AccessToken, error)
	DeleteExpiredTokens() error
	HasRefreshTokenForUserAndClient(userID, clientID string) (bool, error)
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

func (s *Service) GenerateAuthorizationCode(clientID, userID, redirectURI, scope, codeChallenge, codeChallengeMethod string) (string, error) {
	code, err := generateCryptoSecureToken(32)
	if err != nil {
		return "", fmt.Errorf("failed to generate authorization code: %w", err)
	}

	expiresAt := time.Now().Add(10 * time.Minute)

	if codeChallenge != "" && codeChallengeMethod != "" {
		// PKCE flow
		err = s.authCodeRepo.SaveAuthorizationCodeWithPKCE(code, clientID, userID, redirectURI, scope, expiresAt, codeChallenge, codeChallengeMethod)
	} else {
		// Classic flow
		err = s.authCodeRepo.SaveAuthorizationCode(code, clientID, userID, redirectURI, scope, expiresAt)
	}

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

func (s *Service) ExchangeCodeForToken(code, redirectURI, clientID, clientSecret string, codeVerifier string) (map[string]interface{}, error) {
	// Проверяем client_id и client_secret
	isValid, err := s.clientRepo.ValidateClientSecret(clientID, clientSecret)
	if err != nil || !isValid {
		return nil, err
	}

	var authCode *models.AuthorizationCode

	if codeVerifier != "" {
		// PKCE flow: get code with PKCE data
		authCode, err = s.authCodeRepo.GetAuthorizationCodeWithPKCE(code)
		if err != nil {
			return nil, err
		}

		// Validate PKCE
		if err := validatePKCE(authCode.CodeChallenge, authCode.CodeChallengeMethod, codeVerifier); err != nil {
			return nil, err
		}
	} else {
		// Classic OAuth flow: get regular authorization code
		authCode, err = s.authCodeRepo.GetAuthorizationCode(code)
		if err != nil {
			return nil, err
		}
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

func (s *Service) CleanupExpiredTokens() error {
	return s.tokenRepo.DeleteExpiredTokens()
}

func (s *Service) IntrospectToken(token string) (map[string]interface{}, error) {
	// Получаем access token из БД
	accessToken, err := s.tokenRepo.GetAccessToken(token)
	if err != nil {
		// Токен не найден или ошибка
		return map[string]interface{}{
			"active": false,
		}, nil
	}

	// Проверяем срок действия
	if time.Now().After(accessToken.ExpiresAt) {
		return map[string]interface{}{
			"active": false,
		}, nil
	}

	// Возвращаем информацию о токене
	return map[string]interface{}{
		"active":     true,
		"client_id":  accessToken.ClientID.String(),
		"user_id":    accessToken.UserID.String(),
		"scope":      accessToken.Scope,
		"token_type": "Bearer",
		"exp":        accessToken.ExpiresAt.Unix(),
	}, nil
}

func validatePKCE(codeChallenge, codeChallengeMethod, codeVerifier string) error {
	switch codeChallengeMethod {
	case "S256":
		hash := sha256.Sum256([]byte(codeVerifier))
		calculatedChallenge := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:])
		if calculatedChallenge != codeChallenge {
			return errors.New("invalid code verifier")
		}
	case "plain":
		if codeVerifier != codeChallenge {
			return errors.New("invalid code verifier")
		}
	default:
		return errors.New("unsupported code challenge method")
	}
	return nil
}

func generateCryptoSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil

}
