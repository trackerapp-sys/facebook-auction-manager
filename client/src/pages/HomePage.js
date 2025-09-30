import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Gavel,
  TrendingUp,
  Security,
  Speed,
  AccountCircle,
  Login,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auctionsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchFeaturedAuctions = async () => {
      try {
        const response = await auctionsAPI.getAuctions({
          status: 'active',
          featured: true,
          limit: 6,
        });
        setFeaturedAuctions(response.data.data.auctions || []);
      } catch (error) {
        console.error('Error fetching featured auctions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedAuctions();
  }, []);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  const features = [
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Real-time Tracking',
      description: 'Monitor Facebook group comments and automatically track bids in real-time.',
    },
    {
      icon: <Gavel sx={{ fontSize: 40 }} />,
      title: 'Professional Auctions',
      description: 'Create and manage professional auctions with advanced features and analytics.',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure & Reliable',
      description: 'Built with enterprise-grade security and reliability for peace of mind.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and reporting to track your auction performance.',
    },
  ];

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Auction Manager
          </Typography>
          
          {user ? (
            <>
              <Button color="inherit" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <IconButton
                color="inherit"
                onClick={handleProfileMenuOpen}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="primary"
              variant="contained"
              startIcon={<Login />}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 12,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 3 }}
          >
            Professional Facebook Auction Management
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Automate your Facebook group auctions with real-time bid tracking,
            professional management tools, and comprehensive analytics.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              onClick={() => navigate('/auctions')}
            >
              View Auctions
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
        >
          Why Choose Our Platform?
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 2,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Auctions Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 'bold' }}
          >
            Featured Auctions
          </Typography>
          
          {loading ? (
            <LoadingSpinner message="Loading featured auctions..." />
          ) : featuredAuctions.length > 0 ? (
            <Grid container spacing={3}>
              {featuredAuctions.map((auction) => (
                <Grid item xs={12} sm={6} md={4} key={auction._id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(`/auctions/${auction._id}`)}
                  >
                    {auction.images?.[0] && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={auction.images[0]}
                        alt={auction.title}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h6" gutterBottom noWrap>
                        {auction.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {auction.description.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          ${auction.currentBid.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${auction.totalBids} bids`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography textAlign="center" color="text.secondary">
              No featured auctions available at the moment.
            </Typography>
          )}
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/auctions')}
            >
              View All Auctions
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography textAlign="center" variant="body2">
            © 2024 Auction Manager. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
