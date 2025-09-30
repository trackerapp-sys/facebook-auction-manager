import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection without authentication
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        console.log('🧹 Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // User logged out, cleanup socket
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user, token]);

  // Join auction room
  const joinAuction = (auctionId) => {
    if (socket && connected) {
      socket.emit('join-auction', auctionId);
      console.log(`🏠 Joined auction room: ${auctionId}`);
    }
  };

  // Leave auction room
  const leaveAuction = (auctionId) => {
    if (socket && connected) {
      socket.emit('leave-auction', auctionId);
      console.log(`🚪 Left auction room: ${auctionId}`);
    }
  };

  // Subscribe to auction events
  const onNewBid = (callback) => {
    if (socket) {
      socket.on('new-bid', callback);
      return () => socket.off('new-bid', callback);
    }
  };

  const onAuctionUpdate = (callback) => {
    if (socket) {
      socket.on('auction-update', callback);
      return () => socket.off('auction-update', callback);
    }
  };

  const onAuctionEnded = (callback) => {
    if (socket) {
      socket.on('auction-ended', callback);
      return () => socket.off('auction-ended', callback);
    }
  };

  const onAuctionExtended = (callback) => {
    if (socket) {
      socket.on('auction-extended', callback);
      return () => socket.off('auction-extended', callback);
    }
  };

  const onTimeWarning = (callback) => {
    if (socket) {
      socket.on('time-warning', callback);
      return () => socket.off('time-warning', callback);
    }
  };

  // Generic event subscription
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    connected,
    joinAuction,
    leaveAuction,
    onNewBid,
    onAuctionUpdate,
    onAuctionEnded,
    onAuctionExtended,
    onTimeWarning,
    on,
    off,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
