const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const User = require('../models/User');
const NotificationService = require('./NotificationService');

class BidService {
  // Place a bid on an auction
  async placeBid({ auctionId, bidderId, bidderName = null, amount, facebookCommentId = null, bidType = 'manual', io = null }) {
    try {
      // Validate auction
      const auction = await Auction.findById(auctionId);
      
      if (!auction) {
        return {
          success: false,
          message: 'Auction not found'
        };
      }
      
      if (auction.status !== 'active') {
        return {
          success: false,
          message: 'Auction is not active'
        };
      }
      
      if (new Date() > auction.endTime) {
        return {
          success: false,
          message: 'Auction has ended'
        };
      }
      
      // Validate bidder
      const bidder = await User.findById(bidderId);
      
      if (!bidder) {
        return {
          success: false,
          message: 'Bidder not found'
        };
      }
      
      if (!bidder.isActive) {
        return {
          success: false,
          message: 'Bidder account is inactive'
        };
      }
      

      
      // Validate bid amount
      const minimumBid = auction.currentBid + auction.bidIncrement;
      
      if (amount < minimumBid) {
        return {
          success: false,
          message: `Minimum bid is $${minimumBid.toFixed(2)}`
        };
      }
      
      // Check for buy now price
      if (auction.buyNowPrice && amount >= auction.buyNowPrice) {
        return await this.processBuyNow(auction, bidder, amount, io);
      }
      
      // Check for duplicate Facebook comment bid
      if (facebookCommentId) {
        const existingBid = await Bid.findOne({ facebookCommentId });
        if (existingBid) {
          return {
            success: false,
            message: 'Bid already placed for this comment'
          };
        }
      }
      
      // Create the bid
      const bid = new Bid({
        auction: auctionId,
        bidder: bidderId,
        bidderName: bidderName || bidder.name,
        amount,
        facebookCommentId,
        bidType
      });
      
      await bid.save();
      
      // Update auction
      auction.currentBid = amount;
      auction.winner = bidderId;
      
      if (!auction.bids.includes(bid._id)) {
        auction.bids.push(bid._id);
        auction.totalBids = auction.bids.length;
      }
      
      // Update unique bidders count
      const uniqueBidders = await Bid.distinct('bidder', { auction: auctionId });
      auction.uniqueBidders = uniqueBidders.length;
      
      // Auto-extend auction if enabled and bid placed near end
      const timeRemaining = auction.endTime - new Date();
      if (auction.autoExtend && timeRemaining < (auction.extensionTime * 60 * 1000)) {
        const oldEndTime = auction.endTime;
        auction.extendTime();
        
        // Notify about extension
        if (io) {
          io.to(`auction-${auctionId}`).emit('auction-extended', {
            auctionId,
            oldEndTime,
            newEndTime: auction.endTime,
            extensionMinutes: auction.extensionTime
          });
        }
      }
      
      await auction.save();
      
      // Update bid winning status
      await Bid.updateMany(
        { auction: auctionId },
        { isWinning: false }
      );
      
      await Bid.findByIdAndUpdate(bid._id, { isWinning: true });
      
      // Update user stats
      await bidder.incrementBidCount();
      
      // Populate bid data for response
      await bid.populate('bidder', 'name avatar');
      await bid.populate('auction', 'title currentBid endTime');
      
      // Send real-time updates
      if (io) {
        io.to(`auction-${auctionId}`).emit('new-bid', {
          bid: bid.toJSON(),
          auction: {
            id: auction._id,
            currentBid: auction.currentBid,
            totalBids: auction.totalBids,
            uniqueBidders: auction.uniqueBidders,
            endTime: auction.endTime
          }
        });
      }
      
      // Send notifications
      await this.sendBidNotifications(auction, bid, bidder);
      
      return {
        success: true,
        message: 'Bid placed successfully',
        data: {
          bid: bid.toJSON(),
          auction: {
            id: auction._id,
            currentBid: auction.currentBid,
            totalBids: auction.totalBids,
            endTime: auction.endTime
          }
        }
      };
      
    } catch (error) {
      console.error('Error placing bid:', error);
      return {
        success: false,
        message: error.message || 'Failed to place bid'
      };
    }
  }
  
