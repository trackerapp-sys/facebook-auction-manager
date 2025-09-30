const axios = require('axios');
const Auction = require('../models/Auction');
const BidService = require('./BidService');

class FacebookService {
  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.appId = process.env.FACEBOOK_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
    this.verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
    this.integrationMode = process.env.FACEBOOK_INTEGRATION_MODE || 'auto';
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    // Store monitored posts
    this.monitoredPosts = new Map();

    if (this.integrationMode === 'auto' && (!this.appId || !this.appSecret)) {
      console.warn('Facebook credentials not configured for automatic mode');
    }

    if (this.integrationMode === 'auto') {
      console.log('🤖 Facebook Service initialized in AUTOMATIC mode - Full automation enabled!');
    } else {
      console.log('📝 Facebook Service initialized in MANUAL mode');
    }
  }

  // Check if Facebook integration is enabled
  isEnabled() {
    return this.integrationMode === 'auto' && this.appId && this.appSecret && this.accessToken;
  }

  // Verify Facebook access token
  async verifyToken(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email,picture'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Facebook token verification failed:', error.response?.data || error.message);
      return null;
    }
  }

  // Get post data
  async getPostData(postId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${postId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,message,created_time,from'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get post data:', error.response?.data || error.message);
      return null;
    }
  }

  // Get comments from a post
  async getPostComments(postId, limit = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/${postId}/comments`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,message,created_time,from',
          limit,
          order: 'chronological'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get post comments:', error.response?.data || error.message);
      return [];
    }
  }

  // Parse bid amount from comment text
  parseBidAmount(commentText) {
    if (!commentText) return null;
    
    // Common bid patterns
    const patterns = [
      /\$(\d+(?:\.\d{2})?)/,           // $50.00 or $50
      /(\d+(?:\.\d{2})?)\s*dollars?/i, // 50 dollars
      /bid\s*:?\s*\$?(\d+(?:\.\d{2})?)/i, // bid: $50 or bid 50
      /^(\d+(?:\.\d{2})?)$/,           // Just a number
      /(\d+(?:\.\d{2})?)\s*\$?$/       // 50$ or 50
    ];
    
    for (const pattern of patterns) {
      const match = commentText.trim().match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        if (amount > 0) {
          return amount;
        }
      }
    }
    
    return null;
  }

  // Handle new comment from webhook
  async handleNewComment(webhookData) {
    try {
      const { comment_id, post_id, message, from } = webhookData;
      
      // Check if this post is being monitored
      const auction = await Auction.findOne({ facebookPostId: post_id, status: 'active' });
      
      if (!auction) {
        return; // Not monitoring this post
      }
      
      // Parse bid amount from comment
      const bidAmount = this.parseBidAmount(message);
      
      if (!bidAmount) {
        return; // No valid bid found
      }
      
      // Find or create user based on Facebook ID
      const User = require('../models/User');
      let user = await User.findOne({ facebookId: from.id });
      
      if (!user) {
        // Create new user from Facebook data
        user = new User({
          facebookId: from.id,
          name: from.name,
          email: `${from.id}@facebook.temp`, // Temporary email
          role: 'bidder'
        });
        await user.save();
      }
      
      // Place the bid
      const bidResult = await BidService.placeBid({
        auctionId: auction._id,
        bidderId: user._id,
        bidderName: from.name,
        amount: bidAmount,
        facebookCommentId: comment_id,
        bidType: 'facebook'
      });
      
      if (bidResult.success) {
        console.log(`Facebook bid placed: $${bidAmount} by ${from.name} on auction ${auction.title}`);
        
        // Optionally reply to the comment to confirm bid
        await this.replyToComment(comment_id, `Bid confirmed: $${bidAmount.toFixed(2)}`);
      } else {
        console.log(`Facebook bid failed: ${bidResult.message}`);
        
        // Reply with error message
        await this.replyToComment(comment_id, `Bid failed: ${bidResult.message}`);
      }
      
    } catch (error) {
      console.error('Error handling Facebook comment:', error);
    }
  }

  // Handle comment edit
  async handleCommentEdit(webhookData) {
    try {
      const { comment_id, message } = webhookData;
      
      // Find existing bid with this comment ID
      const Bid = require('../models/Bid');
      const existingBid = await Bid.findOne({ facebookCommentId: comment_id });
      
      if (!existingBid) {
        // Treat as new comment
        return this.handleNewComment(webhookData);
      }
      
      // Parse new bid amount
      const newBidAmount = this.parseBidAmount(message);
      
      if (!newBidAmount) {
        // Invalid bid, mark as invalid
        existingBid.isValid = false;
        await existingBid.save();
        
        await this.replyToComment(comment_id, 'Bid is no longer valid due to edit.');
        return;
      }
      
      // Update bid amount if higher
      if (newBidAmount > existingBid.amount) {
        const auction = await Auction.findById(existingBid.auction);
        
        if (auction && auction.status === 'active') {
          existingBid.amount = newBidAmount;
          await existingBid.save();
          
          await this.replyToComment(comment_id, `Bid updated: $${newBidAmount.toFixed(2)}`);
        }
      }
      
    } catch (error) {
      console.error('Error handling Facebook comment edit:', error);
    }
  }

  // Reply to a comment
  async replyToComment(commentId, message) {
    try {
      await axios.post(`${this.baseUrl}/${commentId}/comments`, {
        message,
        access_token: this.accessToken
      });
    } catch (error) {
      console.error('Failed to reply to comment:', error.response?.data || error.message);
    }
  }

  // Start monitoring a post for comments
  async startMonitoringPost(postId, auctionId) {
    this.monitoredPosts.set(postId, auctionId);
    console.log(`Started monitoring Facebook post ${postId} for auction ${auctionId}`);
  }

  // Stop monitoring a post
  async stopMonitoringPost(postId) {
    this.monitoredPosts.delete(postId);
    console.log(`Stopped monitoring Facebook post ${postId}`);
  }

  /**
   * Get comment details from Facebook Graph API
   */
  async getCommentDetails(commentId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${commentId}`, {
        params: {
          fields: 'id,message,from{id,name},created_time',
          access_token: this.accessToken
        }
      });

      console.log('📝 Facebook comment details:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get comment details:', error);
      return null;
    }
  }

  /**
   * Find or create user from Facebook data
   */
  async findOrCreateUser({ facebookId, name, email = null }) {
    try {
      const User = require('../models/User');

      // Try to find existing user by Facebook ID
      let user = await User.findOne({ facebookId });

      if (!user) {
        // Create new user
        user = new User({
          facebookId,
          name,
          email: email || `${facebookId}@facebook.user`,
          role: 'bidder'
        });

        await user.save();
        console.log(`👤 Created new user from Facebook: ${name} (${facebookId})`);
      }

      return user;
    } catch (error) {
      console.error('❌ Failed to find or create user:', error);
      throw error;
    }
  }

  // Test Facebook API connection
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          access_token: this.accessToken
        }
      });
      
      return !!response.data.id;
    } catch (error) {
      console.error('Facebook connection test failed:', error.response?.data || error.message);
      return false;
    }
  }

  // Get app access token
  async getAppAccessToken() {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          grant_type: 'client_credentials'
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to get app access token:', error.response?.data || error.message);
      return null;
    }
  }

  // Subscribe to webhook
  async subscribeToWebhook(pageId) {
    try {
      const appAccessToken = await this.getAppAccessToken();
      
      const response = await axios.post(`${this.baseUrl}/${pageId}/subscribed_apps`, {
        access_token: appAccessToken,
        subscribed_fields: 'feed'
      });
      
      return response.data.success;
    } catch (error) {
      console.error('Failed to subscribe to webhook:', error.response?.data || error.message);
      return false;
    }
  }
}

module.exports = new FacebookService();
