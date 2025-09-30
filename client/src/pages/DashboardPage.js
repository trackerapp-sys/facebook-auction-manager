import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Gavel,
  AttachMoney,
  People,
  Add,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auctionsAPI, bidsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuctionTable from '../components/auctions/AuctionTable';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalRevenue: 0,
  });
  const [recentAuctions, setRecentAuctions] = useState([]);
  const [winningBids, setWinningBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user's auctions if auctioneer/admin
        if (user.role === 'auctioneer' || user.role === 'admin') {
          const auctionsResponse = await auctionsAPI.getAuctions({
            auctioneer: user.id,
            limit: 5,
          });
          setRecentAuctions(auctionsResponse.data.data.auctions || []);
          
          // Calculate stats
          const allAuctions = auctionsResponse.data.data.auctions || [];
          setStats({
            totalAuctions: allAuctions.length,
            activeAuctions: allAuctions.filter(a => a.status === 'active').length,
            totalBids: allAuctions.reduce((sum, a) => sum + a.totalBids, 0),
            totalRevenue: allAuctions
              .filter(a => a.status === 'ended' && a.winner)
              .reduce((sum, a) => sum + a.currentBid, 0),
          });
        }
        
        // Try to fetch winning bids for all users (skip if authentication fails)
        try {
          const winningBidsResponse = await bidsAPI.getWinningBids();
          setWinningBids(winningBidsResponse.data.data.bids || []);
        } catch (error) {
          console.warn('Could not fetch winning bids (authentication required):', error.response?.data?.message);
          setWinningBids([]);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your auctions today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      {(user.role === 'auctioneer' || user.role === 'admin') && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Auctions"
              value={stats.totalAuctions}
              icon={<Gavel />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Auctions"
              value={stats.activeAuctions}
              icon={<TrendingUp />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Bids"
              value={stats.totalBids}
              icon={<People />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Revenue"
              value={`$${stats.totalRevenue.toFixed(2)}`}
              icon={<AttachMoney />}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* Auction Management Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AuctionTable
            auctions={recentAuctions}
            loading={loading}
            onRefresh={() => {
              setLoading(true);
              // Refetch data
              const fetchData = async () => {
                try {
                  const auctionsResponse = await auctionsAPI.getAuctions({
                    limit: 50,
                    sort: '-createdAt'
                  });
                  setRecentAuctions(auctionsResponse.data.auctions || []);
                } catch (error) {
                  console.error('Error fetching auctions:', error);
                } finally {
                  setLoading(false);
                }
              };
              fetchData();
            }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/create-post-auction')}
                  sx={{ minWidth: 200 }}
                >
                  Create Facebook Post Auction
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/create-live-auction')}
                  sx={{ minWidth: 200 }}
                >
                  Create Live Auction
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status & Settings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Facebook Integration</Typography>
                  <Chip label="Active" color="success" size="small" />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Webhook Status</Typography>
                  <Chip label="Connected" color="success" size="small" />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Auto Bid Detection</Typography>
                  <Chip label="Enabled" color="primary" size="small" />
                </Box>

                <Divider />

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/settings/facebook')}
                  fullWidth
                >
                  Configure Settings
                </Button>

                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/help')}
                  fullWidth
                >
                  View Documentation
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Container>
  );
};

export default DashboardPage;
