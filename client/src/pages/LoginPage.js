import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  TextField,
  Tab,
  Tabs,
  Link,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Email as EmailIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage = () => {
  const { loginWithFacebook, loginWithEmail, register, loading, error, clearError } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    clearError();
    setFormData({ name: '', email: '', password: '' });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    clearError();

    try {
      const result = await loginWithEmail(formData.email, formData.password);

      if (!result.success) {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Email login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    clearError();

    try {
      const result = await register(formData.name, formData.email, formData.password);

      if (!result.success) {
        console.error('Registration failed:', result.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoggingIn(true);
    clearError();

    try {
      // In a real app, you would use Facebook SDK
      // For demo purposes, we'll simulate getting a Facebook access token
      const mockAccessToken = 'mock_facebook_access_token_' + Date.now();

      const result = await loginWithFacebook(mockAccessToken);

      if (!result.success) {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Facebook login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            padding: 4,
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Auction Manager
          </Typography>
          
          <Typography
            variant="h6"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 4 }}
          >
            Professional Facebook Group Auction Management
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Card sx={{ mb: 3, textAlign: 'left' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Features
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Real-time bid tracking and management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Professional auction dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Manual and automated bid entry
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Mobile-responsive design
              </Typography>
            </CardContent>
          </Card>

          {/* Login/Register Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Sign In" />
              <Tab label="Register" />
            </Tabs>
          </Box>

          {/* Login Form */}
          {tabValue === 0 && (
            <Box component="form" onSubmit={handleEmailLogin} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<EmailIcon />}
                disabled={isLoggingIn}
                fullWidth
                sx={{ mb: 2 }}
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          )}

          {/* Register Form */}
          {tabValue === 1 && (
            <Box component="form" onSubmit={handleRegister} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                helperText="Minimum 6 characters"
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<PersonAddIcon />}
                disabled={isLoggingIn}
                fullWidth
                sx={{ mb: 2 }}
              >
                {isLoggingIn ? 'Creating account...' : 'Create Account'}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Or continue with Facebook
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            size="large"
            startIcon={<FacebookIcon />}
            onClick={handleFacebookLogin}
            disabled={isLoggingIn}
            sx={{
              borderColor: '#1877f2',
              color: '#1877f2',
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#166fe5',
                backgroundColor: 'rgba(24, 119, 242, 0.04)',
              },
              '&:disabled': {
                borderColor: '#ccc',
                color: '#ccc',
              },
            }}
            fullWidth
          >
            {isLoggingIn ? 'Connecting...' : 'Continue with Facebook'}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Note:</strong> Facebook integration requires business verification.
            Use email/password for immediate access.
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3, display: 'block' }}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Paper>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
            Need help? Contact support at support@auctionmanager.com
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
