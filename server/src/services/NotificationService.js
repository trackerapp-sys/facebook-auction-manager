class NotificationService {
  constructor() {
    this.notifications = new Map(); // In-memory storage for demo
  }

  // Send new bid notification to auctioneer
  async sendNewBidNotification(auctioneer, auction, bidder, amount) {
    try {
      const notification = {
        id: this.generateId(),
        type: 'new_bid',
        recipient: auctioneer._id || auctioneer,
        title: 'New Bid Received',
        message: `${bidder.name} placed a bid of $${amount.toFixed(2)} on "${auction.title}"`,
        data: {
          auctionId: auction._id,
          bidderId: bidder._id,
          amount,
          auctionTitle: auction.title
        },
        read: false,
        createdAt: new Date()
      };

      await this.storeNotification(notification);
      
      // In a real app, you would send email/push notifications here
      console.log(`📧 New bid notification sent to ${auctioneer.name || auctioneer}`);
      
      return notification;
    } catch (error) {
      console.error('Error sending new bid notification:', error);
    }
  }

  // Send outbid notification
  async sendOutbidNotification(bidder, auction, newBidAmount) {
    try {
      const notification = {
        id: this.generateId(),
        type: 'outbid',
        recipient: bidder._id,
        title: 'You\'ve Been Outbid',
        message: `Someone placed a higher bid of $${newBidAmount.toFixed(2)} on "${auction.title}"`,
        data: {
          auctionId: auction._id,
          newBidAmount,
          auctionTitle: auction.title
        },
        read: false,
        createdAt: new Date()
      };

      await this.storeNotification(notification);
      
      console.log(`📧 Outbid notification sent to ${bidder.name}`);
      
      return notification;
    } catch (error) {
      console.error('Error sending outbid notification:', error);
    }
  }

  // Send bid update notification
  async sendBidUpdateNotification(bidder, auction, newBidAmount) {
    try {
      const notification = {
        id: this.generateId(),
        type: 'bid_update',
        recipient: bidder._id,
        title: 'Auction Update',
        message: `New bid of $${newBidAmount.toFixed(2)} placed on "${auction.title}"`,
        data: {
          auctionId: auction._id,
          newBidAmount,
          auctionTitle: auction.title
        },
        read: false,
        createdAt: new Date()
      };

      await this.storeNotification(notification);
      
      return notification;
    } catch (error) {
      console.error('Error sending bid update notification:', error);
    }
  }

  // Send winner notification
  async sendWinnerNotification(winner, auction, finalAmount) {
    try {
      const notification = {
        id: this.generateId(),
        type: 'auction_won',
        recipient: winner._id,
        title: 'Congratulations! You Won!',
        message: `You won "${auction.title}" with a bid of $${finalAmount.toFixed(2)}`,
        data: {
          auctionId: auction._id,
          finalAmount,
          auctionTitle: auction.title
        },
        read: false,
        createdAt: new Date()
      };

      await this.storeNotification(notification);
      
      console.log(`🎉 Winner notification sent to ${winner.name}`);
      
      return notification;
    } catch (error) {
      console.error('Error sending winner notification:', error);
    }
  }

  // Send auction ended notification
  async sendAuctionEndedNotification(recipient, auction, winner, finalAmount, isWinner = null) {
    try {
      let title, message;
      
      if (isWinner === true) {
        title = 'Congratulations! You Won!';
        message = `You won "${auction.title}" with a bid of $${finalAmount.toFixed(2)}`;
      } else if (isWinner === false) {
        title = 'Auction Ended';
        message = winner 
          ? `"${auction.title}" ended. Winner: ${winner.name} with $${finalAmount.toFixed(2)}`
          : `"${auction.title}" ended with no winner`;
      } else {
        // For auctioneer
        title = 'Your Auction Ended';
        message = winner 
          ? `"${auction.title}" sold to ${winner.name} for $${finalAmount.toFixed(2)}`
          : `"${auction.title}" ended with no bids`;
      }

      const notification = {
        id: this.generateId(),
        type: 'auction_ended',
        recipient: recipient._id || recipient,
        title,
        message,
        data: {
          auctionId: auction._id,
          winnerId: winner?._id,
          winnerName: winner?.name,
          finalAmount,
          auctionTitle: auction.title
        },
        read: false,
        createdAt: new Date()
      };

      await this.storeNotification(notification);
      
      console.log(`📧 Auction ended notification sent to ${recipient.name || recipient}`);
      
      return notification;
    } catch (error) {
      console.error('Error sending auction ended notification:', error);
    }
  }

  // Send time warning notification
  async sendTimeWarningNotification(auction, minutesRemaining) {
    try {
      // Get all users who have bid on this auction
      const Bid = require('../models/Bid');
      const User = require('../models/User');
      
      const bidders = await Bid.distinct('bidder', { auction: auction._id });
      
      for (const bidderId of bidders) {
        const bidder = await User.findById(bidderId);
        
        if (bidder && bidder.preferences.notifications.auctionReminders) {
          const notification = {
            id: this.generateId(),
            type: 'time_warning',
            recipient: bidderId,
            title: 'Auction Ending Soon',
            message: `"${auction.title}" ends in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`,
            data: {
              auctionId: auction._id,
              minutesRemaining,
              auctionTitle: auction.title
            },
            read: false,
            createdAt: new Date()
          };

          await this.storeNotification(notification);
        }
      }
      
      console.log(`⏰ Time warning notifications sent for auction: ${auction.title}`);
      
    } catch (error) {
      console.error('Error sending time warning notifications:', error);
    }
  }

  // Store notification (in a real app, this would be in database)
  async storeNotification(notification) {
    const userNotifications = this.notifications.get(notification.recipient) || [];
    userNotifications.push(notification);
    this.notifications.set(notification.recipient, userNotifications);
  }

  // Get notifications for a user
  async getUserNotifications(userId, limit = 50, unreadOnly = false) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      
      let filtered = userNotifications;
      
      if (unreadOnly) {
        filtered = userNotifications.filter(n => !n.read);
      }
      
      // Sort by creation date (newest first) and limit
      return filtered
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(userId, notificationId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const notification = userNotifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        notification.readAt = new Date();
      }
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      
      userNotifications.forEach(notification => {
        notification.read = true;
        notification.readAt = new Date();
      });
      
      return userNotifications.length;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      return userNotifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear old notifications (cleanup)
  async clearOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let totalCleared = 0;
      
      for (const [userId, notifications] of this.notifications.entries()) {
        const filtered = notifications.filter(n => n.createdAt > cutoffDate);
        const cleared = notifications.length - filtered.length;
        
        if (cleared > 0) {
          this.notifications.set(userId, filtered);
          totalCleared += cleared;
        }
      }
      
      console.log(`🧹 Cleared ${totalCleared} old notifications`);
      return totalCleared;
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      return 0;
    }
  }
}

module.exports = new NotificationService();
