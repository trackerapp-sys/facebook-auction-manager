const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      // Password required only if no Facebook ID (manual registration)
      return !this.facebookId;
    },
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'auctioneer', 'bidder'],
    default: 'bidder'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      bidUpdates: { type: Boolean, default: true },
      auctionReminders: { type: Boolean, default: true }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  stats: {
    totalBids: { type: Number, default: 0 },
    wonAuctions: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for performance (facebookId and email already have unique indexes from schema definition)
userSchema.index({ role: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    stats: this.stats
  };
});

// Hash password before saving (if password field is added later)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Increment bid count
userSchema.methods.incrementBidCount = function() {
  this.stats.totalBids += 1;
  return this.save();
};

// Update won auction stats
userSchema.methods.updateWonAuction = function(amount) {
  this.stats.wonAuctions += 1;
  this.stats.totalSpent += amount;
  return this.save();
};

// Transform output
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
