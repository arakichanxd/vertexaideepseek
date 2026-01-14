# Quick Deploy Guide

Choose your platform and follow the steps:

## 🚀 Railway (Easiest - Recommended)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repo
4. Go to Variables tab and add:
   - Key: `DEEPSEEK_AUTHTOKEN` → Value: your-token-here
   - Key: `API_KEY` → Value: sk-your-key
   - Key: `KEEP_ALIVE_INTERVAL` → Value: 30
5. Deploy! ✅

**Free tier:** 500 hours/month

---

## ✈️ Fly.io

```bash
# Install CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch

# Set secrets
fly secrets set DEEPSEEK_AUTHTOKEN="your-token-here"
fly secrets set API_KEY="sk-your-key"
fly secrets set KEEP_ALIVE_INTERVAL="30"

# Done!
fly open
```

**Free tier:** 3 VMs

---

## 🌐 Koyeb

1. Go to [koyeb.com](https://www.koyeb.com)
2. Click "Create App" → GitHub
3. Select your repo
4. Set port: `3000`
5. Add environment variables in dashboard:
   - `DEEPSEEK_AUTHTOKEN` = your-token-here
   - `API_KEY` = sk-your-key
   - `KEEP_ALIVE_INTERVAL` = 30
6. Deploy! ✅

**Free tier:** 1 service

---

## ⚡ Vercel (Serverless)

```bash
# Install CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# Settings → Environment Variables
# - DEEPSEEK_AUTHTOKEN = your-token-here
# - API_KEY = sk-your-key
# - KEEP_ALIVE_INTERVAL = 0

# Done!
```

**Note:** Set `KEEP_ALIVE_INTERVAL=0` (serverless doesn't support continuous keep-alive)

**Free tier:** Unlimited

---

## 🔄 Cyclic

1. Go to [cyclic.sh](https://www.cyclic.sh)
2. Click "Deploy" → Connect GitHub
3. Select your repo
4. Add environment variables in dashboard:
   - `DEEPSEEK_AUTHTOKEN` = your-token-here
   - `API_KEY` = sk-your-key
   - `KEEP_ALIVE_INTERVAL` = 30
5. Deploy! ✅

**Free tier:** Always on

---

## 🎨 Glitch (Instant)

1. Go to [glitch.com](https://glitch.com)
2. "New Project" → "Import from GitHub"
3. Paste repo URL
4. Edit `.env` file with your tokens
5. Done! ✅

**Note:** Sleeps after 5 min (use UptimeRobot to keep awake)

**Free tier:** Unlimited

---

## 📦 Render

1. Go to [render.com](https://render.com)
2. "New" → "Web Service"
3. Connect GitHub repo
4. Add environment variables in dashboard:
   - `DEEPSEEK_AUTHTOKEN` = your-token-here
   - `API_KEY` = sk-your-key
   - `KEEP_ALIVE_INTERVAL` = 30
5. Deploy! ✅

**Free tier:** Available (sleeps after 15 min)

---

## 🌌 Deta Space

```bash
# Install CLI
curl -fsSL https://get.deta.dev/space-cli.sh | sh

# Login
space login

# Deploy
space push

# Set environment
space env add DEEPSEEK_AUTHTOKEN "your-token-here"
space env add API_KEY "sk-your-key"
space env add KEEP_ALIVE_INTERVAL "30"
```

**Free tier:** Always on

---

## 🎯 My Recommendation

**For Production:** Railway or Fly.io
- Always on
- Reliable
- Easy to use
- Good free tier

**For Testing:** Glitch or Vercel
- Instant setup
- No credit card needed

**For Personal:** Koyeb or Cyclic
- Simple
- Always on
- Free forever

---

## After Deployment

Test your API:

```bash
# Replace YOUR_URL with your deployment URL

# Health check
curl https://YOUR_URL/health

# Test chat
curl https://YOUR_URL/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"Hello!"}]}'
```

---

## Need More Details?

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guides with screenshots and troubleshooting.
