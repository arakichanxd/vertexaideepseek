# Render Deployment Guide

## Quick Setup

### 1. Create Web Service

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** deepseek-api
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 2. Add Environment Variables

In the Render dashboard:

1. Scroll to **Environment Variables**
2. Click **Add Environment Variable**
3. Add these:

| Key | Value |
|-----|-------|
| `DEEPSEEK_AUTHTOKEN` | Your token from chat.deepseek.com |
| `API_KEY` | sk-your-secret-key |
| `KEEP_ALIVE_INTERVAL` | 30 |
| `NODE_VERSION` | 18.17.0 |

4. Click **Create Web Service**

### 3. Get Your DeepSeek Token

1. Go to [chat.deepseek.com](https://chat.deepseek.com)
2. Open DevTools (F12) → Console
3. Run:
   ```javascript
   JSON.parse(localStorage.getItem('userToken')).value
   ```
4. Copy the token

### 4. Deploy

Render will automatically deploy. Wait for:
- ✅ Build complete
- ✅ Deploy live

Your API will be at: `https://your-app.onrender.com`

## Testing Your Deployment

```bash
# Health check
curl https://your-app.onrender.com/health

# List models
curl https://your-app.onrender.com/v1/models \
  -H "Authorization: Bearer sk-your-key"

# Chat completion
curl https://your-app.onrender.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Using with OpenAI SDK

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: 'sk-your-secret-key',
    baseURL: 'https://your-app.onrender.com/v1'
});

const response = await client.chat.completions.create({
    model: 'deepseek-v3',
    messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

## Troubleshooting

### ❌ "No DeepSeek tokens configured"

**Solution:** Add `DEEPSEEK_AUTHTOKEN` in Environment Variables

### ❌ Service sleeps after 15 minutes

**Solution:** 
- Free tier sleeps after inactivity
- Upgrade to paid plan for always-on
- Or use keep-alive ping service (UptimeRobot)

### ❌ Build fails

**Solution:**
- Check Node version is 18+
- Verify all dependencies in package.json
- Check build logs for errors

## Render Free Tier

- ✅ 750 hours/month free
- ⚠️ Sleeps after 15 min inactivity
- ✅ Auto-wakes on request
- ✅ Custom domains
- ✅ Auto-deploy from Git

## Keep Service Awake (Optional)

Use [UptimeRobot](https://uptimerobot.com) (free):

1. Create account
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.onrender.com/health`
   - Interval: 5 minutes
3. Service stays awake!

## Need Help?

- Check [README.md](README.md) for API documentation
- See [VERCEL-SETUP.md](VERCEL-SETUP.md) for Vercel alternative
- Test with: `node test-live-deployment.js https://your-app.onrender.com sk-your-key`
