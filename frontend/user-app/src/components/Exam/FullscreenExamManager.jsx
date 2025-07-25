/*-----------------------------------------------------------------
* File: FullscreenExamManager.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Alert, AlertTitle, Typography, Modal, CircularProgress,
  Paper, Fade, Backdrop, Grow, useTheme
} from '@mui/material';
import { 
  Fullscreen, FullscreenExit, Warning as WarningIcon,
  LockOutlined as LockIcon 
} from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';

/**
 * Component to manage fullscreen mode for exams
 * 
 * @param {Object} props - Component props
 * @param {number} props.participantId - The exam participant ID
 * @param {Function} props.onCheatingDetected - Callback when cheating is detected
 * @param {React.ReactNode} props.children - Child components to render in fullscreen container
 * @returns {React.ReactElement} - The rendered component
 */
const FullscreenExamManager = ({ participantId, onCheatingDetected, children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const fullscreenRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();

  // Set up fullscreen change detector
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isDocFullscreen);
      
      if (!isDocFullscreen && isFullscreen) {
        // User exited fullscreen - this is treated as cheating
        setExitCount(prev => prev + 1);
        setShowWarning(true);
        
        // Log the fullscreen exit to the server
        logFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Set initial fullscreen state
    if (!isFullscreen && fullscreenRef.current) {
      // Try to enter fullscreen on component mount
      enterFullscreen();
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, participantId]);

  // Countdown timer for redirection
  useEffect(() => {
    let timer;
    if (cheatingDetected && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (cheatingDetected && redirectCountdown === 0) {
      // When countdown reaches 0, redirect to results
      navigate(`/exam-results/${participantId}`);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [cheatingDetected, redirectCountdown, navigate, participantId]);

  // Log fullscreen exit as cheating
  const logFullscreenExit = async () => {
    if (!participantId) return;
    
    try {
      const response = await axios.post(`/api/exams/${participantId}/fullscreen-exit`);
      
      if (response.data.cheatingDetected) {
        // Set state to show cheating detected modal
        setCheatingDetected(true);
        
        // Notify parent component about cheating detection
        if (onCheatingDetected) {
          onCheatingDetected();
        }
        
        // Start countdown for automatic redirect
        setRedirectCountdown(5);
        
        // If redirectTo is provided, use it
        if (response.data.redirectTo) {
          setTimeout(() => {
            navigate(response.data.redirectTo);
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error logging fullscreen exit:', error);
      // On error, still try to redirect to results page
      setCheatingDetected(true);
      if (onCheatingDetected) {
        onCheatingDetected();
      }
      setTimeout(() => {
        navigate(`/exam-results/${participantId}`);
      }, 5000);
    }
  };

  // Log fullscreen return
  const logFullscreenReturn = async () => {
    if (!participantId) return;
    
    try {
      await axios.post(`/api/exams/${participantId}/fullscreen-return`);
    } catch (error) {
      console.error('Error logging fullscreen return:', error);
    }
  };

  const enterFullscreen = async () => {
    try {
      if (!isFullscreen && fullscreenRef.current) {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
        logFullscreenReturn();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      alert('Unable to enter fullscreen mode. Please ensure your browser allows fullscreen and try again.');
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  // Render cheating detected modal
  if (cheatingDetected) {
    return (
      <Box 
        ref={fullscreenRef}
        sx={{
          position: 'relative',
          minHeight: '100vh',
          bgcolor: '#f8f9fa'
        }}
      >
        <Modal 
          open={true}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={true}>
            <Paper
              elevation={24}
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '90%', sm: 450 },
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: theme.shadows[24],
                p: 4,
                textAlign: 'center',
                border: '3px solid #f44336',
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '8px',
                  bgcolor: 'error.main'
                }}
              />
              
              <ErrorOutlineIcon 
                color="error" 
                sx={{ 
                  fontSize: 80, 
                  mb: 2,
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.7, transform: 'scale(0.95)' },
                    '50%': { opacity: 1, transform: 'scale(1.05)' },
                    '100%': { opacity: 0.7, transform: 'scale(0.95)' },
                  }
                }} 
              />
              
              <Typography variant="h4" component="h2" color="error" fontWeight="bold" gutterBottom>
                Gian lận phát hiện
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
                Thoát khỏi chế độ toàn màn hình không được phép trong quá trình thi.
                Bài thi của bạn đã bị kết thúc và đánh dấu là không hợp lệ.
              </Typography>
              
              <Box 
                sx={{ 
                  mt: 4, 
                  p: 2, 
                  bgcolor: 'error.light', 
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h5" sx={{ mb: 1, color: 'error.dark', fontWeight: 'bold' }}>
                  {redirectCountdown}
                </Typography>
                <Typography variant="body2" sx={{ color: 'error.dark' }}>
                  Tự động chuyển hướng sau {redirectCountdown} giây
                </Typography>
                <CircularProgress 
                  variant="determinate" 
                  value={(5 - redirectCountdown) / 5 * 100} 
                  color="error" 
                  size={40} 
                  thickness={4}
                  sx={{ mt: 2 }} 
                />
              </Box>
            </Paper>
          </Fade>
        </Modal>
        <Box 
          sx={{ 
            opacity: 0.4, 
            filter: 'blur(2px)',
            pointerEvents: 'none'
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      ref={fullscreenRef} 
      sx={{ 
        minHeight: isFullscreen ? '100vh' : 'auto',
        width: '100%',
        bgcolor: isFullscreen ? '#f8f9fa' : 'transparent',
        backgroundImage: isFullscreen ? 'linear-gradient(to bottom right, #f8f9fa, #ffffff)' : 'none',
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        padding: isFullscreen ? { xs: 2, sm: 3 } : 0,
        overflowY: 'auto'
      }}
    >
      <Grow in={showWarning && !isFullscreen}>
        <Alert 
          severity="error" 
          variant="filled"
          icon={<WarningIcon fontSize="large" />}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: 3,
            position: 'sticky',
            top: 10,
            zIndex: 100,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            Cảnh báo: Gian lận phát hiện!
          </AlertTitle>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                Bạn đã thoát khỏi chế độ toàn màn hình. Đây được coi là hành vi gian lận.
              </Typography>
              <Typography variant="body2">
                Bài thi của bạn sẽ bị đánh dấu là không hợp lệ và bạn sẽ tự động được chuyển đến trang kết quả.
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              size="large" 
              color="inherit"
              onClick={enterFullscreen}
              startIcon={<Fullscreen />}
              sx={{ 
                bgcolor: 'white', 
                color: 'error.main',
                fontWeight: 'bold',
                px: 3,
                borderRadius: 3,
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            >
              Trở lại toàn màn hình
            </Button>
          </Box>
        </Alert>
      </Grow>

      {isFullscreen && (
        <Box 
          sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundImage: 'linear-gradient(to right, #3f51b5, #2196f3)',
            zIndex: 9999
          }}
        />
      )}

      <Box 
        sx={{ 
          position: 'absolute', 
          top: 20, 
          right: 20, 
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {isFullscreen && (
          <Fade in={isFullscreen}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mr: 2, 
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                color: 'primary.main',
                py: 0.5,
                px: 1.5,
                borderRadius: 4
              }}
            >
              <LockIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight="medium">
                Chế độ bảo mật
              </Typography>
            </Box>
          </Fade>
        )}
        
        <Button
          variant={isFullscreen ? "outlined" : "contained"}
          size="medium"
          color={isFullscreen ? "error" : "primary"}
          startIcon={isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          disabled={cheatingDetected}
          sx={{ 
            borderRadius: 3,
            fontWeight: 'bold',
            boxShadow: isFullscreen ? 0 : 3
          }}
        >
          {isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        </Button>
      </Box>

      <Paper 
        elevation={isFullscreen ? 4 : 0}
        sx={{ 
          maxWidth: isFullscreen ? 1200 : '100%',
          mx: 'auto',
          my: isFullscreen ? 4 : 0,
          p: isFullscreen ? { xs: 2, sm: 3, md: 4 } : 0,
          borderRadius: isFullscreen ? 2 : 0,
          backgroundColor: isFullscreen ? 'white' : 'transparent',
          transition: 'all 0.3s ease-in-out',
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : 'auto'
        }}
      >
        {children}
      </Paper>
    </Box>
  );
};

export default FullscreenExamManager;

