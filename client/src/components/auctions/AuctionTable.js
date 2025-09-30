import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Chip,
  IconButton,
  Box,
  Tooltip,
  Avatar,
  LinearProgress,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Facebook as FacebookIcon,
  LiveTv as LiveTvIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';

const AuctionTable = ({ auctions, loading, onRefresh }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAuction, setSelectedAuction] = useState(null);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuOpen = (event, auction) => {
    setAnchorEl(event.currentTarget);
    setSelectedAuction(auction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAuction(null);
  };

  const handleViewAuction = () => {
    if (selectedAuction) {
      navigate(`/auctions/${selectedAuction._id}`);
    }
    handleMenuClose();
  };

  const handleEditAuction = () => {
    if (selectedAuction) {
      navigate(`/auctions/${selectedAuction._id}/edit`);
    }
    handleMenuClose();
  };

  const sortedAuctions = React.useMemo(() => {
    if (!auctions) return [];
    
    return [...auctions].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      
      // Handle different data types
      if (orderBy === 'endTime' || orderBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [auctions, order, orderBy]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'default';
      case 'ended': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const remaining = end - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getProgressPercentage = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const total = end - start;
    const elapsed = now - start;
    
    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;
    
    return Math.round((elapsed / total) * 100);
  };

  const headCells = [
    { id: 'title', label: 'Auction Title', sortable: true },
    { id: 'auctionType', label: 'Type', sortable: true },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'currentBid', label: 'Current Bid', sortable: true },
    { id: 'totalBids', label: 'Bids', sortable: true },
    { id: 'endTime', label: 'Time Remaining', sortable: true },
    { id: 'createdAt', label: 'Created', sortable: true },
    { id: 'actions', label: 'Actions', sortable: false },
  ];

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading auctions...
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  if (!auctions || auctions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No auctions found
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create your first auction to get started with automatic bid detection!
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/create-post-auction')}
          sx={{ mr: 2 }}
        >
          Create Facebook Post Auction
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/create-live-auction')}
        >
          Create Live Auction
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Auction Summary ({auctions.length})
        </Typography>
        <Button onClick={onRefresh} size="small">
          Refresh
        </Button>
      </Box>
      
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ fontWeight: 'bold' }}
                >
                  {headCell.sortable ? (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAuctions.map((auction) => (
              <TableRow
                key={auction._id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/auctions/${auction._id}`)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {auction.auctionType === 'facebook_post' ? <FacebookIcon fontSize="small" /> : <LiveTvIcon fontSize="small" />}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {auction.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {auction.category}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    icon={auction.auctionType === 'facebook_post' ? <FacebookIcon /> : <LiveTvIcon />}
                    label={auction.auctionType === 'facebook_post' ? 'Post' : 'Live'}
                    size="small"
                    color={auction.auctionType === 'facebook_post' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={auction.status.toUpperCase()}
                    size="small"
                    color={getStatusColor(auction.status)}
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MoneyIcon fontSize="small" color="success" />
                    <Typography variant="body2" fontWeight="medium">
                      ${auction.currentBid?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  {auction.reservePrice && (
                    <Typography variant="caption" color="text.secondary">
                      Reserve: ${auction.reservePrice.toFixed(2)}
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon fontSize="small" color="info" />
                    <Typography variant="body2">
                      {auction.totalBids || 0}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {auction.uniqueBidders || 0} bidders
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {getTimeRemaining(auction.endTime)}
                    </Typography>
                    {auction.status === 'active' && (
                      <LinearProgress
                        variant="determinate"
                        value={getProgressPercentage(auction.createdAt, auction.endTime)}
                        sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                      />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {formatDistanceToNow(new Date(auction.createdAt), { addSuffix: true })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(auction.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, auction);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewAuction}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditAuction}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Auction</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default AuctionTable;
