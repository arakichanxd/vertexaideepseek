# DeepSeek API - 100% OpenAI Compatible

OpenAI-compatible proxy server for DeepSeek Chat. Drop-in replacement for OpenAI API with DeepSeek-V3 and DeepSeek-R1 models.

## ✨ Features

- ✅ **100% OpenAI Compatible** - Works with OpenAI SDK
- ✅ **Two Models** - DeepSeek-V3 (fast) & DeepSeek-R1 (reasoning)
- ✅ **Streaming Support** - Real-time SSE streaming
- ✅ **System Prompts** - Full support for system messages
- ✅ **Auto Keep-Alive** - Prevents token expiration
- ✅ **Token Pool** - Load balancing across multiple tokens
- ✅ **Free** - Uses DeepSeek's free chat interface

## 🚀 Quick Start

### 1. Install

```bash
npm install
```

### 2. Get DeepSeek Token

1. Go to [chat.deepseek.com](https://chat.deepseek.com)
2. Open DevTools (F12) → Console
3. Run: `JSON.parse(localStorage.getItem('userToken')).value`
4. Copy the token

### 3. Configure

Create `.env`:

```env
DEEPSEEK_AUTHTOKEN=your-token-here
API_KEY=sk-your-secret-key
KEEP_ALIVE_INTERVAL=30
```

### 4. Start

```bash
npm start
```

Server runs at `http://localhost:3000`

## 📖 Usage

### With OpenAI SDK

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'sk-your-secret-key',
    baseURL: 'http://localhost:3000/v1'
});

// Fast chat
const response = await client.chat.completions.create({
    model: 'deepseek-v3',
    messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' }
    ]
});

// Reasoning mode
const reasoning = await client.chat.completions.create({
    model: 'deepseek-r1',
    messages: [{ role: 'user', content: 'Solve: 2x + 5 = 15' }],
    stream: true
});
```

### With cURL

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer sk-your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v3",
    "messages": [
      {"role": "system", "content": "Be helpful and concise."},
      {"role": "user", "content": "What is 2+2?"}
    ]
  }'
```

## 🎯 Models

| Model | Description | Reasoning |
|-------|-------------|-----------|
| `deepseek-v3` | Fast chat responses | No |
| `deepseek-r1` | Deep reasoning (DeepThink) | Yes |

## 🌐 Deployment

### Local

```bash
npm start
```

### Render (Recommended)

