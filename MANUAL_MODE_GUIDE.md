# Manual Mode Setup Guide
## Running Facebook Auction Manager Without Business Registration

Since you don't have a registered business, here's how to set up and use the auction management system in manual mode.

## 🚀 Quick Setup (No Facebook Business Required)

### 1. Environment Configuration

**Server (.env file):**
```env
# Basic Configuration
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/facebook-auction-manager
JWT_SECRET=your-super-secret-jwt-key-change-this

# Disable Facebook Integration
FACEBOOK_INTEGRATION_MODE=manual

# Optional: Leave Facebook settings empty
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_WEBHOOK_VERIFY_TOKEN=

# Client URL
CLIENT_URL=http://localhost:3000
```

**Client (.env file):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_ENV=development

# Optional: Leave empty for manual mode
REACT_APP_FACEBOOK_APP_ID=
```

### 2. Start the Application

```bash
# Install dependencies
npm run install:all

# Start both server and client
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 📝 How to Use Manual Mode

### User Registration & Login

1. **Go to the login page** (http://localhost:3000/login)
2. **Click "Register" tab**
3. **Create an account** with:
   - Full Name
   - Email Address
   - Password (minimum 6 characters)
4. **Sign in** with your credentials

### Creating Your First Auction

1. **Login to the dashboard**
2. **Click "Create Auction"**
3. **Fill in auction details**:
   - Title and description
   - Starting bid amount
   - Bid increment
   - End time
   - Category (optional)
   - Images (optional)

### Managing Bids Manually

Since Facebook integration is disabled, you'll manage bids manually:

#### Option 1: Direct Bid Entry
1. **Go to auction details page**
2. **Use "Add Manual Bid" feature** (admin/auctioneer only)
3. **Enter bidder information**:
   - Bidder name
   - Bidder email
   - Bid amount
   - Source (Facebook, Phone, Email, In-person)

#### Option 2: Monitor Facebook Manually
1. **Post your auction** in Facebook groups as usual
2. **Watch for comments** with bid amounts
3. **Copy bid information** into the system manually
4. **System handles** all validation and notifications

### User Roles

- **Admin**: Full system access, can manage all auctions
- **Auctioneer**: Can create and manage their own auctions
- **Bidder**: Can place bids on auctions (when direct bidding is enabled)

## 🔧 Features Available in Manual Mode

### ✅ Fully Functional Features

- **User Authentication**: Email/password registration and login
- **Auction Management**: Create, edit, and manage auctions
- **Manual Bid Entry**: Add bids from any source
- **Real-time Updates**: Live bid updates via WebSocket
- **Professional Dashboard**: Analytics and management tools
- **Responsive Design**: Works on all devices
- **Role-based Access**: Different permissions for different users
- **Notifications**: In-app notifications for bid updates
- **Auction Timer**: Automatic auction ending
- **Bid Validation**: Ensures proper bid increments

### 🚧 Limited Features (Due to No Facebook Integration)

- **Automatic Facebook Monitoring**: Must monitor manually
- **Facebook Comment Parsing**: Must enter bids manually
- **Facebook Notifications**: No automatic replies to comments

## 💡 Workflow for Facebook Group Auctions

### 1. Create Auction in System
- Set up auction with all details
- Note the auction ID for reference

### 2. Post in Facebook Group
```
🔥 AUCTION: [Item Title]
Starting Bid: $[amount]
Bid Increment: $[amount]
Ends: [date/time]

Comment below with your bid amount!
Example: $25.00

Auction ID: [system-generated-id]
```

### 3. Monitor Comments
- Watch Facebook comments for bids
- Look for patterns like "$25", "25 dollars", "bid: $25"
- Note bidder names and amounts

### 4. Enter Bids in System
- Go to auction management page
- Click "Add Manual Bid"
- Enter:
  - Bidder name (from Facebook)
  - Bidder email (ask if needed, or use placeholder)
  - Bid amount
  - Source: "Facebook"

### 5. System Handles the Rest
- Validates bid amounts
- Updates current high bid
- Sends notifications to other bidders
- Manages auction timing
- Declares winner when auction ends

## 🎯 Benefits of Manual Mode

### Advantages
- **No business registration required**
- **Full control over bid validation**
- **Works with any platform** (Facebook, Instagram, email, phone)
- **Professional auction management**
- **Real-time updates for participants**
- **Comprehensive analytics**

### Perfect For
- **Small-scale auctioneers**
- **Hobby sellers**
- **Community groups**
- **Testing the system**
- **Learning auction management**

## 🔄 Future Upgrade Path

When you're ready to register a business:

1. **Register your business** (LLC, Corporation, etc.)
2. **Get business verification** from Facebook
3. **Update environment variables** with Facebook credentials
4. **Enable automatic mode** by changing `FACEBOOK_INTEGRATION_MODE=auto`
5. **All manual data transfers** to automatic system

## 🆘 Troubleshooting

### Common Issues

**Q: Can't create an account**
A: Make sure you're using a valid email and password is at least 6 characters

**Q: Bids not showing up**
A: Check that you're entering bids as an admin/auctioneer role

**Q: Real-time updates not working**
A: Refresh the page, check browser console for WebSocket errors

**Q: Auction not ending automatically**
A: Server handles this automatically, check server logs

### Getting Help

1. **Check server logs** for error messages
2. **Check browser console** for frontend errors
3. **Verify environment variables** are set correctly
4. **Ensure MongoDB is running**

## 📞 Support

This manual mode gives you full auction management capabilities without needing Facebook business verification. You get all the professional features while maintaining complete control over the bidding process.

The system is designed to be flexible - you can always upgrade to automatic Facebook integration later when you're ready to register a business.
