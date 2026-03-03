# AI Service - Affiliate Marketing Platform

FastAPI-based AI service for the affiliate marketing platform, providing multi-model content generation, SEO optimization, and affiliate link injection.

## Features

- **Multi-Model AI Support**: Qwen (DashScope), OpenAI (GPT), and ChatGLM adapters
- **Tier-Based Model Selection**: Economy, Standard, and Premium tiers for cost optimization
- **SEO Content Generation**: Keyword analysis, intent detection, automated content creation
- **Affiliate Link Injection**: Natural link insertion for multiple affiliate networks
- **Cost Monitoring**: Real-time cost tracking, budget management, and alerts
- **Prompt Templates**: Centralized prompt management for consistent output quality

## Project Structure

```
ai-service/
├── app/
│   ├── api/              # API models and endpoints
│   │   ├── models.py     # Pydantic request/response models
│   │   └── __init__.py
│   ├── adapters/         # AI model adapters
│   │   ├── base.py       # Base adapter interface
│   │   ├── qwen_adapter.py
│   │   ├── openai_adapter.py
│   │   ├── chatglm_adapter.py
│   │   └── __init__.py
│   ├── services/         # Business logic
│   │   ├── manager.py    # AI Service Manager
│   │   ├── seo/          # SEO services
│   │   ├── affiliate/    # Affiliate link services
│   │   └── monitoring/   # Cost tracking
│   ├── prompts/          # Prompt templates
│   ├── utils/            # Helper functions
│   ├── models/           # Data models
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI application
├── tests/                # Test files
├── requirements.txt      # Dependencies
├── .env.example          # Environment variables template
└── README.md
```

## Installation

### 1. Install Dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

Required environment variables:

```env
# API Keys
DASHSCOPE_API_KEY=your_dashscope_key
OPENAI_API_KEY=your_openai_key
CHATGLM_API_KEY=your_chatglm_key

# Service Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Budget & Cost
DAILY_BUDGET=10.0
COST_LOG_PATH=./logs/costs.json
```

## Running the Service

### Development

```bash
# Start with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
# Start without auto-reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Text Generation
```bash
POST /api/v1/generate/text
{
  "prompt": "Write a product review",
  "tier": "standard",
  "max_tokens": 2000
}
```

### Content Generation
```bash
POST /api/v1/generate/content
{
  "keyword": "python programming",
  "content_type": "article",
  "tone": "professional",
  "target_length": 1500,
  "inject_affiliate_links": true
}
```

### Keyword Analysis
```bash
POST /api/v1/seo/analyze
{
  "keyword": "python programming"
}
```

### Link Injection
```bash
POST /api/v1/affiliate/inject
{
  "content": "Your content here...",
  "keywords": ["python", "programming"],
  "max_links": 5
}
```

### Statistics
```bash
GET /api/v1/stats/usage
GET /api/v1/stats/costs
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_services.py::TestKeywordAnalyzer -v
```

## Architecture

### AI Service Manager

The core `AIServiceManager` class provides:

- **Model Registry**: Centralized model configuration
- **Intelligent Selection**: Tier-based and prompt-length-based model selection
- **Failover Logic**: Automatic fallback between providers
- **Cost Tracking**: Real-time cost estimation and budget checking
- **Caching**: MD5-based response caching with TTL

### Model Adapters

All adapters implement the `BaseAdapter` interface:

- `QwenAdapter`: Alibaba DashScope integration
- `OpenAIAdapter`: OpenAI GPT models with tiktoken
- `ChatGLMAdapter`: Zhipu AI ChatGLM models

### SEO Services

- **KeywordAnalyzer**: Intent detection, difficulty scoring, opportunity analysis
- **ContentGenerator**: AI-powered content creation with SEO optimization

### Affiliate Services

- **AffiliateLinkInjector**: Natural link insertion
- **AffiliateLinkManager**: Performance tracking and optimization

## Configuration

### Model Tiers

- **Economy**: Fast, cost-effective models for simple tasks
- **Standard**: Balanced quality and speed
- **Premium**: Highest quality for complex tasks

### Budget Management

Set daily budget limits in `.env`:

```env
DAILY_BUDGET=10.0  # Maximum daily spend in USD
```

The service will:
- Track costs in real-time
- Warn at 90% of budget
- Block requests at 100% of budget

## Development

### Adding a New Model Adapter

1. Create a new adapter in `app/adapters/`
2. Inherit from `BaseAdapter`
3. Implement required methods
4. Register in `AIServiceManager`

### Adding New Prompt Templates

Edit `app/prompts/templates.py`:

```python
CUSTOM_TEMPLATES = {
    "my_template": "Your template here with {variables}"
}
```

## Deployment

### Docker

```bash
docker build -t ai-service .
docker run -p 8000:8000 --env-file .env ai-service
```

### Docker Compose

```bash
docker-compose up -d
```

## License

MIT

## Support

For issues and questions, please refer to the main project documentation.
