# Free Deployment Options

This guide covers multiple free hosting platforms for deploying the DeepSeek API server.

## 🚀 Quick Comparison

| Platform | Free Tier | Always On | Setup Difficulty | Best For |
|----------|-----------|-----------|------------------|----------|
| **Railway** | 500 hrs/month | ✅ Yes | ⭐ Easy | Production |
| **Fly.io** | 3 VMs free | ✅ Yes | ⭐⭐ Medium | Production |
| **Koyeb** | 1 service free | ✅ Yes | ⭐ Easy | Production |
| **Vercel** | Unlimited | ⚠️ Serverless | ⭐ Easy | Light usage |
| **Netlify** | Unlimited | ⚠️ Serverless | ⭐ Easy | Light usage |
| **Glitch** | Free | ⚠️ Sleeps | ⭐ Easy | Testing |
| **Cyclic** | Free | ✅ Yes | ⭐ Easy | Production |
| **Deta Space** | Free | ✅ Yes | ⭐⭐ Medium | Personal |

---

## 1. Railway (Recommended) ⭐

**Pros:** Easy setup, 500 hours/month free, always on, great for Node.js

### Setup Steps:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Add environment variables:**
   ```bash
   railway variables set DEEPSEEK_AUTHTOKEN="your-token-here"
   railway variables set API_KEY="sk-your-key"
   railway variables set KEEP_ALIVE_INTERVAL="30"
   ```
   
   **Or use Railway Dashboard:**
   - Go to your project → Variables tab
   - Add each variable:
     - `DEEPSEEK_AUTHTOKEN` = your token (no quotes)
     - `API_KEY` = sk-your-key
     - `KEEP_ALIVE_INTERVAL` = 30

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get URL:**
   ```bash
   railway domain
   ```

