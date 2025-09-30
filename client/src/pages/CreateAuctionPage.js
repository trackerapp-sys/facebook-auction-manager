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
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Facebook as FacebookIcon,
  LiveTv as LiveTvIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CreateAuctionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    startingBid: '',
    reservePrice: '',
    buyNowPrice: '',
    bidIncrement: '1.00',
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24 hours from now

    // Facebook Integration
    facebookPostUrl: '',
    facebookGroupId: '',
    auctionType: 'facebook_post', // 'facebook_post' or 'live_feed'

    // Advanced Settings
    autoExtend: true,
    extensionTime: 5,
    featured: false,

    // Images and Tags
    images: [''],
    tags: []
  });

  const [newTag, setNewTag] = useState('');

  const categories = [
    'General',
    'Electronics',
    'Collectibles',
    'Art & Antiques',
    'Jewelry & Watches',
    'Clothing & Accessories',
    'Home & Garden',
    'Sports & Recreation',
    'Books & Media',
    'Toys & Games',
    'Automotive',
    'Other'
  ];

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      endTime: newDate
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addImageField = () => {
    if (formData.images.length < 10) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, '']
      }));
    }
  };

  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: newImages.length > 0 ? newImages : ['']
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const extractFacebookPostId = (url) => {
    if (!url) return '';

    // Extract post ID from various Facebook URL formats
    const patterns = [
      /facebook\.com\/.*\/posts\/(\d+)/,
      /facebook\.com\/.*\/posts\/.*?(\d{15,})/,
      /facebook\.com\/groups\/.*\/permalink\/(\d+)/,
      /facebook\.com\/photo\.php\?fbid=(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return '';
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) errors.push('Auction title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) errors.push('Starting bid must be greater than 0');
    if (formData.reservePrice && parseFloat(formData.reservePrice) < parseFloat(formData.startingBid)) {
      errors.push('Reserve price must be greater than or equal to starting bid');
    }
    if (formData.buyNowPrice && parseFloat(formData.buyNowPrice) <= parseFloat(formData.startingBid)) {
      errors.push('Buy now price must be greater than starting bid');
    }
    if (!formData.endTime || formData.endTime <= new Date()) {
      errors.push('End time must be in the future');
    }
    if (formData.auctionType === 'facebook_post' && !formData.facebookPostUrl.trim()) {
      errors.push('Facebook post URL is required for Facebook post auctions');
    }

    return errors;
  };

  const handleSubmit = async (status = 'draft') => {
    setError('');
    setSuccess('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
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
        status: status,

        // Optional fields
        ...(formData.reservePrice && { reservePrice: parseFloat(formData.reservePrice) }),
        ...(formData.buyNowPrice && { buyNowPrice: parseFloat(formData.buyNowPrice) }),

        // Facebook integration
        ...(formData.facebookPostUrl && {
          facebookPostId: extractFacebookPostId(formData.facebookPostUrl),
          facebookPostUrl: formData.facebookPostUrl
        }),
        ...(formData.facebookGroupId && { facebookGroupId: formData.facebookGroupId }),

        // Advanced settings
        autoExtend: formData.autoExtend,
        extensionTime: parseInt(formData.extensionTime),
        featured: formData.featured,

        // Media and tags
        images: formData.images.filter(img => img.trim()),
        tags: formData.tags,

        // Auction type metadata
        auctionType: formData.auctionType
      };

      const response = await api.post('/auctions', submitData);

      if (response.data.success) {
        setSuccess(`Auction ${status === 'active' ? 'created and published' : 'saved as draft'} successfully!`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Create auction error:', err);
      setError(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => handleSubmit('draft');
  const handlePublish = () => handleSubmit('active');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create New Auction
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Set up your Facebook auction with automatic bid detection from comments
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Auction Details */}
          <Grid item xs={12} md={8}>
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
                    placeholder="e.g., Vintage Watch Collection Auction"
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
                    placeholder="Detailed description of the auction items, condition, terms, etc."
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={handleInputChange('category')}
                      label="Category"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
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

            {/* Pricing Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="primary" />
                Pricing & Bidding
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Starting Bid"
                    value={formData.startingBid}
                    onChange={handleInputChange('startingBid')}
                    type="number"
                    inputProps={{ min: 0.01, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bid Increment"
                    value={formData.bidIncrement}
                    onChange={handleInputChange('bidIncrement')}
                    type="number"
                    inputProps={{ min: 0.01, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Minimum amount between bids"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Reserve Price (Optional)"
                    value={formData.reservePrice}
                    onChange={handleInputChange('reservePrice')}
                    type="number"
                    inputProps={{ min: 0.01, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Minimum price to sell"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Buy Now Price (Optional)"
                    value={formData.buyNowPrice}
                    onChange={handleInputChange('buyNowPrice')}
                    type="number"
                    inputProps={{ min: 0.01, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Instant purchase price"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Facebook Integration Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FacebookIcon color="primary" />
                Facebook Integration - Automatic Bid Detection
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>🤖 Automatic Mode:</strong> Paste your Facebook post URL below and the system will automatically detect and process bids from comments in real-time!
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Auction Type</InputLabel>
                    <Select
                      value={formData.auctionType}
                      onChange={handleInputChange('auctionType')}
                      label="Auction Type"
                    >
                      <MenuItem value="facebook_post">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FacebookIcon fontSize="small" />
                          Facebook Post Auction
                        </Box>
                      </MenuItem>
                      <MenuItem value="live_feed">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LiveTvIcon fontSize="small" />
                          Live Feed Auction
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facebook Post URL"
                    value={formData.facebookPostUrl}
                    onChange={handleInputChange('facebookPostUrl')}
                    placeholder="https://www.facebook.com/groups/yourgroup/posts/123456789"
                    helperText="Paste the full URL of your Facebook post where bids will be collected"
                    required={formData.auctionType === 'facebook_post'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FacebookIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="The system will automatically extract the post ID and monitor comments for bids">
                            <IconButton size="small">
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facebook Group ID (Optional)"
                    value={formData.facebookGroupId}
                    onChange={handleInputChange('facebookGroupId')}
                    placeholder="123456789012345"
                    helperText="Group ID for additional validation (optional)"
                  />
                </Grid>

                {formData.facebookPostUrl && (
                  <Grid item xs={12}>
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>✅ Post ID Detected:</strong> {extractFacebookPostId(formData.facebookPostUrl) || 'Invalid URL format'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        The system will monitor this post for comments containing bid amounts and automatically process them.
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Images Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Images
              </Typography>

              {formData.images.map((image, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Image URL ${index + 1}`}
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.images.length > 1 && (
                    <IconButton
                      onClick={() => removeImageField(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}

              {formData.images.length < 10 && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={addImageField}
                  variant="outlined"
                  size="small"
                >
                  Add Image
                </Button>
              )}
            </Paper>

            {/* Tags Section */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  size="small"
                />
                <Button
                  onClick={addTag}
                  variant="outlined"
                  disabled={!newTag.trim() || formData.tags.length >= 10}
                >
                  Add
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar - Advanced Settings & Actions */}
          <Grid item xs={12} md={4}>
            {/* Advanced Settings */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Advanced Settings
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoExtend}
                      onChange={handleSwitchChange('autoExtend')}
                    />
                  }
                  label="Auto-extend auction"
                />

                {formData.autoExtend && (
                  <TextField
                    label="Extension Time (minutes)"
                    value={formData.extensionTime}
                    onChange={handleInputChange('extensionTime')}
                    type="number"
                    inputProps={{ min: 1, max: 60 }}
                    size="small"
                    helperText="Extend auction when bid placed near end"
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.featured}
                      onChange={handleSwitchChange('featured')}
                    />
                  }
                  label="Featured auction"
                />
              </Box>
            </Paper>

            {/* Automatic Bid Detection Info */}
            <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🤖 Automatic Features
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>Smart Bid Detection:</strong>
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>Detects "$25", "25 dollars", "I bid 30"</li>
                  <li>Validates bid amounts automatically</li>
                  <li>Updates current high bid in real-time</li>
                  <li>Notifies other bidders when outbid</li>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" paragraph>
                  <strong>Real-time Monitoring:</strong>
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>24/7 Facebook comment monitoring</li>
                  <li>Instant bid processing</li>
                  <li>Automatic auction timing</li>
                  <li>Winner selection when auction ends</li>
                </Box>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handlePublish}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Publishing...' : 'Publish Auction'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PreviewIcon />}
                  onClick={handleSaveDraft}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Saving...' : 'Save as Draft'}
                </Button>

                <Button
                  variant="text"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </Paper>

            {/* Help Section */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>💡 Pro Tip:</strong> Make sure your Facebook webhook is configured to enable automatic bid detection.
                Check your dashboard for webhook status.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateAuctionPage;
