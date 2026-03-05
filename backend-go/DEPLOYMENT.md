# Affi-Marketing Backend Deployment Guide (Railway)

This guide covers deploying the Affi-Marketing backend services to Railway.

## Architecture

The backend consists of two services:

1. **Go Backend API** (`backend-go/`) - Main REST API
2. **Python AI Service** (`ai-service/`) - AI content generation service

---

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub account with repository access
3. Supabase project (for PostgreSQL database)
4. Redis instance (Railway or external)

---

## Step 1: Deploy Go Backend API

### 1.1 Create Railway Project

1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Choose your Affi-Marketing repository
4. Set root directory to `backend-go`

### 1.2 Configure Build Settings

Railway automatically detects Go projects. Verify these settings in `railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "./server"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

### 1.3 Set Environment Variables

Add these variables in Railway Dashboard → Settings → Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVER_MODE` | Gin mode | `release` |
| `SERVER_HOST` | Bind address | `0.0.0.0` |
| `DB_HOST` | PostgreSQL host | `<Supabase host>` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user | `<Supabase user>` |
| `DB_PASSWORD` | Database password | `<Supabase password>` |
| `DB_NAME` | Database name | `affi_marketing` |
| `DB_SSL_MODE` | SSL mode | `require` |
| `REDIS_HOST` | Redis host | `<Railway Redis service>` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `<Railway Redis password>` |
| `JWT_SECRET` | JWT signing secret | `<generate strong secret>` |
| `JWT_EXPIRATION` | Token expiration | `24h` |
| `CORS_ALLOWED_ORIGINS` | Frontend domains | `https://your-frontend.vercel.app` |
| `AI_SERVICE_URL` | AI service URL | `https://ai-service.onrailway.app` |

### 1.4 Add Railway Redis Service

1. In your Railway project, click "New Service"
2. Select "Database" → "Redis"
3. Railway will provide `REDIS_HOST` and `REDIS_PASSWORD`

### 1.5 Deploy

1. Click "Deploy" button
2. Railway will build and deploy your Go service
3. Monitor logs in the "Deployments" tab

---

## Step 2: Deploy Python AI Service

### 2.1 Create Railway Service

1. In the same Railway project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose your Affi-Marketing repository
4. Set root directory to `ai-service`

### 2.2 Configure Build Settings

Create `ai-service/railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

### 2.3 Set Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `<your key>` |
| `DASHSCOPE_API_KEY` | Alibaba DashScope key | `<your key>` |
| `ZHIPUAI_API_KEY` | Zhipu AI key | `<your key>` |
| `MODEL_DEFAULT` | Default model | `gpt-4o-mini` |

### 2.4 Deploy

1. Click "Deploy" button
2. Railway will build and deploy your Python service
3. Copy the generated service URL

---

## Step 3: Configure Backend AI Service URL

1. Go back to your Go Backend service in Railway
2. Update `AI_SERVICE_URL` variable with the AI service URL
3. Redeploy the backend service

---

## Step 4: Verify Deployment

### Check Health Endpoints

```bash
# Backend health
curl https://backend-service.onrailway.app/health

# AI service health
curl https://ai-service.onrailway.app/health
```

### Expected Responses

Backend:
```json
{
  "status": "ok",
  "service": "affi-marketing-api",
  "version": "0.1.0"
}
```

AI Service:
```json
{
  "status": "healthy",
  "service": "affi-marketing-ai-service"
}
```

---

## Step 5: Configure Frontend

Update your frontend environment variables:

```env
NEXT_PUBLIC_API_URL=https://backend-service.onrailway.app
NEXT_PUBLIC_AI_SERVICE_URL=https://ai-service.onrailway.app
```

---

## Troubleshooting

### Build Failures

**Issue**: `go build` fails
- Check that `go.mod` is committed
- Verify Go version in `go.mod` is compatible with Railway

**Issue**: Python dependencies fail to install
- Check `requirements.txt` is in `ai-service/` directory
- Remove platform-specific packages (e.g., `orjson`)

### Runtime Errors

**Issue**: Database connection failed
- Verify Supabase credentials
- Check `DB_SSL_MODE` (use `require` for Supabase)
- Ensure Supabase allows Railway IPs

**Issue**: Redis connection failed
- Verify Redis service is running
- Check `REDIS_HOST` and `REDIS_PASSWORD`
- Use Railway's internal Redis URL

**Issue**: CORS errors
- Update `CORS_ALLOWED_ORIGINS` with frontend domain
- Separate multiple domains with commas

### Health Checks Fail

**Issue**: Health check timeout
- Increase `healthcheckTimeout` in `railway.toml`
- Check service logs for startup errors
- Verify database and Redis connections

---

## Monitoring

### Railway Dashboard

- **Deployments**: View build and deployment history
- **Metrics**: Monitor CPU, memory, and network
- **Logs**: Real-time application logs
- **Traces**: Request tracing (Railway Pro)

### Health Checks

Both services expose `/health` endpoints for monitoring:

```bash
# Backend
curl https://backend.onrailway.app/health

# AI Service
curl https://ai-service.onrailway.app/health
```

---

## Scaling

### Vertical Scaling

1. Go to service settings
2. Select "Pricing" tab
3. Choose plan (Free, Starter, Pro, etc.)

### Horizontal Scaling

Railway automatically scales based on traffic (paid plans).

---

## Cost Estimation

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| Backend (Go) | $5/month | $20-500/month |
| AI Service (Python) | $5/month | $20-500/month |
| Redis | Included | $5/month+ |

**Note**: Free tiers have limited RAM and CPU. Paid plans recommended for production.

---

## Domain Configuration

### Custom Domains

1. Go to service settings → "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `api.affi-marketing.com`)
4. Update DNS records as instructed by Railway

---

## Backup & Recovery

### Database Backups

- **Supabase**: Automatic backups enabled
- **Redis**: Use Railway Redis persistence (paid plans)

### Disaster Recovery

1. Fork repository to new GitHub repo
2. Create new Railway project
3. Reconfigure environment variables
4. Deploy from new repository

---

## Security Checklist

- [ ] Change default `JWT_SECRET` to strong random value
- [ ] Use `require` for `DB_SSL_MODE` (Supabase)
- [ ] Restrict `CORS_ALLOWED_ORIGINS` to production domains
- [ ] Enable Railway's automatic HTTPS
- [ ] Set up rate limiting (use Railway's built-in or custom middleware)
- [ ] Rotate API keys regularly
- [ ] Enable audit logging

---

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions → Railway)
2. Configure monitoring and alerting
3. Set up staging environment
4. Implement blue-green deployment strategy
5. Configure auto-scaling rules

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Repository](https://github.com/your-org/affi-marketing)
- [Environment Variables](./.env.example)
