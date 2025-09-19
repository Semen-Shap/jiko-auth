package handlers

import (
	"jiko-auth/internal/repository"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CodesHandler struct {
	clientRepo *repository.OAuthClientRepository
}

func NewCodesHandler(clientRepo *repository.OAuthClientRepository) *CodesHandler {
	return &CodesHandler{
		clientRepo: clientRepo,
	}
}

func (h *CodesHandler) GenerateAccessCodePage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.Redirect(http.StatusFound, "/login?redirect=/generate-code")
		return
	}

	// Получаем приложения пользователя
	uid, err := uuid.Parse(userID.(string))
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	clients, err := h.clientRepo.GetUserClients(uid)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"error": "Failed to load applications",
		})
		return
	}

	c.HTML(http.StatusOK, "generate-code.html", gin.H{
		"Title":   "Generate Access Code",
		"Clients": clients,
	})
}

func (h *CodesHandler) GenerateAccessCode(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var req struct {
		ClientID string `json:"client_id" binding:"required"`
		Scope    string `json:"scope" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем, принадлежит ли клиент пользователю
	client, err := h.clientRepo.GetClient(req.ClientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	if client.UserID.String() != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Генерируем код доступа (в реальности это должен быть JWT или уникальный код)
	code := generateRandomCode(32)
	expiresAt := time.Now().Add(10 * time.Minute)

	// Здесь нужно сохранить код в базу данных с привязкой к клиенту и пользователю

	c.JSON(http.StatusOK, gin.H{
		"code":       code,
		"expires_at": expiresAt.Unix(),
		"client_id":  req.ClientID,
		"scope":      req.Scope,
	})
}

func generateRandomCode(length int) string {
	// Реализация генерации случайного кода
	return "random_generated_code_123456" // Заглушка
}
