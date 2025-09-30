# 🚀 Facebook Personal Developer Setup - AUTOMATIC Bid Tracking

This guide shows you how to set up FULLY AUTOMATIC Facebook comment monitoring using a personal Facebook developer account (no business registration required).

## 🎯 What You'll Get

- **100% Automatic** bid detection from Facebook comments
- **Real-time** comment monitoring via webhooks
- **Smart parsing** of bid amounts from natural language
- **Instant notifications** to bidders when outbid
- **Zero manual entry** - everything is automated

## 📋 Step-by-Step Setup

### Step 1: Create Facebook Developer Account

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Click "Get Started"
   - Use your personal Facebook account (no business needed!)

2. **Choose Account Type**
   - Select "I'm building an app for myself or a small group"
   - This creates a PERSONAL developer account
   - No business verification required!

3. **Verify Your Account**
   - Add phone number if requested
   - Complete any security verification

### Step 2: Create Your App

1. **Create New App**
   - Click "Create App"
   - Choose "Other" → "Consumer"
   - App Display Name: "My Auction Manager" (or any name)
   - App Contact Email: Your email
   - Click "Create App"

2. **Get App Credentials**
   - Go to App Dashboard → Settings → Basic
   - Copy your **App ID**
   - Copy your **App Secret** (click "Show")
   - Save these for your environment file

### Step 3: Add Facebook Products

1. **Add Facebook Login**
   - In App Dashboard → Add Product
   - Find "Facebook Login" → Click "Set Up"
   - Choose "Web" platform
   - Site URL: `http://localhost:3000`

2. **Add Webhooks**
   - In App Dashboard → Add Product
   - Find "Webhooks" → Click "Set Up"
   - We'll configure this after starting the server

### Step 4: Get Page Access Token

**Option A: Graph API Explorer (Recommended)**
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Grant these permissions:
   - `pages_read_engagement` (to read comments)
   - `pages_manage_posts` (to manage posts)
   - `pages_show_list` (to list your pages)
5. Copy the generated token

**Option B: Manual Token Generation**
1. Go to: https://developers.facebook.com/tools/accesstoken/
2. Select your app
3. Generate a User Access Token
4. Use Facebook's Token Debugger to extend it

### Step 5: Configure Environment

**Update your `server/.env` file:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/facebook-auction-manager
JWT_SECRET=your-super-secret-jwt-key

# Facebook Integration - AUTOMATIC MODE
FACEBOOK_INTEGRATION_MODE=auto
FACEBOOK_APP_ID=your-app-id-from-step-2
FACEBOOK_APP_SECRET=your-app-secret-from-step-2
FACEBOOK_ACCESS_TOKEN=your-token-from-step-4
FACEBOOK_WEBHOOK_VERIFY_TOKEN=my-webhook-secret-123

CLIENT_URL=http://localhost:3000
```

**Update your `client/.env` file:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_ENV=development
REACT_APP_FACEBOOK_APP_ID=your-app-id-from-step-2
```

### Step 6: Setup Webhook for Real-time Comments

**Install ngrok (for development):**
```bash
# Install ngrok globally
npm install -g ngrok

# Start your server first
npm run dev

# In a new terminal, expose your server
ngrok http 5000
```

**Configure Facebook Webhook:**
1. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
2. In Facebook App Dashboard → Products → Webhooks
3. Click "New Subscription" → "Page"
4. Callback URL: `https://your-ngrok-url.ngrok.io/api/facebook/webhook`
5. Verify Token: `my-webhook-secret-123` (from your .env)
6. Subscribe to these fields:
   - `feed` (for post comments)
   - `comments` (for comment updates)
7. Click "Verify and Save"

### Step 7: Connect Your Facebook Page

1. **In the auction app dashboard:**
   - Go to Settings → Facebook Integration
   - Click "Connect Facebook Page"
   - Select the page you want to monitor
   - Grant necessary permissions

2. **Subscribe to Page Events:**
   - The system will automatically subscribe to your page
   - You'll see confirmation in the app

## 🎉 Testing the Setup

### Test Automatic Bid Detection:

1. **Create a test auction** in the system
2. **Create a Facebook post** about the auction
3. **Link the post** to your auction in the dashboard
4. **Have friends comment** with bids like:
   - "$25"
   - "I bid 30 dollars"
   - "35.50"
   - "Bid: $40"
5. **Watch the magic** - bids appear automatically in your dashboard!

## 🔧 Development Mode Benefits

### What Works in Personal/Development Mode:

✅ **Automatic comment monitoring** from your pages  
✅ **Real-time webhook notifications**  
✅ **Smart bid parsing and validation**  
✅ **All auction management features**  
✅ **User authentication and roles**  
✅ **Professional dashboard**  
✅ **Mobile responsive design**  

### Limitations (Development Mode):

⚠️ **Limited to your pages** - Can only monitor pages you admin  
⚠️ **Test users only** - Other users need to be added as testers  
⚠️ **Rate limits** - Lower API call limits  

### Adding Test Users:

1. **In Facebook App Dashboard:**
   - Go to Roles → Test Users
   - Click "Create Test Users"
   - Add friends/family as test users
   - They can interact with your posts

## 🚀 Going Live (When Ready)

When you want to monitor public Facebook groups:

1. **Register a business** (LLC, Corporation, etc.)
2. **Submit for App Review** with business documents
3. **Request advanced permissions**
4. **Switch to production mode**

But for now, you get FULL AUTOMATION for your own pages and test users!

## 🆘 Troubleshooting

### Common Issues:

**Webhook not receiving events:**
- Check ngrok is running and URL is correct
- Verify webhook subscription is active
- Check Facebook App logs for errors

**Access token expired:**
- Generate a new token from Graph API Explorer
- Update your .env file
- Restart the server

**Comments not being detected:**
- Check the post is linked to an auction
- Verify webhook subscription includes 'feed' events
- Check server logs for parsing errors

### Debug Tools:

- **Facebook App Dashboard** → App Review → Logs
- **Graph API Explorer** for testing API calls
- **Webhook Debugger** in Facebook Developer Tools
- **Server logs** for bid processing details

## 🎯 Success!

Once set up, you'll have a FULLY AUTOMATIC Facebook auction system that:

- Monitors comments 24/7
- Detects bids instantly
- Validates and processes automatically
- Notifies bidders in real-time
- Manages entire auction lifecycle

No manual entry required - everything is automated! 🤖
