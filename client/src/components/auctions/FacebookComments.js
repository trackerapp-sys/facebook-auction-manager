import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Alert, Button, TextField } from '@mui/material';
import { useSocket } from '../../contexts/SocketContext';

const FacebookComments = ({ auctionId, url }) => {
  const commentsRef = useRef(null);
  const [fbLoaded, setFbLoaded] = useState(false);
  const [commentsUrl, setCommentsUrl] = useState('');
  const socket = useSocket();

  useEffect(() => {
    // Set the comments URL - use current page URL or provided URL
    if (auctionId) {
      const finalUrl = url || `${window.location.origin}/auctions/${auctionId}`;
      setCommentsUrl(finalUrl);
    }

    // Load Facebook SDK
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.REACT_APP_FACEBOOK_APP_ID || '1347679723547415',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        
        setFbLoaded(true);
        
        // Subscribe to comment events for automatic bid detection
        window.FB.Event.subscribe('comment.create', function(response) {
          console.log('💬 New Facebook comment detected:', response);
          
          // Extract comment data
          const commentData = {
            commentId: response.commentID,
            href: response.href,
            parentCommentID: response.parentCommentID || null
          };
          
          // Send to server for bid processing
          if (socket) {
            socket.emit('facebook_comment', {
              auctionId,
              ...commentData
            });
          }
        });
      };

      // Load the SDK asynchronously
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    } else {
      setFbLoaded(true);
      // FB is already loaded, parse the comments
      window.FB.XFBML.parse(commentsRef.current);
    }
  }, [auctionId, url, socket]);

  const refreshComments = () => {
    if (window.FB && commentsRef.current) {
      window.FB.XFBML.parse(commentsRef.current);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          💬 Place Your Bids in Comments
        </Typography>
        <Button onClick={refreshComments} size="small" variant="outlined">
          Refresh Comments
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>How to bid:</strong> Comment with your bid amount (e.g., "$25", "30 dollars", "35.50") and it will be automatically detected and added to the auction!
        </Typography>
      </Alert>

      <TextField
        fullWidth
        size="small"
        label="Comments URL"
        value={commentsUrl}
        onChange={(e) => setCommentsUrl(e.target.value)}
        sx={{ mb: 2 }}
        helperText="URL for Facebook comments (defaults to current page)"
      />
      
      {!fbLoaded && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Loading Facebook Comments...
        </Alert>
      )}
      
      <Box ref={commentsRef}>
        <div 
          className="fb-comments" 
          data-href={commentsUrl}
          data-width="100%" 
          data-numposts="15"
          data-order-by="reverse_time"
          data-colorscheme="light"
        />
      </Box>
    </Paper>
  );
};

export default FacebookComments;
