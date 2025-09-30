const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const facebookRoutes = require('./routes/facebook');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateSocket } = require('./middleware/socketAuth');
const BidTrackingService = require('./services/BidTrackingService');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB (skip for webhook testing if connection fails)
connectDB().catch(err => {
  console.log('⚠️ MongoDB connection failed, continuing without database for webhook testing');
  console.log('📋 Database features will be limited until connection is fixed');
});

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/facebook', facebookRoutes);

// Socket.io connection handling - No authentication required
io.on('connection', (socket) => {
  console.log(`Auction manager connected: ${socket.id}`);

  // Join auction rooms
  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    console.log(`Manager ${socket.id} joined auction ${auctionId}`);
  });

  // Leave auction rooms
  socket.on('leave-auction', (auctionId) => {
    socket.leave(`auction-${auctionId}`);
    console.log(`Manager ${socket.id} left auction ${auctionId}`);
  });

  // Handle Facebook comment events from the Comments Plugin
  socket.on('facebook_comment', async (data) => {
    try {
      console.log('💬 Facebook comment event received:', data);

      const { auctionId, commentId, href } = data;

      // Get comment details from Facebook Graph API
      const commentData = await FacebookService.getCommentDetails(commentId);

      if (commentData && commentData.message) {
        console.log('📝 Processing comment for bids:', commentData.message);

        // Process the comment for bid detection
        const bidAmount = FacebookService.parseBidAmount(commentData.message);

        if (bidAmount) {
          console.log(`💰 Bid detected: $${bidAmount} from ${commentData.from.name}`);

          // Find or create user
          const user = await FacebookService.findOrCreateUser({
            facebookId: commentData.from.id,
            name: commentData.from.name
          });

          // Place the bid
          const bidResult = await BidService.placeBid({
            auctionId,
            bidderId: user._id,
            bidderName: commentData.from.name,
            amount: bidAmount,
            facebookCommentId: commentId,
            bidType: 'facebook',
            io
          });

          if (bidResult.success) {
            console.log(`✅ Facebook bid placed successfully: $${bidAmount} by ${commentData.from.name}`);

            // Emit bid update to all connected clients
            io.emit('new_bid', {
              ...bidResult.bid,
              auction: auctionId,
              bidderName: commentData.from.name
            });
          } else {
            console.log(`❌ Failed to place Facebook bid: ${bidResult.message}`);
          }
        } else {
          console.log('💭 No bid amount detected in comment');
        }
      }
    } catch (error) {
      console.error('❌ Error processing Facebook comment:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Auction manager disconnected: ${socket.id}`);
  });
});

// Initialize bid tracking service
const bidTrackingService = new BidTrackingService(io);
bidTrackingService.initialize();

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io };
