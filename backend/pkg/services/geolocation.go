package services

import (
	"encoding/json"
	"fmt"
	"io"
	"jiko-auth/internal/models"
	"net/http"
	"strings"
)

// GeoLocationService сервис для определения местоположения по IP
type GeoLocationService struct {
	apiKey string
}

// NewGeoLocationService создает новый сервис геолокации
func NewGeoLocationService(apiKey string) *GeoLocationService {
	return &GeoLocationService{apiKey: apiKey}
}

// IPApiResponse ответ от сервиса ipapi.co
type IPApiResponse struct {
	IP          string  `json:"ip"`
	City        string  `json:"city"`
	Region      string  `json:"region"`
	CountryName string  `json:"country_name"`
	CountryCode string  `json:"country_code"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Timezone    string  `json:"timezone"`
}

// GetLocationByIP определяет местоположение по IP-адресу
func (g *GeoLocationService) GetLocationByIP(ip string) (models.Location, error) {
	location := models.Location{}

	// Для локальных IP возвращаем Unknown
	if ip == "127.0.0.1" || ip == "::1" || strings.HasPrefix(ip, "192.168.") || strings.HasPrefix(ip, "10.") {
		location.City = "Unknown"
		location.Country = "Local Network"
		return location, nil
	}

	url := fmt.Sprintf("http://ipapi.co/%s/json/", ip)
	if g.apiKey != "" {
		url += "?key=" + g.apiKey
	}

	resp, err := http.Get(url)
	if err != nil {
		return location, fmt.Errorf("ошибка запроса к API геолокации: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return location, fmt.Errorf("ошибка чтения ответа: %v", err)
	}

	var apiResponse IPApiResponse
	err = json.Unmarshal(body, &apiResponse)
	if err != nil {
		return location, fmt.Errorf("ошибка парсинга JSON: %v", err)
	}

	location.City = apiResponse.City
	location.Country = apiResponse.CountryName
	location.CountryCode = apiResponse.CountryCode
	location.Region = apiResponse.Region
	location.Latitude = apiResponse.Latitude
	location.Longitude = apiResponse.Longitude
	location.Timezone = apiResponse.Timezone

	return location, nil
}
