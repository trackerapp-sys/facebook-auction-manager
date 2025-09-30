import React from 'react';
import { Container, Typography } from '@mui/material';

const ProfilePage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Profile page coming soon...
      </Typography>
    </Container>
  );
};

export default ProfilePage;
