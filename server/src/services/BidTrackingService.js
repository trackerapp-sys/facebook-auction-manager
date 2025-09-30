const cron = require('node-cron');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');

// Try to import NotificationService, but don't fail if it doesn't exist
let NotificationService;
try {
  NotificationService = require('./NotificationService');
} catch (error) {
  console.warn('⚠️ NotificationService not found, notifications will be disabled');
  NotificationService = {
    sendTimeWarningNotification: async () => {},
    sendWinnerNotification: async () => {},
    sendAuctionEndedNotification: async () => {}
  };
}

class BidTrackingService {
  constructor(io) {
    this.io = io;
    this.cronJobs = new Map();
  }

  // Initialize the service
  initialize() {
    console.log('🔄 Initializing Bid Tracking Service...');

    try {
      // Start auction monitoring (with error handling)
      this.startAuctionMonitoring();

      // Schedule auction end checks every minute
      this.scheduleAuctionEndChecks();

      // Schedule cleanup tasks
      this.scheduleCleanupTasks();

      console.log('✅ Bid Tracking Service initialized');
    } catch (error) {
      console.error('❌ Error initializing Bid Tracking Service:', error);
      console.log('⚠️ Continuing without bid tracking...');
    }
  }

  // Start monitoring active auctions
  async startAuctionMonitoring() {
    try {
      const activeAuctions = await Auction.find({ status: 'active' });
      
      for (const auction of activeAuctions) {
        this.monitorAuction(auction);
      }
      
      console.log(`📊 Monitoring ${activeAuctions.length} active auctions`);
    } catch (error) {
      console.error('Error starting auction monitoring:', error);
    }
  }

  // Monitor a specific auction
  monitorAuction(auction) {
    const auctionId = auction._id.toString();
    
    // Create a cron job for this auction that runs every minute
    const cronExpression = '* * * * *'; // Every minute
    
    const job = cron.schedule(cronExpression, async () => {
      await this.checkAuctionStatus(auction);
    }, {
      scheduled: false
    });
    
    // Store the job
    this.cronJobs.set(auctionId, job);
    job.start();
    
    console.log(`🎯 Started monitoring auction: ${auction.title} (${auctionId})`);
  }

  // Stop monitoring an auction
  stopMonitoringAuction(auctionId) {
    const job = this.cronJobs.get(auctionId);
    if (job) {
      job.destroy();
      this.cronJobs.delete(auctionId);
      console.log(`⏹️ Stopped monitoring auction: ${auctionId}`);
    }
  }

  // Check auction status and handle end conditions
  async checkAuctionStatus(auction) {
    try {
      // Refresh auction data
      const currentAuction = await Auction.findById(auction._id)
        .populate('winner', 'name email avatar')
        .populate('auctioneer', 'name email');
      
      if (!currentAuction || currentAuction.status !== 'active') {
        this.stopMonitoringAuction(auction._id.toString());
        return;
      }
      
      const now = new Date();
      const timeRemaining = currentAuction.endTime - now;
      
      // Check if auction should end
      if (timeRemaining <= 0) {
        await this.endAuction(currentAuction);
        return;
      }
      
      // Send time warnings
      await this.sendTimeWarnings(currentAuction, timeRemaining);
      
      // Emit real-time updates
      this.io.to(`auction-${currentAuction._id}`).emit('auction-update', {
        auctionId: currentAuction._id,
        timeRemaining,
        currentBid: currentAuction.currentBid,
        totalBids: currentAuction.totalBids
      });
      
    } catch (error) {
      console.error('Error checking auction status:', error);
    }
  }

  // End an auction
  async endAuction(auction) {
    try {
      console.log(`🏁 Ending auction: ${auction.title}`);
      
      // Update auction status
      auction.status = 'ended';
      await auction.save();
      
      // Stop monitoring this auction
      this.stopMonitoringAuction(auction._id.toString());
      
      // Get the winning bid
      const winningBid = await Bid.findOne({ auction: auction._id })
        .sort({ amount: -1 })
        .populate('bidder', 'name email avatar');
      
      let winner = null;
      let finalAmount = auction.startingBid;
      
      if (winningBid) {
        winner = winningBid.bidder;
        finalAmount = winningBid.amount;
        
        // Update auction winner
        auction.winner = winner._id;
        await auction.save();
        
        // Update winner's stats
        await winner.updateWonAuction(finalAmount);
      }
      
      // Emit auction ended event
      this.io.to(`auction-${auction._id}`).emit('auction-ended', {
        auctionId: auction._id,
        winner: winner ? {
          id: winner._id,
          name: winner.name,
          avatar: winner.avatar
        } : null,
        finalBid: finalAmount,
        endReason: 'time_expired'
      });
      
      // Send notifications
      await this.sendAuctionEndNotifications(auction, winner, finalAmount);
      
      console.log(`✅ Auction ended: ${auction.title} - Winner: ${winner?.name || 'No winner'} - Final bid: $${finalAmount}`);
      
    } catch (error) {
      console.error('Error ending auction:', error);
    }
  }

