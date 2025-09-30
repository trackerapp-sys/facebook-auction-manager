import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Science as TestIcon
} from '@mui/icons-material';
import FacebookComments from '../components/auctions/FacebookComments';

const OpalTradingPostTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);

  // Load auctions on component mount
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        const response = await fetch('/api/auctions?limit=10&sort=-createdAt');
        const data = await response.json();
        if (data.success) {
          const facebookAuctions = data.data.auctions.filter(auction =>
            auction.facebookPostUrl && auction.facebookPostUrl.includes('opaltradingpost')
          );
          setAuctions(facebookAuctions);
          if (facebookAuctions.length > 0) {
            setSelectedAuction(facebookAuctions[0]);
          }
        }
      } catch (error) {
        console.error('Error loading auctions:', error);
      }
    };
    loadAuctions();
  }, []);

  const runBidTest = async (bidText, userName) => {
    if (!selectedAuction) {
      alert('Please select an auction first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/facebook/test-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auctionId: selectedAuction._id,
          commentText: bidText,
          userName: userName,
          facebookPostUrl: selectedAuction.facebookPostUrl
        }),
      });

      const result = await response.json();
      
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        bidText,
        userName,
        parsedAmount: result.parsedAmount,
        success: result.success,
        message: result.message
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        bidText,
        userName,
        error: error.message,
        success: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testBids = [
    { text: "$50", user: "Test User 1" },
    { text: "I bid 75 dollars", user: "Test User 2" },
    { text: "100", user: "Test User 3" },
    { text: "Bid: $125", user: "Test User 4" }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <FacebookIcon color="primary" fontSize="large" />
          Opal Trading Post - Facebook Integration Test
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Testing automatic bid detection for your Facebook post
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Select Auction to Test
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Choose Auction</InputLabel>
              <Select
                value={selectedAuction?._id || ''}
                label="Choose Auction"
                onChange={(e) => {
                  const auction = auctions.find(a => a._id === e.target.value);
                  setSelectedAuction(auction);
                }}
              >
                {auctions.map((auction) => (
                  <MenuItem key={auction._id} value={auction._id}>
                    {auction.title} - {auction.facebookPostUrl ? auction.facebookPostUrl.split('/').pop() : 'No URL'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedAuction && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Selected Auction:</strong> {selectedAuction.title}<br />
                    <strong>Post URL:</strong><br />
                    <a href={selectedAuction.facebookPostUrl} target="_blank" rel="noopener noreferrer">
                      {selectedAuction.facebookPostUrl}
                    </a>
                  </Typography>
                </Alert>

                <Typography variant="body1" paragraph>
                  <strong>Post ID:</strong> {selectedAuction.facebookPostId}<br />
                  <strong>Group:</strong> opaltradingpost<br />
                  <strong>Auction ID:</strong> {selectedAuction._id}<br />
                  <strong>Current Bid:</strong> ${selectedAuction.currentBid || selectedAuction.startingBid}
                </Typography>
              </>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Test Bid Detection
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {testBids.map((bid, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={() => runBidTest(bid.text, bid.user)}
                  disabled={loading}
                  fullWidth
                >
                  Test: "{bid.text}" by {bid.user}
                </Button>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            
            {testResults.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tests run yet. Click a test button above to start.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {testResults.map((result, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {result.timestamp}
                        </Typography>
                        <Chip 
                          label={result.success ? 'SUCCESS' : 'FAILED'} 
                          color={result.success ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                      
                      <Typography variant="body1">
                        <strong>Bid:</strong> "{result.bidText}" by {result.userName}
                      </Typography>
                      
                      {result.parsedAmount && (
                        <Typography variant="body2" color="success.main">
                          <strong>Parsed Amount:</strong> ${result.parsedAmount}
                        </Typography>
                      )}
                      
                      {result.message && (
                        <Typography variant="body2" color={result.success ? 'text.secondary' : 'error.main'}>
                          <strong>Message:</strong> {result.message}
                        </Typography>
                      )}
                      
                      {result.error && (
                        <Typography variant="body2" color="error.main">
                          <strong>Error:</strong> {result.error}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Facebook Comments Plugin
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> The Facebook Comments Plugin below is configured to monitor your specific Facebook post. 
                Any comments made on the actual Facebook post should be detected here.
              </Typography>
            </Alert>

            {selectedAuction ? (
              <FacebookComments
                auctionId={selectedAuction._id}
                url={selectedAuction.facebookPostUrl}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Please select an auction to view Facebook comments.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OpalTradingPostTest;
