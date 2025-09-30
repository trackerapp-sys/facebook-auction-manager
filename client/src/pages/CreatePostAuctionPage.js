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
  Tooltip,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Facebook as FacebookIcon,
  Info as InfoIcon,
  AutoAwesome as AutoAwesomeIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreatePostAuctionPage = () => {
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
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    facebookPostUrl: '',
    autoExtend: true,
    extensionTime: 5,
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

  const extractFacebookPostId = (url) => {
    if (!url) return '';
    const patterns = [
      /facebook\.com\/.*\/posts\/(\d+)/,
      /facebook\.com\/.*\/posts\/.*?(\d{15,})/,
      /facebook\.com\/groups\/.*\/permalink\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return '';
  };

  const handleSubmit = async (status = 'active') => {
    setError('');
    setSuccess('');
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.startingBid || !formData.facebookPostUrl.trim()) {
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
        facebookPostId: extractFacebookPostId(formData.facebookPostUrl),
        facebookPostUrl: formData.facebookPostUrl,
        autoExtend: formData.autoExtend,
        extensionTime: parseInt(formData.extensionTime),
        auctionType: 'facebook_post',
        status: status,
        ...(formData.reservePrice && { reservePrice: parseFloat(formData.reservePrice) }),
      };

      const response = await api.post('/auctions', submitData);
      
      if (response.data.success) {
        setSuccess('Facebook Post Auction created successfully! Automatic bid detection is now active.');
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
            <FacebookIcon color="primary" />
            Create Facebook Post Auction
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up automatic bid detection from Facebook post comments
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {/* Automatic Features Info */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon color="primary" />
              🤖 Automatic Bid Detection
            </Typography>
            <Typography variant="body2" paragraph>
              This auction will automatically monitor your Facebook post for bid comments and process them in real-time:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <li>Detects bids like "$25", "I bid 30", "35.50"</li>
              <li>Validates bid amounts against auction rules</li>
              <li>Updates current high bid instantly</li>
              <li>Notifies other bidders when outbid</li>
              <li>Handles auction timing automatically</li>
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
                rows={3}
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
            Pricing
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
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FacebookIcon color="primary" />
            Facebook Integration
          </Typography>
          
          <TextField
            fullWidth
            label="Facebook Post URL"
            value={formData.facebookPostUrl}
            onChange={handleInputChange('facebookPostUrl')}
            placeholder="https://www.facebook.com/groups/yourgroup/posts/123456789"
            helperText="Paste the full URL of your Facebook post where bids will be collected"
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><FacebookIcon color="primary" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The system will automatically extract the post ID and monitor comments for bids">
                    <IconButton size="small"><InfoIcon /></IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />

          {formData.facebookPostUrl && (
            <Alert severity="success">
              <Typography variant="body2">
                <strong>✅ Post ID Detected:</strong> {extractFacebookPostId(formData.facebookPostUrl) || 'Invalid URL format'}
              </Typography>
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Advanced Settings</Typography>
          
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
              inputProps={{ min: 1, max: 60 }}
              size="small"
              sx={{ ml: 4, mt: 1 }}
            />
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/dashboard')} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => handleSubmit('active')}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create & Publish Auction'}
          </Button>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default CreatePostAuctionPage;
