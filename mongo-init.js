// MongoDB initialization script
db = db.getSiblingDB('facebook-auction-manager');

// Create collections
db.createCollection('users');
db.createCollection('auctions');
db.createCollection('bids');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "facebookId": 1 }, { unique: true, sparse: true });
db.auctions.createIndex({ "status": 1, "endTime": 1 });
db.auctions.createIndex({ "auctioneer": 1 });
db.auctions.createIndex({ "facebookPostId": 1 }, { sparse: true });
db.bids.createIndex({ "auction": 1, "amount": -1 });
db.bids.createIndex({ "bidder": 1, "createdAt": -1 });

// Create a default admin user (optional)
db.users.insertOne({
  name: "Admin User",
  email: "admin@auctionmanager.com",
  role: "admin",
  isActive: true,
  preferences: {
    notifications: {
      email: true,
      push: true,
      bidUpdates: true,
      auctionReminders: true
    },
    timezone: "UTC"
  },
  stats: {
    totalBids: 0,
    wonAuctions: 0,
    totalSpent: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');
