import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuctionsPage from './pages/AuctionsPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import CreatePostAuctionPage from './pages/CreatePostAuctionPage';
import CreateLiveAuctionPage from './pages/CreateLiveAuctionPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import FacebookCommentsTestPage from './pages/FacebookCommentsTestPage';
import FacebookIntegrationGuide from './pages/FacebookIntegrationGuide';
import OpalTradingPostTest from './pages/OpalTradingPostTest';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {user && (
        <>
          <Navbar onMenuClick={handleSidebarToggle} />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: user ? 8 : 0, // Add top padding when navbar is present
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          
          {/* Public Home Page */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auctions/:id" element={<AuctionDetailPage />} />
          {/* Redirect singular /auction/:id to plural /auctions/:id */}
          <Route path="/auction/:id" element={<AuctionDetailPage />} />
          <Route path="/test-facebook-comments" element={<FacebookCommentsTestPage />} />
          <Route path="/facebook-guide" element={<FacebookIntegrationGuide />} />
          <Route path="/opal-test" element={<OpalTradingPostTest />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-auction"
            element={
              <ProtectedRoute>
                <CreateAuctionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-post-auction"
            element={
              <ProtectedRoute>
                <CreatePostAuctionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-live-auction"
            element={
              <ProtectedRoute>
                <CreateLiveAuctionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
