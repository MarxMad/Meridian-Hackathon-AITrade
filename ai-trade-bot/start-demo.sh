#!/bin/bash

echo "🚀 ZENTRADE - Meridian Hackathon Demo Setup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔧 Building project...${NC}"
npm run build

echo -e "${GREEN}✅ Build completed!${NC}"
echo ""

echo -e "${YELLOW}🌐 Choose deployment option:${NC}"
echo "1. Start local development server (localhost:3000)"
echo "2. Start production server (localhost:3000)"
echo "3. Create public tunnel with ngrok"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "${BLUE}🚀 Starting development server...${NC}"
        echo -e "${GREEN}📱 Open: http://localhost:3000${NC}"
        npm run dev
        ;;
    2)
        echo -e "${BLUE}🚀 Starting production server...${NC}"
        echo -e "${GREEN}📱 Open: http://localhost:3000${NC}"
        npm start
        ;;
    3)
        echo -e "${BLUE}🌐 Creating public tunnel...${NC}"
        echo -e "${YELLOW}📋 Make sure you have ngrok installed: npm install -g ngrok${NC}"
        
        # Start server in background
        npm start &
        SERVER_PID=$!
        
        # Wait for server to start
        echo "⏳ Waiting for server to start..."
        sleep 5
        
        # Create tunnel
        echo -e "${GREEN}🔗 Creating public tunnel...${NC}"
        ngrok http 3000
        
        # Cleanup when script exits
        trap "kill $SERVER_PID" EXIT
        ;;
    *)
        echo -e "${YELLOW}❌ Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac
