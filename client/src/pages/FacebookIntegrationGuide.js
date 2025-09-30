import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Link,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  AutoAwesome as AutoIcon,
  Link as LinkIcon,
  Comment as CommentIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';

const FacebookIntegrationGuide = () => {
  const steps = [
    {
      label: 'Create Your Facebook Post',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Create a post in your Facebook group or page about your auction. Include:
          </Typography>
          <ul>
            <li>Auction title and description</li>
            <li>Starting bid and increment</li>
            <li>End time</li>
            <li>Images of the items</li>
            <li>Instructions for bidding in comments</li>
          </ul>
        </Box>
      )
    },
    {
      label: 'Copy the Facebook Post URL',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            After creating your post:
          </Typography>
          <ol>
            <li>Click on the timestamp of your post</li>
            <li>Copy the full URL from your browser address bar</li>
            <li>It should look like: <code>https://www.facebook.com/groups/yourgroup/posts/123456789</code></li>
          </ol>
        </Box>
      )
    },
    {
      label: 'Create Auction with Facebook URL',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            In the auction creation form:
          </Typography>
          <ol>
            <li>Fill in all auction details</li>
            <li>In the "Facebook Integration" section, paste your Facebook post URL</li>
            <li>The system will automatically extract the post ID</li>
            <li>Save and publish your auction</li>
          </ol>
        </Box>
      )
    },
    {
      label: 'Automatic Bid Detection Begins!',
      content: (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>🎉 You're all set!</strong> The system will now automatically monitor comments on your Facebook post and detect bids in real-time.
            </Typography>
          </Alert>
          <Typography variant="body1">
            Users can now comment on your Facebook post with bids like:
          </Typography>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Chip label="$25" sx={{ mr: 1, mb: 1 }} />
            <Chip label="I bid 30 dollars" sx={{ mr: 1, mb: 1 }} />
            <Chip label="35.50" sx={{ mr: 1, mb: 1 }} />
            <Chip label="Bid: $40" sx={{ mr: 1, mb: 1 }} />
          </Box>
        </Box>
      )
    }
  ];

  const features = [
    {
      icon: <AutoIcon color="primary" />,
      title: 'Automatic Detection',
      description: 'Bids are detected and processed automatically from Facebook comments'
    },
    {
      icon: <CommentIcon color="primary" />,
      title: 'Natural Language',
      description: 'Users can bid using natural language - "$25", "I bid 30", etc.'
    },
    {
      icon: <NotificationIcon color="primary" />,
      title: 'Real-time Updates',
      description: 'Bid updates appear instantly in the auction dashboard'
    },
    {
      icon: <LinkIcon color="primary" />,
      title: 'Seamless Integration',
      description: 'Just paste your Facebook post URL and everything works automatically'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <FacebookIcon color="primary" fontSize="large" />
          Facebook Integration Guide
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Set up automatic bid detection from Facebook comments in 4 simple steps
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          <strong>🤖 Fully Automatic System:</strong> Once set up, the system monitors your Facebook post 24/7 
          and automatically processes bids from comments. No manual entry required!
        </Typography>
      </Alert>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Setup Steps
            </Typography>
            
            <Stepper orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label} active={true} completed={false}>
                  <StepLabel>
                    <Typography variant="h6">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    {step.content}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Key Features
            </Typography>
            
            {features.map((feature, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {feature.icon}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" paragraph>
              If you need assistance setting up Facebook integration, check out our detailed setup guide.
            </Typography>
            <Button 
              variant="outlined" 
              fullWidth
              component={Link}
              href="/test-facebook-comments"
              target="_blank"
            >
              Test Facebook Comments
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FacebookIntegrationGuide;
