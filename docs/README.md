# DeepSeek Reverse API

OpenAI-compatible proxy server for DeepSeek Chat (chat.deepseek.com). Access DeepSeek-V3 and DeepSeek-R1 models through a familiar OpenAI SDK interface.

## Features

- ✅ **OpenAI Compatible** - Drop-in replacement for OpenAI API
- ✅ **Two Models** - DeepSeek-V3 (fast chat) & DeepSeek-R1 (reasoning)
- ✅ **Streaming Support** - Real-time response streaming
- ✅ **Token Pool** - Load balancing across multiple auth tokens
- ✅ **Auto Keep-Alive** - Prevents token expiration automatically
- ✅ **PoW Solver** - Automatic challenge solving via WASM
- ✅ **Free** - Uses DeepSeek's free chat interface

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get your DeepSeek token:**
   - Go to [chat.deepseek.com](https://chat.deepseek.com)
   - Open DevTools (F12) → Console
   - Run: `JSON.parse(localStorage.getItem('userToken')).value`
   - Copy the token

3. **Configure environment:**
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env`:
   ```env
   DEEPSEEK_AUTHTOKEN=your-token-here
   API_KEY=sk-your-secret-key
   KEEP_ALIVE_INTERVAL=30
   ```

4. **Start server:**
   ```bash
   npm start
   ```

Server runs at `http://localhost:3000`

---

## Deployment

### Render (Recommended)

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Add environment variables:
   - `DEEPSEEK_AUTHTOKEN` = your-token
   - `API_KEY` = sk-your-key
   - `KEEP_ALIVE_INTERVAL` = 30
5. Deploy!

See [RENDER-SETUP.md](RENDER-SETUP.md) for details.

### Vercel (Serverless)

1. Install CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Add environment variables in dashboard:
   - `DEEPSEEK_AUTHTOKEN` = your-token
   - `API_KEY` = sk-your-key
   - `KEEP_ALIVE_INTERVAL` = 0
4. Redeploy

See [VERCEL-SETUP.md](VERCEL-SETUP.md) for details.

---

## Usage

### With OpenAI SDK

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'sk-your-secret-key',
    baseURL: 'http://localhost:3000/v1'
});

// Fast chat (DeepSeek-V3)
const response = await client.chat.completions.create({
    model: 'deepseek-v3',
    messages: [{ role: 'user', content: 'Hello!' }]
});

// Reasoning mode (DeepSeek-R1)
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
    "messages": [{"role": "user", "content": "Hi!"}]
  }'
```

## Available Models

| Model | Description | Reasoning |
|-------|-------------|-----------|
| `deepseek-v3` | Fast chat responses | No |
| `deepseek-r1` | Deep reasoning (DeepThink) | Yes |

Aliases: `deepseek-chat` → `deepseek-v3`, `deepseek-reasoner` → `deepseek-r1`

## Advanced Configuration

### Multiple Tokens (Load Balancing)

```env
DEEPSEEK_AUTHTOKEN=token-1
DEEPSEEK_AUTHTOKEN1=token-2
DEEPSEEK_AUTHTOKEN2=token-3
```

Tokens rotate automatically (round-robin).

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

### Keep-Alive Configuration

```env
# Ping interval in minutes (default: 30)
KEEP_ALIVE_INTERVAL=30

# Disable keep-alive (for serverless like Vercel)
KEEP_ALIVE_INTERVAL=0
```

---

## API Endpoints

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
  "created": 1234567890,
  "model": "deepseek-v3",
  "choices": [{
    "index": 0,
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

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "tokenPool": {
    "totalTokens": 3,
    "currentIndex": 0
  },
  "keepAlive": {
    "enabled": true,
    "lastPing": "2025-01-12T10:30:00.000Z",
    "minutesSinceLastPing": 5
  },
  "uptime": 3600
}
```

## Testing

```bash
# Run all tests
npm test

# Test with OpenAI SDK
npm run test:openai

# Test system prompts
npm run test:system

# Test OpenAI compatibility
npm run test:compat

# Test live deployment
node test-live-deployment.js https://your-url.com sk-your-key
```

---

## Token Management

**Token Lifespan:** ~24-48 hours of inactivity

**Automatic Keep-Alive:** The server automatically pings DeepSeek every 60 minutes to keep tokens active and prevent expiration. This means your tokens should stay valid indefinitely as long as the server is running.

**Manual Refresh (if needed):**
1. Visit chat.deepseek.com
2. Get new token (see Quick Start step 2)
3. Update `.env` or `.deepseek_token.json`
4. Restart server

**Token Cache:** Tokens are cached in `.deepseek_token.json` with expiry warnings.

**Keep-Alive Status:** Check `/health` endpoint to see last keep-alive ping time.

## Troubleshooting

### "No DeepSeek tokens found"
- Check `.env` has `DEEPSEEK_AUTHTOKEN`
- Or create `.deepseek_token.json` manually

### "Invalid API Key"
- Ensure client sends `Authorization: Bearer sk-your-key`
- Check `API_KEY` in `.env` matches

### "WASM file not found"
- Check `wasm/sha3_wasm_bg.wasm` exists
- For Vercel: ensure `.vercelignore` doesn't exclude wasm/

### "Token expired"
- Get fresh token from chat.deepseek.com
- Update `.env` and restart

### Rate Limits
- Add multiple tokens for load balancing
- Tokens rotate automatically

---

## Architecture

```
Client Request
    ↓
Express Server (server.js)
    ↓
DeepSeek Client (deepseek.js)
    ↓
1. Create chat session
2. Get PoW challenge
3. Solve challenge (WASM)
4. Send request with proof
5. Parse streaming response
    ↓
OpenAI-formatted Response
```

---

## Credits

- PoW algorithm reverse-engineered by [@xtekky](https://github.com/xtekky)
- JavaScript/Node.js port and OpenAI compatibility layer

---

## License

MIT

---

## Disclaimer

This is a reverse-engineered client for educational purposes. Use responsibly and respect DeepSeek's terms of service.
