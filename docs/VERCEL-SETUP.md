# Vercel Deployment Guide

## Quick Setup

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Add Environment Variables

Go to your project on [vercel.com](https://vercel.com):

1. Click **Settings** tab
2. Click **Environment Variables** in sidebar
3. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DEEPSEEK_AUTHTOKEN` | Your token from chat.deepseek.com | Production, Preview, Development |
| `API_KEY` | sk-your-secret-key | Production, Preview, Development |
| `KEEP_ALIVE_INTERVAL` | 0 | Production, Preview, Development |

**Important:** 
- Check ALL environments (Production, Preview, Development)
- Set `KEEP_ALIVE_INTERVAL=0` for Vercel (serverless doesn't support continuous keep-alive)

### 3. Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **⋯** (three dots)
4. Click **Redeploy**

## Getting Your DeepSeek Token

1. Go to [chat.deepseek.com](https://chat.deepseek.com)
2. Open DevTools (F12)
3. Go to Console tab
4. Run:
   ```javascript
   JSON.parse(localStorage.getItem('userToken')).value
   ```
5. Copy the token

## Testing Your Deployment

```bash
# Health check
curl https://your-app.vercel.app/health

# List models
curl https://your-app.vercel.app/v1/models \
  -H "Authorization: Bearer sk-your-key"

# Chat completion
curl https://your-app.vercel.app/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Troubleshooting

### ❌ "No DeepSeek tokens configured"

**Problem:** Environment variable not set

**Solution:**
1. Go to Vercel dashboard → Settings → Environment Variables
2. Add `DEEPSEEK_AUTHTOKEN` with your token
3. Make sure to check ALL environments (Production, Preview, Development)
4. Redeploy

### ❌ "WASM file not found"

**Problem:** WASM file not included in deployment

**Solution:**
1. Make sure `vercel.json` has `includeFiles: ["wasm/**"]`
2. Check `.vercelignore` doesn't exclude wasm folder
3. Redeploy

### ❌ "Invalid API Key"

**Problem:** Wrong API key or not set

**Solution:**
1. Check you're using the correct API key in your request
2. Verify `API_KEY` is set in Vercel environment variables
3. If no API key is set, all requests are allowed (not recommended for production)

### ❌ Function timeout

**Problem:** Vercel has 10s timeout on free tier

**Solution:**
- Use shorter prompts
- Upgrade to Pro plan for 60s timeout
- Or use Railway/Fly.io for longer requests

## Vercel Limitations

| Feature | Free Tier | Pro Tier |
|---------|-----------|----------|
| Timeout | 10 seconds | 60 seconds |
| Keep-alive | ❌ No | ❌ No |
| Memory | 1024 MB | 3008 MB |
| Deployments | 100/day | Unlimited |

**Note:** Serverless platforms like Vercel don't support continuous keep-alive. Your token may expire after 24-48 hours of inactivity.

## Alternative: Use Railway or Fly.io

For production use with keep-alive support, consider:

- **Railway** - 500 hrs/month free, always on
- **Fly.io** - 3 VMs free, always on

See [DEPLOYMENT.md](DEPLOYMENT.md) for guides.

## Environment Variables Reference

```env
# Required
DEEPSEEK_AUTHTOKEN=your-deepseek-token-here

# Optional (recommended)
API_KEY=sk-your-secret-key

# Serverless (must be 0)
KEEP_ALIVE_INTERVAL=0
```

## Using with OpenAI SDK

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'sk-your-secret-key',
    baseURL: 'https://your-app.vercel.app/v1'
});

const response = await client.chat.completions.create({
    model: 'deepseek-v3',
    messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

## Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for other platforms
- See [README.md](README.md) for API documentation
- Test with [test-live-deployment.js](test-live-deployment.js)
