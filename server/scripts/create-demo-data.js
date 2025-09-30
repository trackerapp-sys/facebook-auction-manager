const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Auction = require('../src/models/Auction');
const Bid = require('../src/models/Bid');

const createDemoData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Auction.deleteMany({});
    await Bid.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });

    const auctioneerUser = new User({
      name: 'John Auctioneer',
      email: 'auctioneer@demo.com',
      password: 'password123',
      role: 'auctioneer',
      isActive: true
    });

    const bidder1 = new User({
      name: 'Alice Bidder',
      email: 'alice@demo.com',
      password: 'password123',
      role: 'bidder',
      isActive: true
    });

    const bidder2 = new User({
      name: 'Bob Bidder',
      email: 'bob@demo.com',
      password: 'password123',
      role: 'bidder',
      isActive: true
    });

    await Promise.all([
      adminUser.save(),
      auctioneerUser.save(),
      bidder1.save(),
      bidder2.save()
    ]);

    console.log('Created demo users');

    // Create demo auctions
    const auction1 = new Auction({
      title: 'Vintage Guitar Collection',
      description: 'Beautiful vintage acoustic guitar in excellent condition. Perfect for collectors or musicians.',
      category: 'Musical Instruments',
      startingBid: 100.00,
      currentBid: 100.00,
      bidIncrement: 10.00,
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'active',
      auctioneer: auctioneerUser._id,
      images: [
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
      ],
      featured: true
    });

    const auction2 = new Auction({
      title: 'Antique Pocket Watch',
      description: 'Rare antique pocket watch from the 1920s. Fully functional with original chain.',
      category: 'Antiques',
      startingBid: 50.00,
      currentBid: 75.00,
      bidIncrement: 5.00,
      endTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      status: 'active',
      auctioneer: auctioneerUser._id,
      images: [
        'https://images.unsplash.com/photo-1509048191080-d2e2678e67b4?w=500',
      ]
    });

    const auction3 = new Auction({
      title: 'Modern Art Painting',
      description: 'Original abstract painting by local artist. Acrylic on canvas, 24x36 inches.',
      category: 'Art',
      startingBid: 200.00,
      currentBid: 200.00,
      bidIncrement: 25.00,
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      status: 'active',
      auctioneer: auctioneerUser._id,
      images: [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500',
      ],
      featured: true
    });

    const auction4 = new Auction({
      title: 'Collectible Comic Books',
      description: 'Set of vintage comic books from the 1980s. Great condition, stored in protective sleeves.',
      category: 'Collectibles',
      startingBid: 25.00,
      currentBid: 45.00,
      bidIncrement: 5.00,
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      status: 'active',
      auctioneer: auctioneerUser._id,
      images: [
        'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500',
      ]
    });

    await Promise.all([
      auction1.save(),
      auction2.save(),
      auction3.save(),
      auction4.save()
    ]);

    console.log('Created demo auctions');

    // Create some demo bids
    const bid1 = new Bid({
      auction: auction2._id,
      bidder: bidder1._id,
      amount: 55.00,
      bidType: 'manual',
      isWinning: false
    });

    const bid2 = new Bid({
      auction: auction2._id,
      bidder: bidder2._id,
      amount: 65.00,
      bidType: 'manual',
      isWinning: false
    });

    const bid3 = new Bid({
      auction: auction2._id,
      bidder: bidder1._id,
      amount: 75.00,
      bidType: 'manual',
      isWinning: true
    });

    const bid4 = new Bid({
      auction: auction4._id,
      bidder: bidder2._id,
      amount: 30.00,
      bidType: 'manual',
      isWinning: false
    });

    const bid5 = new Bid({
      auction: auction4._id,
      bidder: bidder1._id,
      amount: 35.00,
      bidType: 'manual',
      isWinning: false
    });

    const bid6 = new Bid({
      auction: auction4._id,
      bidder: bidder2._id,
      amount: 45.00,
      bidType: 'manual',
      isWinning: true
    });

    await Promise.all([
      bid1.save(),
      bid2.save(),
      bid3.save(),
      bid4.save(),
      bid5.save(),
      bid6.save()
    ]);

    // Update auctions with bids
    auction2.bids = [bid1._id, bid2._id, bid3._id];
    auction2.totalBids = 3;
    auction2.uniqueBidders = 2;
    auction2.winner = bidder1._id;
    await auction2.save();

    auction4.bids = [bid4._id, bid5._id, bid6._id];
    auction4.totalBids = 3;
    auction4.uniqueBidders = 2;
    auction4.winner = bidder2._id;
    await auction4.save();

    console.log('Created demo bids');

    // Update user stats
    bidder1.stats.totalBids = 3;
    bidder1.stats.wonAuctions = 1;
    bidder1.stats.totalSpent = 75.00;
    await bidder1.save();

    bidder2.stats.totalBids = 3;
    bidder2.stats.wonAuctions = 1;
    bidder2.stats.totalSpent = 45.00;
    await bidder2.save();

    console.log('Updated user stats');

    console.log('\n🎉 Demo data created successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('Admin: admin@demo.com / password123');
    console.log('Auctioneer: auctioneer@demo.com / password123');
    console.log('Bidder 1: alice@demo.com / password123');
    console.log('Bidder 2: bob@demo.com / password123');
    console.log('\n🚀 You can now start the application and login with any of these accounts!');

  } catch (error) {
    console.error('Error creating demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDemoData();