  // Send time warnings
  async sendTimeWarnings(auction, timeRemaining) {
    const minutes = Math.floor(timeRemaining / (1000 * 60));
    
    // Send warnings at 60, 30, 15, 5, and 1 minute marks
    const warningTimes = [60, 30, 15, 5, 1];
    
    if (warningTimes.includes(minutes)) {
      // Emit time warning
      this.io.to(`auction-${auction._id}`).emit('time-warning', {
        auctionId: auction._id,
        minutesRemaining: minutes,
        message: `${minutes} minute${minutes !== 1 ? 's' : ''} remaining!`
      });
      
      // Send notifications to interested users
      await NotificationService.sendTimeWarningNotification(auction, minutes);
    }
  }

  // Send auction end notifications
  async sendAuctionEndNotifications(auction, winner, finalAmount) {
    try {
      // Notify winner
      if (winner) {
        await NotificationService.sendWinnerNotification(winner, auction, finalAmount);
      }
      
      // Notify auctioneer
      await NotificationService.sendAuctionEndedNotification(
        auction.auctioneer,
        auction,
        winner,
        finalAmount
      );
      
      // Notify all bidders who didn't win
      const losingBidders = await Bid.distinct('bidder', {
        auction: auction._id,
        bidder: { $ne: winner?._id }
      });
      
      for (const bidderId of losingBidders) {
        const bidder = await User.findById(bidderId);
        if (bidder) {
          await NotificationService.sendAuctionEndedNotification(
            bidder,
            auction,
            winner,
            finalAmount,
            false // isWinner = false
          );
        }
      }
      
    } catch (error) {
      console.error('Error sending auction end notifications:', error);
    }
  }

  // Schedule auction end checks (backup system)
  scheduleAuctionEndChecks() {
    // Run every 5 minutes as a backup check
    cron.schedule('*/5 * * * *', async () => {
      try {
        const expiredAuctions = await Auction.find({
          status: 'active',
          endTime: { $lte: new Date() }
        });
        
        for (const auction of expiredAuctions) {
          console.log(`🔄 Backup check: Ending expired auction ${auction.title}`);
          await this.endAuction(auction);
        }
        
      } catch (error) {
        console.error('Error in backup auction end check:', error);
      }
    });
  }

  // Schedule cleanup tasks
  scheduleCleanupTasks() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🧹 Running daily cleanup tasks...');
        
        // Clean up old ended auctions (optional - keep for records)
        // await this.cleanupOldAuctions();
        
        // Update auction statistics
        await this.updateAuctionStatistics();
        
        console.log('✅ Daily cleanup completed');
        
      } catch (error) {
        console.error('Error in daily cleanup:', error);
      }
    });
  }

  // Update auction statistics
  async updateAuctionStatistics() {
    try {
      const auctions = await Auction.find({ status: 'ended' });
      
      for (const auction of auctions) {
        const bids = await Bid.find({ auction: auction._id });
        const uniqueBidders = new Set(bids.map(bid => bid.bidder.toString()));
        
        auction.totalBids = bids.length;
        auction.uniqueBidders = uniqueBidders.size;
        
        await auction.save();
      }
      
      console.log(`📊 Updated statistics for ${auctions.length} auctions`);
      
    } catch (error) {
      console.error('Error updating auction statistics:', error);
    }
  }

  // Start monitoring a new auction
  async startMonitoringNewAuction(auctionId) {
    try {
      const auction = await Auction.findById(auctionId);
      if (auction && auction.status === 'active') {
        this.monitorAuction(auction);
      }
    } catch (error) {
      console.error('Error starting monitoring for new auction:', error);
    }
  }

  // Get monitoring status
  getMonitoringStatus() {
    return {
      activeMonitors: this.cronJobs.size,
      monitoredAuctions: Array.from(this.cronJobs.keys())
    };
  }
}

module.exports = BidTrackingService;
