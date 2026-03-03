# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Set Go environment variables for Chinese network
ENV GOPROXY=https://goproxy.cn,direct
ENV GOSUMDB=off
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64

# Install dependencies
RUN apk add --no-cache git ca-certificates

# Download dependencies (copy go.mod first for better caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN go build -ldflags="-s -w" -o server ./cmd/server/main.go

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install CA certificates and timezone data
RUN apk --no-cache add ca-certificates tzdata wget

# Copy binary from builder
COPY --from=builder /app/server .

# Expose port
EXPOSE 8080

# Set timezone and mode
ENV TZ=Asia/Shanghai
ENV GIN_MODE=release

# Run application
CMD ["./server"]
