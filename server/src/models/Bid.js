const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Bidder name for display (cached from User or Facebook)
  bidderName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  // Facebook integration
  facebookCommentId: {
    type: String
  },
  // Bid metadata
  bidType: {
    type: String,
    enum: ['manual', 'facebook', 'auto'],
    default: 'manual'
  },
  isWinning: {
    type: Boolean,
    default: false
  },
  isValid: {
    type: Boolean,
    default: true
  },
  // Timestamps
  placedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for performance
bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ bidder: 1, createdAt: -1 });
bidSchema.index({ auction: 1, bidder: 1 });
bidSchema.index({ isWinning: 1, auction: 1 });

// Ensure unique Facebook comment IDs (single index with unique constraint)
bidSchema.index({ facebookCommentId: 1 }, {
  unique: true,
  sparse: true,
  partialFilterExpression: { facebookCommentId: { $exists: true } }
});

// Virtual for bid age
bidSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Pre-save validation
bidSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if auction exists and is active
    const Auction = mongoose.model('Auction');
    const auction = await Auction.findById(this.auction);
    
    if (!auction) {
      return next(new Error('Auction not found'));
    }
    
    if (auction.status !== 'active') {
      return next(new Error('Cannot bid on inactive auction'));
    }
    
    if (new Date() > auction.endTime) {
      return next(new Error('Auction has ended'));
    }
    
    // Check minimum bid amount
    const minimumBid = auction.currentBid + auction.bidIncrement;
    if (this.amount < minimumBid) {
      return next(new Error(`Minimum bid is $${minimumBid.toFixed(2)}`));
    }
    
    // Check if bidder is not the auctioneer
    if (this.bidder.toString() === auction.auctioneer.toString()) {
      return next(new Error('Auctioneer cannot bid on their own auction'));
    }
  }
  
  next();
});

// Post-save middleware to update auction
bidSchema.post('save', async function(doc) {
  try {
    const Auction = mongoose.model('Auction');
    const auction = await Auction.findById(doc.auction);
    
    if (auction) {
      // Update current bid if this is the highest
      if (doc.amount > auction.currentBid) {
        auction.currentBid = doc.amount;
        auction.winner = doc.bidder;
        
        // Add bid to auction's bids array if not already there
        if (!auction.bids.includes(doc._id)) {
          auction.bids.push(doc._id);
          auction.totalBids = auction.bids.length;
        }
        
        // Update unique bidders count
        const uniqueBidders = await mongoose.model('Bid').distinct('bidder', { auction: doc.auction });
        auction.uniqueBidders = uniqueBidders.length;
        
        // Auto-extend auction if enabled and bid placed near end
        if (auction.autoExtend && auction.timeRemaining < (5 * 60 * 1000)) { // 5 minutes
          auction.extendTime();
        }
        
        await auction.save();
        
        // Update winning status for all bids on this auction
        await mongoose.model('Bid').updateMany(
          { auction: doc.auction },
          { isWinning: false }
        );
        
        await mongoose.model('Bid').findByIdAndUpdate(
          doc._id,
          { isWinning: true }
        );
      }
    }
  } catch (error) {
    console.error('Error updating auction after bid:', error);
  }
});

// Static method to get highest bid for auction
bidSchema.statics.getHighestBid = function(auctionId) {
  return this.findOne({ auction: auctionId })
    .sort({ amount: -1 })
    .populate('bidder', 'name avatar');
};

// Static method to get bid history for auction
bidSchema.statics.getBidHistory = function(auctionId, limit = 50) {
  return this.find({ auction: auctionId })
    .populate('bidder', 'name avatar')
    .sort({ amount: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get user's bids for auction
bidSchema.statics.getUserBidsForAuction = function(auctionId, userId) {
  return this.find({ auction: auctionId, bidder: userId })
    .sort({ amount: -1 });
};

// Instance method to check if bid is current winner
bidSchema.methods.isCurrentWinner = async function() {
  const highestBid = await this.constructor.getHighestBid(this.auction);
  return highestBid && highestBid._id.toString() === this._id.toString();
};

// Transform output
bidSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Bid', bidSchema);
