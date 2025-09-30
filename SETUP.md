# Facebook Auction Management System - Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Facebook Developer Account
- Git

## Quick Start

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd auction-management
   npm run install:all
   ```

2. **Environment Setup**
   
   **Server Environment:**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `server/.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/facebook-auction-manager
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   FACEBOOK_ACCESS_TOKEN=your-facebook-page-access-token
   FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
   CLIENT_URL=http://localhost:3000
   ```
   
   **Client Environment:**
   ```bash
   cd client
   cp .env.example .env
   ```
   
   Edit `client/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SERVER_URL=http://localhost:5000
   REACT_APP_FACEBOOK_APP_ID=your-facebook-app-id
   ```

3. **Facebook App Setup**
   
   a. Go to [Facebook Developers](https://developers.facebook.com/)
   b. Create a new app
   c. Add Facebook Login product
   d. Add Webhooks product
   e. Configure OAuth redirect URIs: `http://localhost:3000/auth/callback`
   f. Set webhook URL: `http://localhost:5000/api/facebook/webhook`
   g. Subscribe to `feed` events

4. **Database Setup**
   
   Make sure MongoDB is running:
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env file
   ```

5. **Start Development Servers**
   ```bash
   npm run dev
   ```
   
   This starts both backend (port 5000) and frontend (port 3000)

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Default User Roles

- **Admin**: Full system access
- **Auctioneer**: Can create and manage auctions
- **Bidder**: Can place bids on auctions

## Facebook Integration

### Option 1: Development Mode (No Business Required)

For testing and development without business registration:

1. **Create Personal Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Click "Create App" → "Other" → "Consumer"
   - This creates a personal app in development mode
   - Add Facebook Login product (no business verification needed)

2. **Development Mode Limitations**
   - Only works with test users and app developers
   - Cannot access public Facebook groups
   - Perfect for testing the system functionality

3. **Test User Setup**
   - In Facebook App Dashboard → Roles → Test Users
   - Create test users to simulate bidders
   - Use these accounts to test the auction system

### Option 2: Alternative Integration Methods

**Manual Bid Entry Mode:**
- Disable automatic Facebook monitoring
- Manually enter bids from Facebook comments
- Still get all auction management features
- Perfect for small-scale operations

**Screenshot/Copy-Paste Method:**
- Monitor Facebook comments manually
- Copy bid amounts into the system
- System handles all bid validation and notifications
- No Facebook API required

### Option 3: Future Business Setup

When you're ready to register a business:

1. **Register Your Business**
   - LLC, Corporation, or Sole Proprietorship
   - Get business license/EIN number
   - This enables full Facebook Business features

2. **Facebook Business Verification**
   - Submit business documents
   - Get verified for advanced features
   - Access to public group monitoring

### Current Setup (Development/Manual Mode)

For now, you can run the system in manual mode:

1. **Skip Facebook App Creation** (optional)
2. **Use Manual Bid Entry** in the admin interface
3. **All other features work normally**:
   - Auction creation and management
   - User authentication (can use email/password instead)
   - Real-time updates
   - Professional dashboard
   - Bid tracking and notifications

### Setting up Manual Mode

Edit your `server/.env` file:
```env
# Set to 'manual' to disable Facebook integration
FACEBOOK_INTEGRATION_MODE=manual

# Optional: Keep these empty for manual mode
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=
```

## Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## Production Deployment

### Environment Variables for Production

**Server:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auction-manager
JWT_SECRET=your-production-jwt-secret-very-long-and-secure
FACEBOOK_APP_ID=your-production-facebook-app-id
FACEBOOK_APP_SECRET=your-production-facebook-app-secret
FACEBOOK_ACCESS_TOKEN=your-production-facebook-page-access-token
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-production-webhook-verify-token
CLIENT_URL=https://yourdomain.com
```

**Client:**
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_SERVER_URL=https://api.yourdomain.com
REACT_APP_FACEBOOK_APP_ID=your-production-facebook-app-id
REACT_APP_ENV=production
```

### Build for Production

```bash
# Build client
cd client
npm run build

# Start production server
cd server
npm start
```

## Features

### ✅ Implemented Features

- **Authentication**: Facebook OAuth integration
- **Real-time Updates**: WebSocket-based live updates
- **Auction Management**: Create, edit, and manage auctions
- **Bid Tracking**: Automatic bid tracking from Facebook comments
- **Professional UI**: Material-UI based responsive design
- **Role-based Access**: Admin, Auctioneer, and Bidder roles
- **Dashboard**: Comprehensive analytics and management
- **Notifications**: Real-time bid and auction notifications

### 🚧 Advanced Features (Future Enhancements)

- Email notifications
- SMS alerts
- Advanced analytics
- Auction templates
- Bulk auction management
- Payment integration
- Mobile app

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Facebook Webhook Not Working**
   - Verify webhook URL is accessible
   - Check verify token matches
   - Ensure HTTPS in production

3. **Socket Connection Issues**
   - Check CORS configuration
   - Verify client/server URLs match

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

### Support

For technical support or questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## License

MIT License - see LICENSE file for details.
