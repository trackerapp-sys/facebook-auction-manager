const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'General'
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  startingBid: {
    type: Number,
    required: true,
    min: 0.01
  },
  currentBid: {
    type: Number,
    required: true,
    min: 0.01
  },
  bidIncrement: {
    type: Number,
    required: true,
    min: 0.01,
    default: 1.00
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'End time must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'ended', 'cancelled'],
    default: 'draft'
  },
  auctioneer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  }],
  // Facebook integration fields
  facebookPostId: {
    type: String,
    sparse: true
  },
  facebookPostUrl: {
    type: String,
    sparse: true
  },
  facebookGroupId: {
    type: String,
    sparse: true
  },
  auctionType: {
    type: String,
    enum: ['facebook_post', 'live_feed'],
    default: 'facebook_post'
  },
  // Auction settings
  autoExtend: {
    type: Boolean,
    default: true
  },
  extensionTime: {
    type: Number, // minutes
    default: 5
  },
  reservePrice: {
    type: Number,
    min: 0,
    default: null
  },
  buyNowPrice: {
    type: Number,
    min: 0,
    default: null
  },
  // Statistics
  totalBids: {
    type: Number,
    default: 0
  },
  uniqueBidders: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  // Metadata
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }]
}, {
  timestamps: true
});

// Indexes for performance (facebookPostId already has sparse index from schema definition)
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ auctioneer: 1 });
auctionSchema.index({ category: 1 });
auctionSchema.index({ featured: 1, createdAt: -1 });
auctionSchema.index({
  title: 'text',
  description: 'text',
  category: 'text'
});

// Virtual for time remaining
auctionSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return null;
  const now = new Date();
  const remaining = this.endTime - now;
  return remaining > 0 ? remaining : 0;
});

// Virtual for is ended
auctionSchema.virtual('isEnded').get(function() {
  return new Date() > this.endTime;
});

// Virtual for has reserve met
auctionSchema.virtual('reserveMet').get(function() {
  if (!this.reservePrice) return true;
  return this.currentBid >= this.reservePrice;
});

// Pre-save middleware to update status
auctionSchema.pre('save', function(next) {
  // Auto-end auction if time has passed
  if (this.status === 'active' && new Date() > this.endTime) {
    this.status = 'ended';
  }
  
  // Ensure current bid is at least starting bid
  if (this.currentBid < this.startingBid) {
    this.currentBid = this.startingBid;
  }
  
  next();
});

// Method to add bid
auctionSchema.methods.addBid = function(bidId) {
  if (!this.bids.includes(bidId)) {
    this.bids.push(bidId);
    this.totalBids = this.bids.length;
  }
  return this.save();
};

// Method to remove bid
auctionSchema.methods.removeBid = function(bidId) {
  this.bids.pull(bidId);
  this.totalBids = this.bids.length;
  return this.save();
};

// Method to update current bid
auctionSchema.methods.updateCurrentBid = function(amount) {
  this.currentBid = amount;
  return this.save();
};

// Method to end auction
auctionSchema.methods.endAuction = function(winnerId = null) {
  this.status = 'ended';
  if (winnerId) {
    this.winner = winnerId;
  }
  return this.save();
};

// Method to extend auction time
auctionSchema.methods.extendTime = function(minutes = null) {
  const extensionMinutes = minutes || this.extensionTime;
  this.endTime = new Date(this.endTime.getTime() + (extensionMinutes * 60000));
  return this.save();
};

// Transform output
auctionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Auction', auctionSchema);
