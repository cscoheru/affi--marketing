#!/bin/bash
set -e

SERVER="hk-jump"
REMOTE_DIR="/opt/puer-hub"

echo "=== 1/4 同步代码到服务器 ==="
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='src/generated' \
  --exclude='.git' \
  --exclude='evernote_export' \
  ./ "${SERVER}:${REMOTE_DIR}/"

echo "=== 2/4 Docker Compose 构建 ==="
ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose build app"
ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose build ws-server"

echo "=== 3/4 启动服务 ==="
ssh "${SERVER}" "cd ${REMOTE_DIR} && docker compose up -d"

echo "=== 4/4 等待数据库就绪，运行迁移 ==="
echo "等待 PostgreSQL 启动..."
sleep 3
ssh "${SERVER}" "docker run --rm \
  --network puer-hub_puer-net \
  -e DATABASE_URL='postgresql://puerhub:TeaHub2026Secure@postgres:5432/puerhub' \
  -e NODE_PATH=/usr/local/lib/node_modules \
  -v ${REMOTE_DIR}:/app \
  -w /app \
  node:22-alpine sh -c 'npm install -g prisma@7.8.0 dotenv 2>&1 | tail -1 && prisma db push --accept-data-loss' 2>&1"

echo ""
echo "=== 部署完成 ==="
echo "本地端口: http://localhost:3002 (需 SSH 隧道)"
echo "服务器直连: http://103.59.103.85:3002"
echo ""
echo "下一步: 配置 nginx 反向代理 → puer.rana.asia"
