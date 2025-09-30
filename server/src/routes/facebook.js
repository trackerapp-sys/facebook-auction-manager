const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const FacebookService = require('../services/FacebookService');
const BidService = require('../services/BidService');
const Auction = require('../models/Auction');

const router = express.Router();

// @route   GET /api/facebook/webhook
// @desc    Facebook webhook verification (required by Facebook)
// @access  Public (Facebook servers)
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Facebook webhook verification attempt:', { mode, token: token ? '***' : 'missing' });

  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('✅ WEBHOOK_VERIFIED - Facebook webhook is now active!');
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      console.log('❌ WEBHOOK_VERIFICATION_FAILED - Token mismatch');
      res.sendStatus(403);
    }
  } else {
    console.log('❌ WEBHOOK_VERIFICATION_FAILED - Missing parameters');
    res.sendStatus(400);
  }
});

// @route   POST /api/facebook/webhook
// @desc    Handle Facebook webhook events (AUTOMATIC BID PROCESSING)
// @access  Public (Facebook servers)
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    console.log('🔔 Facebook webhook received:', JSON.stringify(body, null, 2));
    console.log('📊 Webhook event summary:', {
      object: body.object,
      entries: body.entry?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Check if this is a page subscription
    if (body.object === 'page') {
      // Process each entry - there may be multiple if batched
      const promises = body.entry.map(async (entry) => {
        // Handle different types of changes
        if (entry.changes) {
          for (const change of entry.changes) {
            console.log('📝 Processing change:', change.field, change.value?.verb, change.value?.item);

            if (change.field === 'feed') {
              const value = change.value;

              // Handle new comments (AUTOMATIC BID DETECTION)
              if (value.verb === 'add' && value.item === 'comment') {
                console.log('💬 New comment detected - processing for bids...');
                await FacebookService.handleNewComment(value);
              }

              // Handle comment edits (updated bids)
              if (value.verb === 'edited' && value.item === 'comment') {
                console.log('✏️ Comment edited - checking for bid updates...');
                await FacebookService.handleCommentEdit(value);
              }

              // Handle comment deletions
              if (value.verb === 'remove' && value.item === 'comment') {
                console.log('🗑️ Comment deleted - handling bid removal...');
                await FacebookService.handleCommentDelete(value);
              }
            }
          }
        }
      });

      // Wait for all processing to complete
      await Promise.all(promises);

      // Return a '200 OK' response to all requests (required by Facebook)
      res.status(200).send('EVENT_RECEIVED');
      console.log('✅ Webhook processed successfully');
    } else {
      // Return a '404 Not Found' if event is not from a page subscription
      console.log('❌ Unknown webhook object:', body.object);
      res.sendStatus(404);
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still return 200 to Facebook to avoid retries
    res.status(200).send('WEBHOOK_ERROR');
  }
});

// @route   POST /api/facebook/connect-auction
// @desc    Connect an auction to a Facebook post
// @access  Private (Auctioneer/Admin)
router.post('/connect-auction', [
  authenticate,
  authorize(['auctioneer', 'admin']),
  body('auctionId').isMongoId().withMessage('Invalid auction ID'),
  body('facebookPostId').notEmpty().withMessage('Facebook post ID is required'),
  body('facebookGroupId').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { auctionId, facebookPostId, facebookGroupId } = req.body;

    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    // Check ownership or admin role
    if (auction.auctioneer.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to modify this auction' 
      });
    }

    // Verify the Facebook post exists and is accessible
    const postData = await FacebookService.getPostData(facebookPostId);
    
    if (!postData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Facebook post not found or not accessible' 
      });
    }

    // Update auction with Facebook connection
    auction.facebookPostId = facebookPostId;
    if (facebookGroupId) {
      auction.facebookGroupId = facebookGroupId;
    }
    
    await auction.save();

    // Start monitoring this post for comments
    await FacebookService.startMonitoringPost(facebookPostId, auctionId);

    res.json({
      success: true,
      message: 'Auction connected to Facebook post successfully',
      data: { 
        auction: {
          id: auction._id,
          facebookPostId: auction.facebookPostId,
          facebookGroupId: auction.facebookGroupId
        }
      }
    });

  } catch (error) {
    console.error('Connect auction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect auction to Facebook post' 
    });
  }
});

