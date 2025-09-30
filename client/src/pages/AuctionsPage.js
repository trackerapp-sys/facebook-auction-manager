import React from 'react';
import { Container, Typography } from '@mui/material';

const AuctionsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        All Auctions
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Auctions page coming soon...
      </Typography>
    </Container>
  );
};

export default AuctionsPage;
