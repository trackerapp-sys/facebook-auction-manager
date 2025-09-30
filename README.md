# 🤖 FULLY AUTOMATIC Facebook Auction Management System

A professional system that provides **100% AUTOMATIC** Facebook group auction management with real-time bid tracking and **ZERO MANUAL ENTRY** required.

## 🎯 AUTOMATIC Features (No Manual Work!)

- **🤖 AUTOMATIC Bid Detection**: Monitors Facebook comments 24/7 and detects bids instantly
- **⚡ Real-time Processing**: Processes bids in real-time as comments are posted
- **🧠 Smart Bid Parsing**: Recognizes bid amounts in natural language ("$25", "25 dollars", "I bid 30")
- **🔔 Automatic Notifications**: Sends instant alerts when users are outbid
- **⏰ Automatic Timing**: Handles auction start/end times automatically
- **🏆 Automatic Winner Selection**: Declares winners when auctions end
- **📊 Live Analytics**: Real-time stats and reporting
- **📱 Professional Dashboard**: Complete auction management interface
- **🔐 Secure Authentication**: Facebook OAuth and email/password options
- **👥 Role-based Access**: Admin, Auctioneer, and Bidder permissions

## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Material-UI (MUI)** - Professional component library
- **Socket.io Client** - Real-time communication
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **Facebook Graph API** - Social media integration

## Quick Start

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env` in both `server/` and `client/` directories
   - Fill in your Facebook App credentials and MongoDB connection string

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
facebook-auction-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
└── docs/                  # Documentation
```

## Configuration

### Facebook App Setup
1. Create a Facebook App at https://developers.facebook.com/
2. Add Facebook Login product
3. Configure OAuth redirect URIs
4. Get App ID and App Secret

### Environment Variables
See `.env.example` files for required configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