// @route   DELETE /api/facebook/disconnect-auction/:auctionId
// @desc    Disconnect an auction from Facebook monitoring
// @access  Private (Auctioneer/Admin)
router.delete('/disconnect-auction/:auctionId', [
  authenticate,
  authorize(['auctioneer', 'admin']),
  param('auctionId').isMongoId().withMessage('Invalid auction ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    // Check ownership or admin role
    if (auction.auctioneer.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to modify this auction' 
      });
    }

    // Stop monitoring the Facebook post
    if (auction.facebookPostId) {
      await FacebookService.stopMonitoringPost(auction.facebookPostId);
    }

    // Remove Facebook connection
    auction.facebookPostId = undefined;
    auction.facebookGroupId = undefined;
    
    await auction.save();

    res.json({
      success: true,
      message: 'Auction disconnected from Facebook successfully'
    });

  } catch (error) {
    console.error('Disconnect auction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to disconnect auction from Facebook' 
    });
  }
});

// @route   GET /api/facebook/post/:postId/comments
// @desc    Get comments from a Facebook post
// @access  Private (Auctioneer/Admin)
router.get('/post/:postId/comments', [
  authenticate,
  authorize(['auctioneer', 'admin']),
  param('postId').notEmpty().withMessage('Post ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { postId } = req.params;
    const { limit = 50 } = req.query;

    const comments = await FacebookService.getPostComments(postId, parseInt(limit));

    res.json({
      success: true,
      data: { comments }
    });

  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch post comments' 
    });
  }
});

// @route   POST /api/facebook/test-connection
// @desc    Test Facebook API connection
// @access  Public (for testing)
router.post('/test-connection', async (req, res) => {
  try {
    const isConnected = await FacebookService.testConnection();

    res.json({
      success: true,
      data: {
        connected: isConnected,
        message: isConnected ? 'Facebook API connection successful' : 'Facebook API connection failed',
        webhookUrl: `${process.env.CLIENT_URL?.replace('3000', '5000') || 'http://localhost:5000'}/api/facebook/webhook`,
        verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
      }
    });

  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Facebook connection'
    });
  }
});

// @route   GET /api/facebook/test-webhook
// @desc    Test webhook endpoint
// @access  Public (for testing)
router.get('/test-webhook', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
    webhookUrl: `${req.protocol}://${req.get('host')}/api/facebook/webhook`,
    verifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
  });
});

// @route   POST /api/facebook/test-comment
// @desc    Test Facebook comment processing (for development)
// @access  Public
router.post('/test-comment', async (req, res) => {
  try {
    const { auctionId, commentText, userName = 'Test User' } = req.body;

    console.log('🧪 Testing comment processing:', { auctionId, commentText, userName });

    // Parse bid amount from comment
    const bidAmount = FacebookService.parseBidAmount(commentText);

    if (!bidAmount) {
      return res.json({
        success: false,
        message: 'No valid bid amount found in comment',
        commentText,
        parsedAmount: null
      });
    }

    // Find or create test user
    const user = await FacebookService.findOrCreateUser({
      facebookId: 'test-user-123',
      name: userName
    });

    // Place the bid
    const bidResult = await BidService.placeBid({
      auctionId,
      bidderId: user._id,
      bidderName: userName,
      amount: bidAmount,
      facebookCommentId: `test-comment-${Date.now()}`,
      bidType: 'facebook'
    });

    res.json({
      success: bidResult.success,
      message: bidResult.message,
      commentText,
      parsedAmount: bidAmount,
      bidResult: bidResult.success ? bidResult.bid : null
    });

  } catch (error) {
    console.error('❌ Comment test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Comment test failed',
      error: error.message
    });
  }
});

module.exports = router;
