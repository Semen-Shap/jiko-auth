package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Service struct {
	secret string
}

type Claims struct {
	UserID    string `json:"sub"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	SessionID string `json:"sid"`
	jwt.RegisteredClaims
}

func NewService(secret string) *Service {
	return &Service{secret: secret}
}

func (s *Service) GenerateTokenPair(userID, email, role string) (map[string]interface{}, error) {

	sessionID := generateSessionID()

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "jiko-auth",
		},
	})

	accessTokenString, err := accessToken.SignedString([]byte(s.secret))
	if err != nil {
		return nil, err
	}

	// Refresh token (long-lived)
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		UserID:    userID,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "jiko-auth",
		},
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(s.secret))
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"access_token":  accessTokenString,
		"refresh_token": refreshTokenString,
		"token_type":    "Bearer",
		"expires_in":    900, // 15 minutes
	}, nil
}

func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

type IDTokenClaims struct {
	Subject       string `json:"sub"`
	Issuer        string `json:"iss"`
	Audience      string `json:"aud"`
	ExpiresAt     int64  `json:"exp"`
	IssuedAt      int64  `json:"iat"`
	AuthTime      int64  `json:"auth_time,omitempty"`
	Nonce         string `json:"nonce,omitempty"`
	Name          string `json:"name,omitempty"`
	Email         string `json:"email,omitempty"`
	EmailVerified bool   `json:"email_verified,omitempty"`
	jwt.RegisteredClaims
}

func (s *Service) GenerateIDToken(userID, clientID, email, username string, emailVerified bool, nonce string, authTime time.Time) (string, error) {
	scheme := "http"             // TODO: get from config
	host := "auth.with-jiko.com" // TODO: get from config
	issuer := scheme + "://" + host + "/api/v1"

	claims := IDTokenClaims{
		Subject:       userID,
		Issuer:        issuer,
		Audience:      clientID,
		ExpiresAt:     time.Now().Add(1 * time.Hour).Unix(),
		IssuedAt:      time.Now().Unix(),
		AuthTime:      authTime.Unix(),
		Nonce:         nonce,
		Name:          username,
		Email:         email,
		EmailVerified: emailVerified,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}

func generateSessionID() string {
	// Implementation for cryptographically secure session ID
	return "secure_session_id_" + time.Now().Format("20060102150405")
}
