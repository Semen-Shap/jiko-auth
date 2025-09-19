# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Копируем файлы модулей и загружаем зависимости
COPY go.mod go.sum ./
RUN go mod download

# Копируем весь код и собираем приложение
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o jiko-auth ./cmd

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Копируем бинарник из builder stage
COPY --from=builder /app/jiko-auth .
COPY --from=builder /app/.env . 

EXPOSE 8080

CMD ["./jiko-auth"]