**Or use Railway Dashboard:**
- Go to [railway.app](https://railway.app)
- Click "New Project" → "Deploy from GitHub"
- Connect your repo
- Add environment variables in Settings
- Deploy automatically

---

## 2. Fly.io

**Pros:** 3 free VMs, global edge network, Docker-based

### Setup Steps:

1. **Install Fly CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # Linux/Mac
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create fly.toml:**
   ```bash
   fly launch
   ```

4. **Set secrets:**
   ```bash
   fly secrets set DEEPSEEK_AUTHTOKEN="your-token-here"
   fly secrets set API_KEY="sk-your-key"
   fly secrets set KEEP_ALIVE_INTERVAL="30"
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

**fly.toml configuration:**
```toml
app = "deepseek-api"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3000"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

---

## 3. Koyeb

**Pros:** Simple, 1 free service, auto-scaling, global CDN

### Setup Steps:

1. **Go to [koyeb.com](https://www.koyeb.com)**

2. **Create new app:**
   - Click "Create App"
   - Choose "Docker" or "GitHub"
   - Select your repository

3. **Configure:**
   - Port: `3000`
   - Environment variables (add in Koyeb dashboard):
     - `DEEPSEEK_AUTHTOKEN` = your-token-here
     - `API_KEY` = sk-your-key
     - `KEEP_ALIVE_INTERVAL` = 30

4. **Deploy:**
   - Click "Deploy"
   - Get your URL: `https://your-app.koyeb.app`

---

## 4. Vercel (Serverless)

**Pros:** Unlimited deployments, instant, great for APIs

**Cons:** Serverless (10s timeout), keep-alive won't work continuously

### Setup Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ],
     "env": {
       "DEEPSEEK_AUTHTOKEN": "@deepseek-token",
       "API_KEY": "@api-key",
       "KEEP_ALIVE_INTERVAL": "0"
     }
   }
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add environment variables in Vercel dashboard:**
   - Go to Settings → Environment Variables
   - Add:
     - `DEEPSEEK_AUTHTOKEN` = your-token-here
     - `API_KEY` = sk-your-key
     - `KEEP_ALIVE_INTERVAL` = 0

**Note:** Set `KEEP_ALIVE_INTERVAL=0` for serverless (keep-alive doesn't work in serverless)

---

## 5. Netlify (Serverless Functions)

**Pros:** Free, unlimited bandwidth, easy GitHub integration

**Cons:** Serverless, requires function wrapper

### Setup Steps:

1. **Create netlify.toml:**
   ```toml
   [build]
     command = "npm install"
     functions = "netlify/functions"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200
   ```

2. **Create function wrapper:**
   ```bash
   mkdir -p netlify/functions
   ```

3. **Create netlify/functions/api.js:**
   ```javascript
   import serverless from 'serverless-http';
   import express from 'express';
   import DeepSeek from '../../deepseek.js';
   
   const app = express();
   // ... (copy server.js logic)
   
   export const handler = serverless(app);
   ```

4. **Deploy:**
   - Push to GitHub
   - Connect to Netlify
   - Add environment variables in Netlify dashboard

---

## 6. Cyclic

**Pros:** Free, always on, simple deployment

### Setup Steps:

1. **Go to [cyclic.sh](https://www.cyclic.sh)**

2. **Connect GitHub:**
   - Click "Deploy"
   - Select your repository

3. **Configure:**
   - Add environment variables:
     - `DEEPSEEK_AUTHTOKEN`
     - `API_KEY`
     - `KEEP_ALIVE_INTERVAL=30`

4. **Deploy:**
   - Automatic deployment on push
   - Get URL: `https://your-app.cyclic.app`

---

## 7. Glitch

**Pros:** Instant setup, live editor, free

**Cons:** Sleeps after 5 minutes of inactivity

### Setup Steps:

1. **Go to [glitch.com](https://glitch.com)**

2. **Create new project:**
   - Click "New Project" → "Import from GitHub"
   - Paste your repo URL

3. **Configure .env:**
   ```env
   DEEPSEEK_AUTHTOKEN=your-token-here
   API_KEY=sk-your-key
   KEEP_ALIVE_INTERVAL=30
   ```

4. **Access:**
   - URL: `https://your-project.glitch.me`

**Keep awake (optional):**
- Use UptimeRobot to ping every 5 minutes
- Free at [uptimerobot.com](https://uptimerobot.com)

---

## 8. Deta Space

**Pros:** Free, always on, simple

### Setup Steps:

1. **Install Deta CLI:**
   ```bash
   # Windows
   iwr https://get.deta.dev/space-cli.ps1 -useb | iex
   
   # Linux/Mac
   curl -fsSL https://get.deta.dev/space-cli.sh | sh
   ```

2. **Login:**
   ```bash
   space login
   ```

3. **Create Spacefile:**
   ```yaml
   v: 0
   micros:
     - name: deepseek-api
       src: .
       engine: nodejs16
       run: node server.js
       primary: true
   ```

4. **Deploy:**
   ```bash
   space push
   ```

5. **Set environment:**
   ```bash
   space env add DEEPSEEK_AUTHTOKEN your-token-here
   space env add API_KEY sk-your-key
   ```

---

## 9. Fly.io Alternative: Dokku (Self-hosted)

If you have a VPS (DigitalOcean, Linode, etc.):

```bash
# Install Dokku
wget https://raw.githubusercontent.com/dokku/dokku/v0.30.0/bootstrap.sh
sudo DOKKU_TAG=v0.30.0 bash bootstrap.sh

# Create app
dokku apps:create deepseek-api

# Set environment
dokku config:set deepseek-api DEEPSEEK_AUTHTOKEN=your-token
dokku config:set deepseek-api API_KEY=sk-your-key

# Deploy
git remote add dokku dokku@your-server:deepseek-api
git push dokku main
```

---

## Environment Variables for All Platforms

Always set these:

```env
DEEPSEEK_AUTHTOKEN=your-deepseek-token
API_KEY=sk-your-secret-key
KEEP_ALIVE_INTERVAL=30
PORT=3000
```

For serverless platforms (Vercel, Netlify):
```env
KEEP_ALIVE_INTERVAL=0
```

---

## Testing Your Deployment

After deployment, test with:

```bash
# Health check
curl https://your-app-url.com/health

# List models
curl https://your-app-url.com/v1/models \
  -H "Authorization: Bearer sk-your-key"

# Chat completion
curl https://your-app-url.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## Monitoring & Uptime

### Free Monitoring Services:

1. **UptimeRobot** (uptimerobot.com)
   - 50 monitors free
   - 5-minute intervals
   - Email/SMS alerts

2. **Better Uptime** (betteruptime.com)
   - 10 monitors free
   - 30-second intervals
   - Status page

3. **Freshping** (freshping.io)
   - 50 monitors free
   - 1-minute intervals

### Setup:
- Monitor: `https://your-app-url.com/health`
- Interval: 5 minutes
- Alert on: Status code != 200

---

## Cost Comparison (Monthly)

| Platform | Free Tier | Paid Starts At |
|----------|-----------|----------------|
| Railway | 500 hrs | $5/month |
| Fly.io | 3 VMs | $1.94/VM |
| Koyeb | 1 service | €5/month |
| Vercel | Unlimited | $20/month |
| Cyclic | Unlimited | $5/month |
| Glitch | Unlimited | $8/month |

---

## Recommended Setup

**For Production:**
1. **Railway** or **Fly.io** (best reliability)
2. Add **UptimeRobot** monitoring
3. Use multiple tokens for load balancing

**For Testing:**
1. **Glitch** (instant, no setup)
2. **Vercel** (if serverless is okay)

**For Personal Use:**
1. **Cyclic** or **Koyeb** (simple, reliable)

---

## Troubleshooting

### App sleeps/stops
- Use Railway, Fly.io, or Koyeb (always on)
- Add UptimeRobot to ping every 5 minutes

### Token expires
- Ensure `KEEP_ALIVE_INTERVAL=30` is set
- Check `/health` endpoint for keep-alive status
- Serverless platforms: keep-alive won't work

### Port issues
- Most platforms auto-detect PORT
- Ensure `PORT` env var is set if needed

### Build fails
- Check Node.js version (use 18+)
- Ensure all dependencies in package.json
- Check build logs for errors

---

## Need Help?

Check the main [README.md](README.md) for:
- API documentation
- Usage examples
- Troubleshooting guide
