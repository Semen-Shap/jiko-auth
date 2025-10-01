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

	"jiko-auth/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
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

	// Проверяем, авторизован ли пользователь (используем FlexibleAuthMiddleware)
	authenticated, exists := c.Get("authenticated")
	if !exists || !authenticated.(bool) {
		// Если пользователь не авторизован, перенаправляем на фронтенд страницу авторизации
		frontendURL := "/oauth/authorize"
		queryParams := "?client_id=" + clientID +
			"&redirect_uri=" + url.QueryEscape(redirectURI) +
			"&response_type=" + responseType +
			"&scope=" + scope +
			"&state=" + state
		c.Redirect(http.StatusFound, frontendURL+queryParams)
		return
	}

	// Получаем ID пользователя
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user_id not found in context"})
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

// AuthorizeApproval обрабатывает подтверждение авторизации от пользователя
func (h *OAuthHandler) AuthorizeApproval(c *gin.Context) {
	var req struct {
		ClientID     string `json:"client_id" binding:"required"`
		RedirectURI  string `json:"redirect_uri" binding:"required"`
		ResponseType string `json:"response_type" binding:"required"`
		Scope        string `json:"scope"`
		State        string `json:"state"`
		Action       string `json:"action" binding:"required"` // "approve" или "deny"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем авторизацию
	authenticated, exists := c.Get("authenticated")
	if !exists || !authenticated.(bool) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user_id not found"})
		return
	}

	if req.Action == "deny" {
		// Пользователь отказал в доступе
		c.JSON(http.StatusOK, gin.H{
			"redirect_url": req.RedirectURI + "?error=access_denied&state=" + req.State,
		})
		return
	}

	if req.Action == "approve" && req.ResponseType == "code" {
		// Пользователь разрешил доступ, генерируем код
		code, err := h.oauthService.GenerateAuthorizationCode(req.ClientID, userID.(string), req.RedirectURI, req.Scope)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate authorization code"})
			return
		}

		// Возвращаем URL для перенаправления
		c.JSON(http.StatusOK, gin.H{
			"redirect_url": req.RedirectURI + "?code=" + code + "&state=" + req.State,
		})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
}

// GetClientInfo возвращает информацию о клиенте для страницы авторизации
func (h *OAuthHandler) GetClientInfo(c *gin.Context) {
	clientID := c.Query("client_id")
	if clientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "client_id is required"})
		return
	}

	client, err := h.clientRepo.GetClient(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
		return
	}

	// Возвращаем только публичную информацию о клиенте
	c.JSON(http.StatusOK, gin.H{
		"client_id":  client.ID,
		"name":       client.Name,
		"created_at": client.CreatedAt,
	})
}

func (h *OAuthHandler) Token(c *gin.Context) {
	grantType := c.PostForm("grant_type")
	code := c.PostForm("code")
	redirectURI := c.PostForm("redirect_uri")
	clientID := c.PostForm("client_id")
	clientSecret := c.PostForm("client_secret")

	// Логируем все параметры для отладки
	logger.Info("Token request received",
		zap.String("grant_type", grantType),
		zap.String("code", code),
		zap.String("redirect_uri", redirectURI),
		zap.String("client_id", clientID),
		zap.String("client_secret", clientSecret[:10]+"..."), // не логируем полный secret
		zap.String("content_type", c.GetHeader("Content-Type")),
		zap.String("method", c.Request.Method),
		zap.String("url", c.Request.URL.String()),
	)

	switch grantType {
	case "authorization_code":
		tokens, err := h.oauthService.ExchangeCodeForToken(code, redirectURI, clientID, clientSecret)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, tokens)

	case "refresh_token":
		refreshToken := c.PostForm("refresh_token")

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

func (h *OAuthHandler) UserInfo(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	u := user.(*models.User)

	// Возвращаем профиль пользователя
	c.JSON(http.StatusOK, gin.H{
		"id":       u.ID,
		"username": u.Username,
		"email":    u.Email,
		"role":     u.Role,
	})
}

func (h *OAuthHandler) Introspect(c *gin.Context) {
	token := c.PostForm("token")
	tokenTypeHint := c.PostForm("token_type_hint")
	clientID := c.PostForm("client_id")
	clientSecret := c.PostForm("client_secret")

	// Проверяем обязательные поля
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	// Аутентифицируем клиента
	if clientID == "" || clientSecret == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "client authentication required"})
		return
	}

	isValid, err := h.clientRepo.ValidateClientSecret(clientID, clientSecret)
	if err != nil || !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid client credentials"})
		return
	}

	// Поддерживаем только access_token
	if tokenTypeHint != "" && tokenTypeHint != "access_token" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported token_type_hint"})
		return
	}

	// Интроспектируем токен
	introspection, err := h.oauthService.IntrospectToken(token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to introspect token"})
		return
	}

	c.JSON(http.StatusOK, introspection)
}

func (h *OAuthHandler) HasRefreshToken(c *gin.Context) {
	clientID := c.Query("client_id")
	if clientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "client_id is required"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	has, err := h.oauthService.HasRefreshToken(userID.(string), clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"has_refresh_token": has})
}
