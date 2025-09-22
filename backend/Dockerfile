FROM golang:1.24 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags='-extldflags=-static' -o main ./cmd/main.go

FROM alpine:3.18

RUN apk add --no-cache ca-certificates

WORKDIR /

COPY --from=builder /app/main /main

EXPOSE 8080

ENTRYPOINT ["/main"]