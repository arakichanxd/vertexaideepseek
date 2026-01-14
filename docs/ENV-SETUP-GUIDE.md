# Environment Variables Setup Guide

This guide shows you exactly how to add environment variables on each platform.

## 🔑 Required Variables

All platforms need these three variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DEEPSEEK_AUTHTOKEN` | Your token from chat.deepseek.com | DeepSeek authentication |
| `API_KEY` | sk-your-secret-key | Your API key for clients |
| `KEEP_ALIVE_INTERVAL` | 30 | Minutes between keep-alive pings |

---

## Railway

### Method 1: Dashboard (Easiest)

1. Go to your project on [railway.app](https://railway.app)
2. Click on your service
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   ```
   Variable Name: DEEPSEEK_AUTHTOKEN
   Value: e0s2bRseCTwfHmReHxad/bkllLBc/Ash6TMumP3fA/0qPdnsO/5NhKeUd9CobSTA
   ```
   ```
   Variable Name: API_KEY
   Value: sk-adminkey02
   ```
   ```
   Variable Name: KEEP_ALIVE_INTERVAL
   Value: 60
   ```
6. Click **Deploy** (automatic)

### Method 2: CLI

```bash
railway variables set DEEPSEEK_AUTHTOKEN="your-token-here"
railway variables set API_KEY="sk-your-key"
railway variables set KEEP_ALIVE_INTERVAL="30"
```

---

## Render

### Dashboard Only

1. Go to your service on [render.com](https://render.com)
2. Click **Environment** in left sidebar
3. Click **Add Environment Variable**
4. Add each variable:
   - Key: `DEEPSEEK_AUTHTOKEN`
   - Value: `your-token-here`
   - Click **Save**
5. Repeat for `API_KEY` and `KEEP_ALIVE_INTERVAL`
6. Service will auto-redeploy

**Screenshot locations:**
- Dashboard → Your Service → Environment → Add Environment Variable

---

## Vercel

### Dashboard (Recommended)

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Add each variable:
   - Name: `DEEPSEEK_AUTHTOKEN`
   - Value: `your-token-here`
   - Environment: Production, Preview, Development (check all)
   - Click **Save**
5. Repeat for other variables
6. Redeploy: Deployments → Latest → Redeploy

**Important:** Set `KEEP_ALIVE_INTERVAL=0` for Vercel (serverless)

### CLI

```bash
# Not recommended - use dashboard instead
vercel env add DEEPSEEK_AUTHTOKEN production
# Then paste your token when prompted
```

---

## Fly.io

### CLI Only

```bash
fly secrets set DEEPSEEK_AUTHTOKEN="your-token-here"
fly secrets set API_KEY="sk-your-key"
fly secrets set KEEP_ALIVE_INTERVAL="30"
```

To view secrets:
```bash
fly secrets list
```

---

## Koyeb

### Dashboard Only

1. Go to your app on [koyeb.com](https://www.koyeb.com)
2. Click **Settings** tab
3. Scroll to **Environment Variables**
4. Click **Add Variable**
5. Add each:
   - Key: `DEEPSEEK_AUTHTOKEN`
   - Value: `your-token-here`
   - Click **Add**
6. Click **Update Service** at bottom

---

## Cyclic

### Dashboard Only

1. Go to your app on [cyclic.sh](https://www.cyclic.sh)
2. Click **Variables** tab
3. Add each variable:
   - Variable: `DEEPSEEK_AUTHTOKEN`
   - Value: `your-token-here`
   - Click **Add**
4. Service auto-restarts

---

## Glitch

### .env File

1. Go to your project on [glitch.com](https://glitch.com)
2. Click **.env** file in left sidebar
3. Add variables (one per line):
   ```env
   DEEPSEEK_AUTHTOKEN=your-token-here
   API_KEY=sk-your-key
   KEEP_ALIVE_INTERVAL=30
   ```
4. File auto-saves, app auto-restarts

**Note:** .env file is private and not visible to others

---

## Deta Space

### CLI Only

```bash
space env add DEEPSEEK_AUTHTOKEN "your-token-here"
space env add API_KEY "sk-your-key"
space env add KEEP_ALIVE_INTERVAL "30"
```

To view:
```bash
space env list
```

---

## Common Issues

### ❌ "Secret does not exist"

**Problem:** Variable name typo or not created yet

**Solution:** 
- Check spelling: `DEEPSEEK_AUTHTOKEN` (not DEEPSEEK_AUTH_TOKEN)
- Create the variable first in dashboard

### ❌ "Invalid token"

**Problem:** Token has spaces or special characters

**Solution:**
- Copy token carefully (no spaces at start/end)
- Use quotes in CLI: `"your-token-here"`
- In dashboard: paste directly without quotes

### ❌ "Environment variable not found"

**Problem:** Variable not set for correct environment

**Solution:**
- Vercel: Check all environments (Production, Preview, Development)
- Railway: Make sure variable is in correct service
- Render: Check it's in Environment tab, not Build Command

### ❌ Keep-alive not working

**Problem:** Wrong interval or serverless platform

**Solution:**
- Set `KEEP_ALIVE_INTERVAL=30` (number only, no quotes in dashboard)
- For Vercel/Netlify: Set to `0` (serverless doesn't support keep-alive)

---

## Testing Variables

After setting variables, test with:

```bash
# Health check (shows keep-alive status)
curl https://your-app-url.com/health

# Should return:
{
  "status": "healthy",
  "keepAlive": {
    "enabled": true,
    "lastPing": "2025-01-12T10:30:00.000Z"
  }
}
```

---

## Security Best Practices

1. **Never commit .env to git** (already in .gitignore)
2. **Use different API keys** for production vs testing
3. **Rotate tokens** every few weeks
4. **Use platform secrets** (not plain environment variables) when available
5. **Limit API key access** to specific IPs if possible

---

## Quick Reference

| Platform | Method | Auto-restart |
|----------|--------|--------------|
| Railway | Dashboard or CLI | ✅ Yes |
| Render | Dashboard only | ✅ Yes |
| Vercel | Dashboard or CLI | ⚠️ Manual redeploy |
| Fly.io | CLI only | ✅ Yes |
| Koyeb | Dashboard only | ✅ Yes |
| Cyclic | Dashboard only | ✅ Yes |
| Glitch | .env file | ✅ Yes |
| Deta Space | CLI only | ✅ Yes |

---

## Need Help?

- Check platform-specific docs in [DEPLOYMENT.md](DEPLOYMENT.md)
- Test your setup with [QUICK-DEPLOY.md](QUICK-DEPLOY.md)
- See main [README.md](README.md) for API usage
