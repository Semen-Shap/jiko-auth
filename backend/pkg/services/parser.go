package services

import (
	"jiko-auth/internal/models"
	"regexp"
	"strings"
)

type UserAgentParser struct{}

func NewUserAgentParser() *UserAgentParser {
	return &UserAgentParser{}
}

func (p *UserAgentParser) Parse(userAgent string) models.Device {
	device := models.Device{
		Browser:    "Unknown",
		OS:         "Unknown",
		DeviceType: "desktop",
		IsMobile:   false,
	}

	// Определяем мобильное устройство
	device.IsMobile = strings.Contains(userAgent, "Mobile") ||
		strings.Contains(userAgent, "Android") ||
		strings.Contains(userAgent, "iPhone")

	if device.IsMobile {
		device.DeviceType = "mobile"
	}

	// Браузеры
	browserPatterns := map[string]*regexp.Regexp{
		"Chrome":  regexp.MustCompile(`Chrome/(\d+\.\d+)`),
		"Safari":  regexp.MustCompile(`Safari/(\d+)`),
		"Firefox": regexp.MustCompile(`Firefox/(\d+\.\d+)`),
		"Edge":    regexp.MustCompile(`Edg/(\d+\.\d+)`),
		"Opera":   regexp.MustCompile(`OPR/(\d+\.\d+)`),
	}

	for browser, pattern := range browserPatterns {
		if matches := pattern.FindStringSubmatch(userAgent); matches != nil {
			device.Browser = browser
			if len(matches) > 1 {
				device.BrowserVersion = matches[1]
			}
			break
		}
	}

	// Операционные системы
	osPatterns := map[string]*regexp.Regexp{
		"Windows":  regexp.MustCompile(`Windows NT (\d+\.\d+)`),
		"Mac OS X": regexp.MustCompile(`Mac OS X (\d+[_\d]*)`),
		"iOS":      regexp.MustCompile(`iPhone OS (\d+_\d+)`),
		"Android":  regexp.MustCompile(`Android (\d+)`),
		"Linux":    regexp.MustCompile(`Linux`),
	}

	for os, pattern := range osPatterns {
		if pattern.MatchString(userAgent) {
			device.OS = os
			if matches := pattern.FindStringSubmatch(userAgent); len(matches) > 1 {
				device.OSVersion = matches[1]
			}
			break
		}
	}

	// Устройства
	if strings.Contains(userAgent, "iPad") {
		device.DeviceType = "tablet"
		device.DeviceModel = "iPad"
	} else if strings.Contains(userAgent, "iPhone") {
		device.DeviceType = "mobile"
		device.DeviceModel = "iPhone"
	} else if strings.Contains(userAgent, "Android") {
		device.DeviceModel = "Android Device"
	}

	return device
}

func (p *UserAgentParser) GetFriendlyBrowserName(device models.Device) string {
	names := map[string]string{
		"Chrome":  "Chrome",
		"Safari":  "Safari",
		"Firefox": "Firefox",
		"Edge":    "Microsoft Edge",
		"Opera":   "Opera",
	}

	if friendlyName, exists := names[device.Browser]; exists {
		if device.IsMobile && device.Browser == "Safari" {
			return "Mobile Safari"
		}
		return friendlyName
	}

	return device.Browser
}