1. Go to [render.com](https://render.com)
2. New → Web Service → Connect repo
3. Add environment variables:
   - `DEEPSEEK_AUTHTOKEN`
   - `API_KEY`
   - `KEEP_ALIVE_INTERVAL=30`
4. Deploy

See [docs/RENDER-SETUP.md](docs/RENDER-SETUP.md)

### Vercel

1. Install: `npm i -g vercel`
2. Deploy: `vercel`
3. Add environment variables in dashboard
4. Set `KEEP_ALIVE_INTERVAL=0` (serverless)

See [docs/VERCEL-SETUP.md](docs/VERCEL-SETUP.md)

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Render & Vercel setup
- [Environment Setup](docs/ENV-SETUP-GUIDE.md) - Configure variables
- [Quick Deploy](docs/QUICK-DEPLOY.md) - One-click deployment

## 🧪 Testing

```bash
# Run all tests
npm test

# Test OpenAI compatibility
npm run test:compat

# Test system prompts
npm run test:system

# Test live deployment
npm run test:live https://your-url.com sk-your-key
```

## 🔧 Configuration

### Multiple Tokens (Load Balancing)

```env
DEEPSEEK_AUTHTOKEN=token-1
DEEPSEEK_AUTHTOKEN1=token-2
DEEPSEEK_AUTHTOKEN2=token-3
```

### Multiple API Keys

```env
API_KEY=sk-key-1
API_KEY1=sk-key-2
API_KEY2=sk-key-3
```

### Custom Port

```env
PORT=8080
```

### Keep-Alive Interval

```env
KEEP_ALIVE_INTERVAL=30  # minutes
```

## 📡 API Endpoints

### POST /v1/chat/completions

OpenAI-compatible chat completions.

**Request:**
```json
{
  "model": "deepseek-v3",
  "messages": [
    {"role": "system", "content": "You are helpful."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "deepseek-v3",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help?"
    },
    "finish_reason": "stop"
  }]
}
```

### GET /v1/models

List available models.

### GET /health

Quick health check with basic status.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "tokenPool": {
    "totalTokens": 1,
    "currentIndex": 0
  },
  "keepAlive": {
    "enabled": true,
    "interval": 30,
    "lastPing": "2026-01-14T10:30:00.000Z"
  }
}
```

### GET /status

Detailed diagnostics and configuration status.

**Response:**
```json
{
  "service": "DeepSeek OpenAI-Compatible API",
  "version": "1.0.0",
  "status": "✅ Healthy",
  "timestamp": "2026-01-14T10:30:00.000Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "0d 1h 0m 0s"
  },
  "environment": {
    "DEEPSEEK_AUTHTOKEN": "✅ Set",
    "API_KEY": "✅ Set",
    "KEEP_ALIVE_INTERVAL": "30",
    "PORT": "3000",
    "NODE_ENV": "production"
  },
  "deepseek": {
    "tokenConfigured": true,
    "tokenPool": {
      "totalTokens": 1,
      "currentIndex": 0
    },
    "keepAlive": {
      "enabled": true,
      "interval": 30,
      "lastPing": "2026-01-14T10:30:00.000Z"
    },
    "models": ["deepseek-v3", "deepseek-r1"]
  },
  "api": {
    "apiKeyConfigured": true,
    "endpoints": [
      "POST /v1/chat/completions",
      "GET /v1/models",
      "GET /v1/models/:model",
      "GET /health",
      "GET /status"
    ]
  },
  "platform": {
    "node": "v20.10.0",
    "platform": "linux",
    "arch": "x64",
    "memory": {
      "used": "45MB",
      "total": "128MB"
    }
  }
}
```

## 🔐 Token Management

**Lifespan:** ~24-48 hours of inactivity

**Auto Keep-Alive:** Server pings DeepSeek every 30 minutes to keep tokens active.

**Refresh Token:**
1. Visit chat.deepseek.com
2. Get new token (see Quick Start)
3. Update `.env`
4. Restart server

## 🐛 Troubleshooting

### "No DeepSeek tokens found"
- Check `.env` has `DEEPSEEK_AUTHTOKEN`
- Or create `.deepseek_token.json`

### "Invalid API Key"
- Ensure client sends `Authorization: Bearer sk-your-key`
- Check `API_KEY` in `.env`

### "WASM file not found"
- Check `wasm/sha3_wasm_bg.wasm` exists
- For Vercel: ensure `vercel.json` includes wasm folder

### Token expired
- Get fresh token from chat.deepseek.com
- Update `.env` and restart

## 📁 Project Structure

```
deepseek/
├── src/
│   ├── server.js       # Express server
│   └── deepseek.js     # DeepSeek client
├── tests/
│   ├── test.js
│   ├── test-openai-compatibility.js
│   └── test-system-prompt.js
├── docs/
│   ├── DEPLOYMENT.md
│   ├── RENDER-SETUP.md
│   └── VERCEL-SETUP.md
├── wasm/
│   └── sha3_wasm_bg.wasm
├── .env.example
├── package.json
├── render.yaml
└── vercel.json
```

## 🤝 Contributing

Contributions welcome! Please ensure:
- 100% OpenAI compatibility
- All tests pass
- Documentation updated

## 📄 License

MIT

## ⚠️ Disclaimer

Educational purposes only. Respect DeepSeek's terms of service.

## 🙏 Credits

- PoW algorithm by [@xtekky](https://github.com/xtekky)
- OpenAI compatibility layer
