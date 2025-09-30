const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.io authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (!user.isActive) {
      return next(new Error('Authentication error: Account deactivated'));
    }

    // Attach user info to socket
    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userName = user.name;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }

    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

module.exports = { authenticateSocket };
