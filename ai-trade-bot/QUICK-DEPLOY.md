# 🚀 QUICK DEPLOYMENT FOR HACKATHON

## ⚡ Fastest Option: ngrok (2 minutes)

```bash
# 1. Build the project
npm run build

# 2. Start production server
npm start

# 3. In another terminal, create public tunnel
ngrok http 3000
```

**Result:** Public URL like `https://abc123.ngrok.io` ✅

---

## 🌐 Vercel Deployment (5 minutes)

### Prerequisites:
- GitHub account
- Vercel account (free)

### Steps:

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for hackathon demo"
git push origin main
```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repo
   - Click "Deploy"

3. **Set Environment Variables** (in Vercel dashboard):
```
COINGECKO_API_KEY=CG-SRKm83vPGJwuXMVkmbBQRAXU
STELLAR_NETWORK=testnet
```

**Result:** Live URL like `https://zentrade.vercel.app` ✅

---

## 🖥️ Local Demo Script

```bash
# Run the automated demo setup
./start-demo.sh
```

Choose option 3 for public tunnel.

---

## ✅ What's Working:

- ✅ **Landing Page** - Complete with tech showcase
- ✅ **Trading Interface** - Real leveraged trading
- ✅ **Swaps Interface** - XLM ↔ USDC via Soroswap
- ✅ **Real-time Prices** - CoinGecko + Soroswap integration
- ✅ **Wallet Integration** - Freighter, Albedo, Rabet
- ✅ **Telegram Bot** - Complete mobile trading experience

## 📱 Demo Flow:

1. **Landing** → Show composability
2. **Connect Wallet** → Test Wallet Kit
3. **View Prices** → Real-time data
4. **Execute Swap** → Real blockchain transaction
5. **Open Trade** → Leveraged position
6. **Telegram Bot** → Mobile experience

## 🎯 For Judges:

- **Web Demo:** `your-deployed-url.com`
- **Telegram:** `@YourBotName` (running locally)
- **Explorer:** All transactions visible on Stellar testnet
- **Duration:** 5-10 minute demo

## 🛠️ Troubleshooting:

**Build Errors?**
```bash
npm run build:ignore-eslint
```

**Port 3000 busy?**
```bash
npx kill-port 3000
npm start
```

**Vercel Deployment Issues?**
- Check environment variables are set
- Ensure repository is public or Vercel has access

---

**🎉 Ready for Hackathon Demo!**

