// internal/handlers/oauth.go
package handlers

import (
	"encoding/json"
	"jiko-auth/internal/models"
	"jiko-auth/internal/repository"
	"jiko-auth/internal/utils"
	"jiko-auth/pkg/oauth2"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OAuthHandler struct {
	oauthService *oauth2.Service
	clientRepo   *repository.OAuthClientRepository
	userRepo     repository.UserRepository
}

func NewOAuthHandler(oauthService *oauth2.Service, clientRepo *repository.OAuthClientRepository, userRepo repository.UserRepository) *OAuthHandler {
	return &OAuthHandler{
		oauthService: oauthService,
		clientRepo:   clientRepo,
		userRepo:     userRepo,
	}
}

func (h *OAuthHandler) Authorize(c *gin.Context) {
	clientID := c.Query("client_id")
	redirectURI := c.Query("redirect_uri")
	responseType := c.Query("response_type")
	scope := c.Query("scope")
	state := c.Query("state")

	// Валидируем client_id
	client, err := h.clientRepo.GetClient(clientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client_id"})
		return
	}

	// Валидируем redirect_uri
	var redirectURIs []string
	if err := json.Unmarshal([]byte(client.RedirectURIs), &redirectURIs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid client configuration"})
		return
	}

	isValidRedirect := false
	for _, uri := range redirectURIs {
		if uri == redirectURI {
			isValidRedirect = true
			break
		}
	}

	if !isValidRedirect {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid redirect_uri"})
		return
	}

	// Проверяем, авторизован ли пользователь
	userID, exists := c.Get("user_id")
	if !exists {
		// Если пользователь не авторизован, перенаправляем на страницу логина
		loginURL := "/login?redirect=" + url.QueryEscape(c.Request.URL.String())
		c.Redirect(http.StatusFound, loginURL)
		return
	}

	// Если response_type=code, генерируем authorization code
	if responseType == "code" {
		code, err := h.oauthService.GenerateAuthorizationCode(clientID, userID.(string), redirectURI, scope)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate authorization code"})
			return
		}

		// Перенаправляем с кодом
		redirectURL := redirectURI + "?code=" + code + "&state=" + state
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported response_type"})
}

func (h *OAuthHandler) Token(c *gin.Context) {
	grantType := c.PostForm("grant_type")

	switch grantType {
	case "authorization_code":
		code := c.PostForm("code")
		redirectURI := c.PostForm("redirect_uri")
		clientID := c.PostForm("client_id")
		clientSecret := c.PostForm("client_secret")

		tokens, err := h.oauthService.ExchangeCodeForToken(code, redirectURI, clientID, clientSecret)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, tokens)

	case "refresh_token":
		refreshToken := c.PostForm("refresh_token")
		clientID := c.PostForm("client_id")
		clientSecret := c.PostForm("client_secret")

		// Используем правильный метод RefreshToken вместо ExchangeCodeForToken
		tokens, err := h.oauthService.RefreshToken(refreshToken, clientID, clientSecret)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, tokens)

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported grant_type"})
	}
}

func (h *OAuthHandler) GetClients(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	uid, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	clients, err := h.clientRepo.GetUserClients(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get clients"})
		return
	}

	c.JSON(http.StatusOK, clients)
}

func (h *OAuthHandler) CreateClient(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var req struct {
		Name         string   `json:"name" binding:"required"`
		RedirectURIs []string `json:"redirect_uris" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uid, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Генерируем client secret
	secret, err := utils.GenerateRandomString(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate client secret"})
		return
	}

	// Сериализуем RedirectURIs в JSON
	redirectURIsJSON, err := json.Marshal(req.RedirectURIs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize redirect URIs"})
		return
	}

	// Сериализуем Grants в JSON
	grants := []string{"authorization_code", "refresh_token"}
	grantsJSON, err := json.Marshal(grants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize grants"})
		return
	}

	// Исправлено: создаем объект models.OAuthClient вместо repository.OAuthClientRepository
	client := &models.OAuthClient{
		UserID:       uid,
		Name:         req.Name,
		Secret:       secret,
		RedirectURIs: string(redirectURIsJSON),
		Grants:       string(grantsJSON),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err = h.clientRepo.CreateClient(client)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create client"})
		return
	}

	// Возвращаем клиента с секретом (только один раз!)
	c.JSON(http.StatusCreated, client)
}

func (h *OAuthHandler) CreateToken(c *gin.Context) {
	// Реализация создания токена для клиента
	clientID := c.Param("id")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Проверяем, принадлежит ли клиент пользователю
	client, err := h.clientRepo.GetClient(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	if client.UserID.String() != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Генерируем токен
	token, err := utils.GenerateRandomString(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Сохраняем токен в базе данных
	// (реализация зависит от вашей структуры базы данных)

	c.JSON(http.StatusCreated, gin.H{"token": token})
}

func (h *OAuthHandler) GetAllClients(c *gin.Context) {
	clients, err := h.clientRepo.GetAllClients()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get clients"})
		return
	}

	c.JSON(http.StatusOK, clients)
}

func (h *OAuthHandler) AdminCreateClient(c *gin.Context) {
	var req struct {
		UserID       string   `json:"user_id" binding:"required"`
		Name         string   `json:"name" binding:"required"`
		RedirectURIs []string `json:"redirect_uris" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userUUID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Генерируем client secret
	secret, err := utils.GenerateRandomString(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate client secret"})
		return
	}

	// Сериализуем RedirectURIs в JSON
	redirectURIsJSON, err := json.Marshal(req.RedirectURIs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize redirect URIs"})
		return
	}

	// Сериализуем Grants в JSON
	grants := []string{"authorization_code", "refresh_token"}
	grantsJSON, err := json.Marshal(grants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize grants"})
		return
	}

	client := &models.OAuthClient{
		UserID:       userUUID,
		Name:         req.Name,
		Secret:       secret,
		RedirectURIs: string(redirectURIsJSON),
		Grants:       string(grantsJSON),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err = h.clientRepo.CreateClient(client)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create client"})
		return
	}

	c.JSON(http.StatusCreated, client)
}

func (h *OAuthHandler) AdminUpdateClient(c *gin.Context) {
	clientID := c.Param("id")

	var req struct {
		Name         *string  `json:"name"`
		RedirectURIs []string `json:"redirect_uris"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.clientRepo.GetClient(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	if req.Name != nil {
		client.Name = *req.Name
	}

	if req.RedirectURIs != nil {
		redirectURIsJSON, err := json.Marshal(req.RedirectURIs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize redirect URIs"})
			return
		}
		client.RedirectURIs = string(redirectURIsJSON)
	}

	client.UpdatedAt = time.Now()

	err = h.clientRepo.UpdateClient(client)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update client"})
		return
	}

	c.JSON(http.StatusOK, client)
}

func (h *OAuthHandler) AdminDeleteClient(c *gin.Context) {
	clientID := c.Param("id")

	err := h.clientRepo.DeleteClient(clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete client"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Client deleted successfully"})
}
