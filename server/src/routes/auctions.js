const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, param } = require('express-validator');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { authenticate, authorize } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');

const router = express.Router();

// @route   GET /api/auctions
// @desc    Get all auctions with pagination and filtering
// @access  Public
router.get('/', paginate, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const query = {};

    // Build query filters
    if (status && ['draft', 'active', 'ended', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    if (category) {
      query.category = new RegExp(category, 'i');
    }
    
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const auctions = await Auction.find(query)
      .populate('auctioneer', 'name avatar')
      .populate('winner', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(req.pagination.limit)
      .skip(req.pagination.skip);

    const total = await Auction.countDocuments(query);

    res.json({
      success: true,
      data: {
        auctions,
        pagination: {
          ...req.pagination,
          total,
          pages: Math.ceil(total / req.pagination.limit)
        }
      }
    });

  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch auctions' 
    });
  }
});

// @route   GET /api/auctions/:id
// @desc    Get single auction with bids
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid auction ID')
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

    const auction = await Auction.findById(req.params.id)
      .populate('auctioneer', 'name avatar role')
      .populate('winner', 'name avatar')
      .populate({
        path: 'bids',
        populate: {
          path: 'bidder',
          select: 'name avatar'
        },
        options: { sort: { amount: -1 } }
      });

    if (!auction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    res.json({
      success: true,
      data: { auction }
    });

  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch auction' 
    });
  }
});

// @route   POST /api/auctions
// @desc    Create new auction
// @access  Public (No authentication required for auction managers)
router.post('/', [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('startingBid').isFloat({ min: 0.01 }).withMessage('Starting bid must be at least $0.01'),
  body('bidIncrement').isFloat({ min: 0.01 }).withMessage('Bid increment must be at least $0.01'),
  body('endTime').isISO8601().withMessage('End time must be a valid date'),
  body('category').optional().trim().isLength({ max: 50 }),
  body('images').optional().isArray({ max: 10 }).withMessage('Maximum 10 images allowed'),
  body('facebookPostId').optional().trim(),
  body('facebookPostUrl').optional().trim(),
  body('facebookGroupId').optional().trim(),
  body('reservePrice').optional().isFloat({ min: 0.01 }).withMessage('Reserve price must be at least $0.01'),
  body('buyNowPrice').optional().isFloat({ min: 0.01 }).withMessage('Buy now price must be at least $0.01'),
  body('autoExtend').optional().isBoolean(),
  body('extensionTime').optional().isInt({ min: 1, max: 60 }).withMessage('Extension time must be 1-60 minutes'),
  body('featured').optional().isBoolean(),
  body('tags').optional().isArray({ max: 10 }).withMessage('Maximum 10 tags allowed'),
  body('auctionType').optional().isIn(['facebook_post', 'live_feed']).withMessage('Invalid auction type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Auction validation failed:', errors.array());
      console.log('📝 Request body:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      startingBid,
      bidIncrement,
      endTime,
      category,
      images,
      facebookPostId,
      facebookPostUrl,
      facebookGroupId,
      reservePrice,
      buyNowPrice,
      autoExtend,
      extensionTime,
      featured,
      tags,
      auctionType,
      status
    } = req.body;

    // Validate end time is in the future
    if (new Date(endTime) <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be in the future' 
      });
    }

    // Create a default auctioneer ID for auction managers (no authentication required)
    const defaultAuctioneerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    const auction = new Auction({
      title,
      description,
      startingBid,
      bidIncrement,
      currentBid: startingBid,
      endTime: new Date(endTime),
      category,
      images: images || [],
      auctioneer: defaultAuctioneerId,
      facebookPostId,
      facebookPostUrl,
      facebookGroupId,
      reservePrice: reservePrice || null,
      buyNowPrice: buyNowPrice || null,
      autoExtend: autoExtend !== undefined ? autoExtend : true,
      extensionTime: extensionTime || 5,
      featured: featured || false,
      tags: tags || [],
      auctionType: auctionType || 'facebook_post',
      status: status || 'draft'
    });

    await auction.save();

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: { auction }
    });

  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create auction' 
    });
  }
});

// @route   PUT /api/auctions/:id
// @desc    Update auction
// @access  Private (Owner/Admin)
router.put('/:id', [
  authenticate,
  param('id').isMongoId().withMessage('Invalid auction ID'),
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('category').optional().trim().isLength({ max: 50 }),
  body('images').optional().isArray({ max: 10 })
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

    const auction = await Auction.findById(req.params.id);

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
        message: 'Not authorized to update this auction' 
      });
    }

    // Don't allow updates if auction has bids and is active
    if (auction.status === 'active' && auction.bids.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot update auction with existing bids' 
      });
    }

    const { title, description, category, images } = req.body;
    
    if (title) auction.title = title;
    if (description) auction.description = description;
    if (category) auction.category = category;
    if (images) auction.images = images;

    await auction.save();
    await auction.populate('auctioneer', 'name avatar');

    res.json({
      success: true,
      message: 'Auction updated successfully',
      data: { auction }
    });

  } catch (error) {
    console.error('Update auction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update auction' 
    });
  }
});

// @route   PUT /api/auctions/:id/facebook
// @desc    Update auction Facebook post URL (simplified endpoint)
// @access  Public (for testing)
router.put('/:id/facebook', async (req, res) => {
  try {
    const { facebookPostUrl } = req.body;

    if (!facebookPostUrl) {
      return res.status(400).json({ message: 'Facebook post URL is required' });
    }

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Extract Facebook post ID from URL
    const postIdMatch = facebookPostUrl.match(/permalink\/(\d+)/);
    if (!postIdMatch) {
      return res.status(400).json({ message: 'Invalid Facebook post URL format' });
    }

    const facebookPostId = postIdMatch[1];

    // Update auction with Facebook details
    auction.facebookPostUrl = facebookPostUrl;
    auction.facebookPostId = facebookPostId;

    await auction.save();

    console.log(`🔗 Auction "${auction.title}" linked to Facebook post: ${facebookPostId}`);

    res.json({
      success: true,
      message: 'Facebook post URL updated successfully',
      auction: {
        id: auction._id,
        title: auction.title,
        facebookPostUrl: auction.facebookPostUrl,
        facebookPostId: auction.facebookPostId
      }
    });
  } catch (error) {
    console.error('Error updating auction Facebook URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
