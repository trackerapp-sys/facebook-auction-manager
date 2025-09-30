import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Grid
} from '@mui/material';
import FacebookComments from '../components/auctions/FacebookComments';

const FacebookCommentsTestPage = () => {
  const [testAuctionId, setTestAuctionId] = useState('test-auction-123');
  const [testUrl, setTestUrl] = useState('');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🧪 Facebook Comments Plugin Test
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This page demonstrates the Facebook Comments Plugin integration for automatic bid detection.
            Comments made here will be processed for bid amounts and automatically added to the auction system.
          </Typography>
        </Alert>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Test Auction ID"
              value={testAuctionId}
              onChange={(e) => setTestAuctionId(e.target.value)}
              helperText="ID of the auction to test bidding on"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Custom URL (optional)"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              helperText="Custom URL for comments (defaults to current page)"
            />
          </Grid>
        </Grid>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>How to test:</strong>
            <br />1. Make sure you have an active auction in the system
            <br />2. Enter the auction ID above
            <br />3. Comment below with bid amounts like "$25", "30 dollars", "35.50"
            <br />4. Watch the server logs for bid processing
            <br />5. Check the auction page to see if bids were added
          </Typography>
        </Alert>
      </Paper>

      {/* Facebook Comments Component */}
      <FacebookComments 
        auctionId={testAuctionId} 
        url={testUrl || undefined}
      />

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          📋 Testing Instructions
        </Typography>
        
        <Typography variant="body2" component="div" sx={{ mb: 2 }}>
          <strong>Valid bid formats to test:</strong>
          <ul>
            <li>"$25" - Simple dollar amount</li>
            <li>"30 dollars" - Written amount</li>
            <li>"35.50" - Decimal amount</li>
            <li>"Bid: $40" - Bid with prefix</li>
            <li>"I bid 45.75" - Natural language</li>
          </ul>
        </Typography>

        <Typography variant="body2" component="div">
          <strong>What happens when you comment:</strong>
          <ul>
            <li>Facebook sends the comment event to our system</li>
            <li>Our server processes the comment for bid amounts</li>
            <li>If a valid bid is found, it's automatically added to the auction</li>
            <li>Real-time updates are sent to all connected clients</li>
            <li>The bidder's Facebook name is captured automatically</li>
          </ul>
        </Typography>
      </Paper>
    </Container>
  );
};

export default FacebookCommentsTestPage;
