# Vue Remote 部署指南

本指南说明如何部署 Vue 远程应用与 Next.js 主应用的集成方案。

## 架构概述

- **主应用**: Next.js (React) - 运行在端口 3000
- **远程应用**: Vue 3 - 运行在端口 5174
- **通信方式**: Module Federation
- **代理配置**: Next.js 通过 rewrite 规则将 `/vue-remote/*` 请求代理到 Vue 服务器

## 开发环境部署

### 1. 启动 Vue 开发服务器

```bash
cd vue-remote
npm install
npm run dev
```

Vue 服务器将在 `http://localhost:5174` 启动，并生成：
- `/dist/assets/remoteEntry.js` - Module Federation 入口文件

### 2. 启动 Next.js 开发服务器

```bash
cd frontend-unified
npm install
npm run dev
```

Next.js 服务器将在 `http://localhost:3000` 启动。

### 3. 验证连接

确保以下端点可访问：
- `http://localhost:5174/dist/assets/remoteEntry.js` - 返回 200
- `http://localhost:3000/vue-remote/dist/assets/remoteEntry.js` - 通过代理返回 200

### 4. 测试页面访问

访问以下页面，验证 Vue 组件正确加载：
- Dashboard: `http://localhost:3000/dashboard`
- Campaigns: `http://localhost:3000/campaigns`
- Affiliates: `http://localhost:3000/affiliates`
- Templates: `http://localhost:3000/templates`
- Settings: `http://localhost:3000/settings`
- Account: `http://localhost:3000/account`
- Experiments: `http://localhost:3000/experiments`
- Experiments Detail: `http://localhost:3000/experiments/123`
- Plugins: `http://localhost:3000/plugins`
- Analytics: `http://localhost:3000/analytics`
- Settlements: `http://localhost:3000/settlements`

## 生产环境部署

### 1. 构建Vue应用

```bash
cd vue-remote
npm run build
```

这将在 `vue-remote/dist/` 目录生成生产构建文件。

### 2. 构建Next.js应用

```bash
cd frontend-unified
npm run build
```

### 3. 静态文件部署

将 `vue-remote/dist` 目录部署到 Web 服务器（如 Nginx），确保可以通过 `/vue-remote/*` 路径访问。

示例 Nginx 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Vue 远程文件
    location /vue-remote/ {
        alias /path/to/vue-remote/dist/;
        try_files $uri $uri/ =404;
    }

    # Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 环境变量配置

在 `.env.production` 中设置：

```env
NEXT_PUBLIC_VUE_REMOTE_URL=/vue-remote/dist/assets/remoteEntry.js
```

## 故障排除

### 1. remoteEntry.js 404错误

**原因**: Vue 服务器未运行或路径不正确
**解决**:
- 检查 Vue 服务器是否在 5174 端口运行
- 验证 `http://localhost:5174/dist/assets/remoteEntry.js` 是否可访问
- 检查 Next.js rewrite 配置是否正确

### 2. 组件无法加载

**原因**: Module Federation 配置问题
**解决**:
- 检查 Vue 项目的 `vite.config.ts` 配置
- 确保 `exposes` 配置正确
- 检查 Next.js 是否正确配置了 Vue 的解析

### 3. 样式不显示

**原因**: CSS 样式冲突或未加载
**解决**:
- 检查 Vue 组件的样式导入
- 确认主题适配样式已加载
- 检查 Element Plus 是否正确安装

### 4. API 调用失败

**原因**: 跨域或 API 路径不正确
**解决**:
- 检查 API URL 配置
- 确认代理服务器配置正确
- 验证后端服务是否运行

## 性能优化

### 1. 代码分割

Vue 应用已配置代码分割，确保按需加载。

### 2. 缓存策略

- 静态资源设置长期缓存
- HTML 文件不缓存
- API 请求根据需求设置缓存头

### 3. 懒加载

所有 Vue 组件都通过动态导入实现懒加载，减少初始加载时间。

## 监控和日志

### 1. 浏览器控制台

检查是否有 JavaScript 错误：
- Module Federation 加载错误
- 组件渲染错误
- API 调用错误

### 2. 网络面板

检查资源加载：
- remoteEntry.js 是否正确加载
- 组件 chunk 是否按需加载
- API 请求是否成功

### 3. Vue 开发工具

安装 Vue DevTools 插件调试 Vue 组件：
- 组件状态检查
- Vuex/Pinia 状态查看
- 性能分析

## 更新维护

### 1. 更新Vue组件

```bash
cd vue-remote
git pull
npm install
npm run build
# 重新部署 dist 目录
```

### 2. 更新Next.js应用

```bash
cd frontend-unified
git pull
npm install
npm run build
# 部署构建产物
```

### 3. 版本控制

确保版本号正确更新：
- package.json 中的版本
- 构建产物中的 hash
- Docker镜像版本（如使用Docker部署）

## 安全考虑

1. **CORS配置**
   - 确保正确的 CORS 头
   - 只允许必要的域名访问

2. **认证授权**
   - 所有 API 调用需要认证
   - 前端正确处理 token

3. **输入验证**
   - 验证所有用户输入
   - 防止 XSS 攻击

4. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 配置正确的 SSL 证书

## Docker部署（可选）

### 1. Vue应用 Dockerfile

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 2. Next.js应用 Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```