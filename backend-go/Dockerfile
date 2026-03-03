# 简化版 Dockerfile - 避免 Railway 构建缓存问题
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 设置 Go 环境变量
ENV GOPROXY=https://goproxy.cn,direct
ENV GOSUMDB=off
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64

# 安装依赖
RUN apk add --no-cache git ca-certificates

# 下载依赖（先复制 go.mod 利用缓存）
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download && \
    go mod verify

# 复制源代码
COPY . .

# 构建
RUN go build -ldflags="-s -w" -o server ./cmd/server/main.go

# 运行时镜像
FROM alpine:latest

WORKDIR /app

# 安装 CA 证书
RUN apk --no-cache add ca-certificates tzdata

# 复制二进制文件
COPY --from=builder /app/server .

# 暴露端口
EXPOSE 8080

# 设置时区
ENV TZ=Asia/Shanghai
ENV GIN_MODE=release

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# 运行应用
CMD ["./server"]
