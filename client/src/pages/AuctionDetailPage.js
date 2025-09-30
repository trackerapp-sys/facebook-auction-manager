import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { AccessTime, AttachMoney, Person, Category } from '@mui/icons-material';
import FacebookComments from '../components/auctions/FacebookComments';
import { useSocket } from '../contexts/SocketContext';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    fetchAuction();
    fetchBids();
  }, [id]);

  useEffect(() => {
    if (socket) {
      // Listen for new bids on this auction
      socket.on('new_bid', (bidData) => {
        if (bidData.auction === id) {
          setBids(prev => [bidData, ...prev]);
          // Update current bid in auction
          setAuction(prev => ({
            ...prev,
            currentBid: bidData.amount,
            bidCount: prev.bidCount + 1
          }));
        }
      });

      return () => {
        socket.off('new_bid');
      };
    }
  }, [socket, id]);

  const fetchAuction = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auctions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAuction(data.data.auction || data.data);
      } else {
        setError('Auction not found');
      }
    } catch (err) {
      setError('Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/bids/auction/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBids(Array.isArray(data.data) ? data.data : []);
      } else {
        setBids([]);
      }
    } catch (err) {
      console.error('Failed to load bids:', err);
      setBids([]);
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'ended': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !auction) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Auction not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Auction Details */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {auction.title}
              </Typography>
              <Chip
                label={auction.status ? auction.status.toUpperCase() : 'UNKNOWN'}
                color={getStatusColor(auction.status)}
                size="small"
              />
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {auction.description}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Bid
                    </Typography>
                    <Typography variant="h6">
                      ${auction.currentBid?.toFixed(2) || auction.startingBid?.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Time Left
                    </Typography>
                    <Typography variant="h6">
                      {formatTimeRemaining(auction.endTime)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Bids
                    </Typography>
                    <Typography variant="h6">
                      {auction.bidCount || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Category color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="h6">
                      {auction.category}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {auction.facebookPostUrl ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>🤖 Automatic Bid Detection Active!</strong> Comments on the linked Facebook post are monitored for bids.
                  Comment with amounts like "$25", "I bid 30", or "35.50" and they'll be processed instantly!
                  <br />
                  <strong>Facebook Post:</strong>{' '}
                  <a href={auction.facebookPostUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                    View Original Post →
                  </a>
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>⚠️ No Facebook Post Linked:</strong> To enable automatic bid detection,
                  this auction needs to be linked to a Facebook post. Contact the auctioneer to add the Facebook post URL.
                </Typography>
              </Alert>
            )}
          </Paper>

          {/* Facebook Comments for Bidding */}
          {auction && (
            <FacebookComments
              auctionId={auction._id}
              url={auction.facebookPostUrl || `http://localhost:3000/auctions/${auction._id}`}
            />
          )}
        </Grid>

        {/* Bid History */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🏆 Bid History
            </Typography>

            {!Array.isArray(bids) || bids.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No bids yet. Be the first to bid!
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {bids.map((bid, index) => (
                  <Card key={bid._id} variant="outlined" sx={{ mb: 1, bgcolor: index === 0 ? 'success.light' : 'background.paper' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" color={index === 0 ? 'success.dark' : 'text.primary'}>
                            ${bid.amount.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bid.bidderName || 'Anonymous'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(bid.createdAt).toLocaleString()}
                          </Typography>
                          {bid.bidType === 'facebook' && (
                            <Chip label="FB" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AuctionDetailPage;
