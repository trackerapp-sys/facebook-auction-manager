const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const BidService = require('../services/BidService');

const router = express.Router();

// @route   POST /api/bids
// @desc    Place a bid on an auction
// @access  Private
router.post('/', [
  authenticate,
  body('auctionId').isMongoId().withMessage('Invalid auction ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Bid amount must be at least $0.01'),
  body('facebookCommentId').optional().trim()
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

    const { auctionId, amount, facebookCommentId } = req.body;
    const bidderId = req.user.userId;

    // Use BidService to handle bid placement logic
    const result = await BidService.placeBid({
      auctionId,
      bidderId,
      amount,
      facebookCommentId,
      io: req.app.get('io') // Get socket.io instance
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to place bid' 
    });
  }
});

// @route   GET /api/bids/auction/:auctionId
// @desc    Get all bids for an auction
// @access  Public
router.get('/auction/:auctionId', [
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
    const { limit = 50, page = 1 } = req.query;

    const bids = await Bid.find({ auction: auctionId })
      .populate('bidder', 'name avatar')
      .sort({ amount: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bid.countDocuments({ auction: auctionId });

    res.json({
      success: true,
      data: {
        bids,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get auction bids error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bids' 
    });
  }
});

// @route   GET /api/bids/user/:userId
// @desc    Get all bids by a user
// @access  Private (Own bids or Admin)
router.get('/user/:userId', [
  authenticate,
  param('userId').isMongoId().withMessage('Invalid user ID')
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

    const { userId } = req.params;
    
    // Check if user can access these bids
    if (userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view these bids' 
      });
    }

    const { limit = 20, page = 1, status } = req.query;
    const query = { bidder: userId };

    // Filter by auction status if provided
    if (status) {
      const auctions = await Auction.find({ status }).select('_id');
      query.auction = { $in: auctions.map(a => a._id) };
    }

    const bids = await Bid.find(query)
      .populate('auction', 'title status endTime currentBid winner')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bid.countDocuments(query);

    res.json({
      success: true,
      data: {
        bids,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user bids' 
    });
  }
});

// @route   GET /api/bids/winning
// @desc    Get current winning bids for authenticated user
// @access  Private
router.get('/winning', authenticate, async (req, res) => {
  try {
    // Find auctions where user has the highest bid
    const winningBids = await Bid.aggregate([
      {
        $match: { bidder: req.user.userId }
      },
      {
        $lookup: {
          from: 'auctions',
          localField: 'auction',
          foreignField: '_id',
          as: 'auctionData'
        }
      },
      {
        $unwind: '$auctionData'
      },
      {
        $match: {
          'auctionData.status': 'active',
          $expr: { $eq: ['$amount', '$auctionData.currentBid'] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'bidder',
          foreignField: '_id',
          as: 'bidderData'
        }
      },
      {
        $project: {
          amount: 1,
          createdAt: 1,
          auction: {
            _id: '$auctionData._id',
            title: '$auctionData.title',
            endTime: '$auctionData.endTime',
            currentBid: '$auctionData.currentBid',
            images: '$auctionData.images'
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.json({
      success: true,
      data: { bids: winningBids }
    });

  } catch (error) {
    console.error('Get winning bids error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch winning bids' 
    });
  }
});

// @route   DELETE /api/bids/:id
// @desc    Delete a bid (Admin only, for moderation)
// @access  Private (Admin)
router.delete('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid bid ID')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bid not found' 
      });
    }

    // Remove bid from auction's bids array
    await Auction.findByIdAndUpdate(
      bid.auction,
      { $pull: { bids: bid._id } }
    );

    // Recalculate current bid for the auction
    const auction = await Auction.findById(bid.auction);
    const highestBid = await Bid.findOne({ auction: bid.auction })
      .sort({ amount: -1 });

    auction.currentBid = highestBid ? highestBid.amount : auction.startingBid;
    await auction.save();

    await Bid.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bid deleted successfully'
    });

  } catch (error) {
    console.error('Delete bid error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete bid' 
    });
  }
});

// @route   POST /api/bids/test
// @desc    Add a test bid (for testing purposes)
// @access  Public (for demo)
router.post('/test', [
  body('auctionId').isMongoId().withMessage('Invalid auction ID'),
  body('bidderName').trim().isLength({ min: 2 }).withMessage('Bidder name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Bid amount must be at least $0.01'),
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

    const { auctionId, bidderName, amount } = req.body;

    // Find or create test bidder
    const bidderEmail = `${bidderName.toLowerCase().replace(/\s+/g, '')}@test.com`;
    let bidder = await User.findOne({ email: bidderEmail });

    if (!bidder) {
      bidder = new User({
        name: bidderName,
        email: bidderEmail,
        role: 'bidder',
        password: 'testpassword123'
      });
      await bidder.save();
    }

    // Use BidService to handle bid placement logic
    const result = await BidService.placeBid({
      auctionId,
      bidderId: bidder._id,
      amount,
      bidType: 'test',
      io: req.app.get('io')
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Test bid placed successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error placing test bid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place test bid'
    });
  }
});

// @route   POST /api/bids/manual
// @desc    Manually add a bid (for manual mode or admin)
// @access  Private (Admin/Auctioneer)
router.post('/manual', [
  authenticate,
  authorize(['admin', 'auctioneer']),
  body('auctionId').isMongoId().withMessage('Invalid auction ID'),
  body('bidderEmail').isEmail().withMessage('Valid bidder email is required'),
  body('bidderName').trim().isLength({ min: 2 }).withMessage('Bidder name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Bid amount must be at least $0.01'),
  body('source').optional().isIn(['facebook', 'phone', 'email', 'in_person']).withMessage('Invalid source'),
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

    const { auctionId, bidderEmail, bidderName, amount, source = 'manual' } = req.body;

    // Find or create bidder
    let bidder = await User.findOne({ email: bidderEmail });

    if (!bidder) {
      // Create new bidder account
      bidder = new User({
        name: bidderName,
        email: bidderEmail,
        role: 'bidder',
        // Generate a temporary password for manual users
        password: Math.random().toString(36).slice(-8)
      });
      await bidder.save();
    }

    // Use BidService to handle bid placement logic
    const result = await BidService.placeBid({
      auctionId,
      bidderId: bidder._id,
      amount,
      bidType: 'manual',
      source,
      io: req.app.get('io') // Get socket.io instance
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      ...result,
      message: 'Manual bid added successfully',
      data: {
        ...result.data,
        bidder: {
          id: bidder._id,
          name: bidder.name,
          email: bidder.email
        }
      }
    });

  } catch (error) {
    console.error('Manual bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add manual bid'
    });
  }
});

// @route   GET /api/bids/pending-facebook
// @desc    Get pending Facebook comments that could be bids (for manual review)
// @access  Private (Admin/Auctioneer)
router.get('/pending-facebook', [
  authenticate,
  authorize(['admin', 'auctioneer'])
], async (req, res) => {
  try {
    // This would integrate with Facebook API to get recent comments
    // For now, return empty array as placeholder
    res.json({
      success: true,
      data: {
        pendingComments: [],
        message: 'Facebook integration disabled. Use manual bid entry instead.'
      }
    });

  } catch (error) {
    console.error('Error fetching pending Facebook bids:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bids'
    });
  }
});

module.exports = router;
