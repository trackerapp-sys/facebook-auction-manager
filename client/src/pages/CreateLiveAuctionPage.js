import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  LiveTv as LiveTvIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateLiveAuctionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    startingBid: '',
    reservePrice: '',
    bidIncrement: '1.00',
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Default to 2 hours for live auctions
    autoExtend: false, // Usually disabled for live auctions
    extensionTime: 2, // Shorter extension for live
    featured: true, // Live auctions are usually featured
  });

  const categories = [
    'General', 'Electronics', 'Collectibles', 'Art & Antiques',
    'Jewelry & Watches', 'Clothing & Accessories', 'Home & Garden',
    'Sports & Recreation', 'Books & Media', 'Toys & Games', 'Automotive', 'Other'
  ];

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.checked }));
  };

  const handleDateChange = (newDate) => {
    setFormData(prev => ({ ...prev, endTime: newDate }));
  };

  const handleSubmit = async (status = 'active') => {
    setError('');
    setSuccess('');
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.startingBid) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        startingBid: parseFloat(formData.startingBid),
        bidIncrement: parseFloat(formData.bidIncrement),
        endTime: formData.endTime.toISOString(),
        autoExtend: formData.autoExtend,
        extensionTime: parseInt(formData.extensionTime),
        featured: formData.featured,
        auctionType: 'live_feed',
        status: status,
        ...(formData.reservePrice && { reservePrice: parseFloat(formData.reservePrice) }),
      };

      const response = await api.post('/auctions', submitData);
      
      if (response.data.success) {
        setSuccess('Live Auction created successfully! You can now manage bids in real-time.');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LiveTvIcon color="secondary" />
            Create Live Auction
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up a real-time live auction with manual bid management
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {/* Live Features Info */}
        <Card sx={{ mb: 3, bgcolor: 'secondary.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BoltIcon color="secondary" />
              ⚡ Live Auction Features
            </Typography>
            <Typography variant="body2" paragraph>
              Live auctions provide real-time bidding management with these features:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <li>Real-time bid updates and notifications</li>
              <li>Manual bid entry and validation</li>
              <li>Live bidder management</li>
              <li>Instant winner declaration</li>
              <li>Professional auction interface</li>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            Auction Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Auction Title"
                value={formData.title}
                onChange={handleInputChange('title')}
                placeholder="e.g., Live Estate Sale - Vintage Jewelry Collection"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={4}
                placeholder="Detailed description of items, conditions, and auction terms..."
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={formData.category} onChange={handleInputChange('category')} label="Category">
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Auction End Time"
                value={formData.endTime}
                onChange={handleDateChange}
                textField={(params) => <TextField {...params} fullWidth required />}
                minDateTime={new Date()}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon color="primary" />
            Pricing & Bidding
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Starting Bid"
                value={formData.startingBid}
                onChange={handleInputChange('startingBid')}
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bid Increment"
                value={formData.bidIncrement}
                onChange={handleInputChange('bidIncrement')}
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                helperText="Minimum increase between bids"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Reserve Price (Optional)"
                value={formData.reservePrice}
                onChange={handleInputChange('reservePrice')}
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                helperText="Minimum selling price"
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Live Auction Settings</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={formData.featured} onChange={handleSwitchChange('featured')} />}
              label="Featured auction (recommended for live auctions)"
            />
            
            <FormControlLabel
              control={<Switch checked={formData.autoExtend} onChange={handleSwitchChange('autoExtend')} />}
              label="Auto-extend auction when bids placed near end"
            />
            
            {formData.autoExtend && (
              <TextField
                label="Extension Time (minutes)"
                value={formData.extensionTime}
                onChange={handleInputChange('extensionTime')}
                type="number"
                inputProps={{ min: 1, max: 10 }}
                size="small"
                sx={{ ml: 4, maxWidth: 200 }}
                helperText="Shorter extensions for live auctions"
              />
            )}
          </Box>
        </Paper>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>💡 Live Auction Tip:</strong> Live auctions work best with shorter durations (1-3 hours) and active management. 
            You'll be able to manually enter bids and manage the auction in real-time once it's created.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/dashboard')} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSubmit('draft')}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => handleSubmit('active')}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create & Start Live Auction'}
          </Button>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateLiveAuctionPage;
