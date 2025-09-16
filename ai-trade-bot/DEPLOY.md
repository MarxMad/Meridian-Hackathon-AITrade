# 🚀 Deployment Guide for ZENTRADE

## Option 1: Vercel Deployment (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free)
- Project pushed to GitHub

### Steps:

1. **Push to GitHub** (if not already done):
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Environment Variables in Vercel**:
   Add these in your Vercel project settings:
   ```
   COINGECKO_API_KEY=CG-SRKm83vPGJwuXMVkmbBQRAXU
   STELLAR_NETWORK=testnet
   CONTRACT_ID=your-contract-id
   ```

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live at: `https://your-project.vercel.app`

---

## Option 2: Netlify (Alternative)

### Steps:
1. Build the project:
```bash
npm run build
npm run export
```

2. Deploy to Netlify:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `out` folder
   - Your app will be live instantly

---

## Option 3: Railway (With Database Support)

### Steps:
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Railway will auto-deploy
4. Add environment variables in Railway dashboard

---

## Option 4: Local Tunnel (Quick Demo)

### Using ngrok:
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

This gives you a public URL like: `https://abc123.ngrok.io`

---

## 🎯 For Hackathon Demo

**Fastest Options:**
1. **Vercel** - Best for Next.js, free tier, custom domain
2. **ngrok** - Instant public URL for local development
3. **Netlify** - Static export deployment

**Features Supported:**
✅ Landing page  
✅ Trading interface  
✅ Swaps interface  
✅ Real-time prices  
✅ Wallet connections  
✅ Soroswap integration  

**Note:** Telegram bot runs separately and doesn't need web deployment.
