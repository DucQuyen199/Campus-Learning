import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { handleSocketGracefully } from '../utils/errorHandling';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_RETRY_ATTEMPTS = 3;

  useEffect(() => {
    // Get user from local storage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Initialize socket connection with reconnection options
        const socketInstance = io(API_URL.replace('/api', ''), {
          auth: { token },
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: MAX_RETRY_ATTEMPTS,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true
        });

        // Apply error handling to socket instance
        handleSocketGracefully(socketInstance, (error) => {
          console.warn('Socket error handled silently', error.message);
          // Don't increment connection attempts on common errors
          if (!error.message.includes('ECONNREFUSED') && 
              !error.message.includes('xhr poll error')) {
            setConnectionAttempts(prev => prev + 1);
          }
        });

        // Socket event handlers
        socketInstance.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
          setConnectionAttempts(0); // Reset counter on successful connection
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socketInstance.on('getUsers', (users) => {
          setOnlineUsers(users);
        });

        socketInstance.on('connect_error', (error) => {
          // Log only in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Socket connection error:', error.message);
          }
          setIsConnected(false);
          
          // Don't increment connection attempts on common errors
          if (!error.message.includes('ECONNREFUSED') && 
              !error.message.includes('xhr poll error') &&
              !error.message.includes('WebSocket is closed')) {
            setConnectionAttempts(prev => prev + 1);
          }
          
          // If WebSocket fails, try polling
          if (error.message.includes('WebSocket is closed') && socketInstance.io.opts.transports.includes('polling')) {
            console.log('WebSocket connection failed, falling back to polling');
            socketInstance.io.opts.transports = ['polling'];
            socketInstance.connect();
          }
        });

        // Store socket instance
        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
          if (socketInstance) {
            try {
              socketInstance.disconnect();
            } catch (error) {
              // Silently handle disconnect errors
            }
          }
        };
      } catch (error) {
        // Log only in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error setting up socket:', error.message);
        }
      }
    }
  }, []);

  // Reconnect socket when token changes
  useEffect(() => {
    if (socket) {
      // Return early if already connected or max attempts reached
      if (isConnected || connectionAttempts >= MAX_RETRY_ATTEMPTS) return;

      const token = localStorage.getItem('token');
      if (token) {
        try {
          socket.auth = { token };
          socket.connect();
        } catch (error) {
          // Silently handle reconnection errors
        }
      }
    }
  }, [socket, isConnected, connectionAttempts]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        user,
        onlineUsers,
        isConnected
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 