  // Process buy now purchase
  async processBuyNow(auction, bidder, amount, io) {
    try {
      // Create winning bid
      const bid = new Bid({
        auction: auction._id,
        bidder: bidder._id,
        amount,
        bidType: 'buy_now',
        isWinning: true
      });
      
      await bid.save();
      
      // End auction immediately
      auction.status = 'ended';
      auction.currentBid = amount;
      auction.winner = bidder._id;
      auction.bids.push(bid._id);
      auction.totalBids = auction.bids.length;
      
      await auction.save();
      
      // Update user stats
      await bidder.updateWonAuction(amount);
      
      // Send real-time updates
      if (io) {
        io.to(`auction-${auction._id}`).emit('auction-ended', {
          auctionId: auction._id,
          winner: {
            id: bidder._id,
            name: bidder.name,
            avatar: bidder.avatar
          },
          finalBid: amount,
          endReason: 'buy_now'
        });
      }
      
      // Send notifications
      await NotificationService.sendAuctionEndedNotification(auction, bidder, amount);
      
      return {
        success: true,
        message: 'Buy now purchase successful',
        data: {
          bid: bid.toJSON(),
          auction: {
            id: auction._id,
            status: 'ended',
            winner: bidder._id,
            finalBid: amount
          }
        }
      };
      
    } catch (error) {
      console.error('Error processing buy now:', error);
      return {
        success: false,
        message: 'Failed to process buy now purchase'
      };
    }
  }
  
  // Send bid notifications
  async sendBidNotifications(auction, bid, bidder) {
    try {
      // Notify previous high bidder they've been outbid
      const previousHighBid = await Bid.findOne({
        auction: auction._id,
        _id: { $ne: bid._id }
      })
      .sort({ amount: -1 })
      .populate('bidder');
      
      if (previousHighBid && previousHighBid.bidder) {
        await NotificationService.sendOutbidNotification(
          previousHighBid.bidder,
          auction,
          bid.amount
        );
      }
      
      // Notify auctioneer of new bid
      await NotificationService.sendNewBidNotification(
        auction.auctioneer,
        auction,
        bidder,
        bid.amount
      );
      
      // Notify other interested bidders
      const otherBidders = await Bid.distinct('bidder', {
        auction: auction._id,
        bidder: { $nin: [bidder._id, auction.auctioneer] }
      });
      
      for (const bidderId of otherBidders) {
        const otherBidder = await User.findById(bidderId);
        if (otherBidder && otherBidder.preferences.notifications.bidUpdates) {
          await NotificationService.sendBidUpdateNotification(
            otherBidder,
            auction,
            bid.amount
          );
        }
      }
      
    } catch (error) {
      console.error('Error sending bid notifications:', error);
    }
  }
  
  // Get bid statistics for auction
  async getBidStatistics(auctionId) {
    try {
      const stats = await Bid.aggregate([
        { $match: { auction: auctionId } },
        {
          $group: {
            _id: null,
            totalBids: { $sum: 1 },
            averageBid: { $avg: '$amount' },
            highestBid: { $max: '$amount' },
            lowestBid: { $min: '$amount' },
            uniqueBidders: { $addToSet: '$bidder' }
          }
        },
        {
          $project: {
            totalBids: 1,
            averageBid: { $round: ['$averageBid', 2] },
            highestBid: 1,
            lowestBid: 1,
            uniqueBidders: { $size: '$uniqueBidders' }
          }
        }
      ]);
      
      return stats[0] || {
        totalBids: 0,
        averageBid: 0,
        highestBid: 0,
        lowestBid: 0,
        uniqueBidders: 0
      };
      
    } catch (error) {
      console.error('Error getting bid statistics:', error);
      return null;
    }
  }
}

module.exports = new BidService();
