/*-----------------------------------------------------------------
* File: AcademicWarning.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Paper,
  useTheme,
  useMediaQuery,
  Skeleton,
  Fade,
  Chip,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead
} from '@mui/material';
import { 
  Warning as WarningIcon, 
  Error as ErrorIcon, 
  CheckCircle as CheckCircleIcon, 
  Info as InfoIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { academicService } from '../../services/api';

// Helper function to get warning status color
const getWarningStatusColor = (status) => {
  switch (status) {
    case 'Level3':
    case 'Suspension':
    case 'CRITICAL':
      return 'error';
    case 'Level2':
    case 'Level1':
    case 'WARNING':
      return 'info'; // Changed from orange warning to blue info
    case 'Resolved':
    case 'RESOLVED':
      return 'success';
    default:
      return 'info';
  }
};

// Helper function to get warning status icon
const getWarningStatusIcon = (status) => {
  switch (status) {
    case 'Level3':
    case 'Suspension':
    case 'CRITICAL':
      return <ErrorIcon color="error" />;
    case 'Level2':
    case 'Level1':
    case 'WARNING':
      return <InfoIcon color="info" />; // Changed from orange warning to blue info
    case 'Resolved':
    case 'RESOLVED':
      return <CheckCircleIcon color="success" />;
    default:
      return <InfoIcon color="info" />;
  }
};

const AcademicWarning = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Styles matching other pages
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    titleSection: {
      marginBottom: theme.spacing(3)
    },
    tableContainer: {
      marginTop: theme.spacing(3)
    },
    chip: {
      margin: theme.spacing(0.5)
    },
    infoSection: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.default
    }
  };
  
  useEffect(() => {
    const fetchAcademicWarnings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser || !currentUser.UserID) {
          setError('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }
        
        // Fetch academic warnings
        const warningsData = await academicService.getWarnings(currentUser.UserID);
        setWarnings(Array.isArray(warningsData) ? warningsData : []);
        
        // Fetch academic metrics (GPA, credits)
        const metricsData = await academicService.getMetrics(currentUser.UserID);
        setMetrics(Array.isArray(metricsData) && metricsData.length > 0 ? metricsData[0] : null);
      } catch (err) {
        console.error('Error fetching academic warnings:', err);
        setError('Không thể tải thông tin cảnh báo học vụ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAcademicWarnings();
  }, [currentUser]);
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </div>
    );
  }
  
  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Cảnh báo học vụ
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Thông tin và tình trạng cảnh báo học tập
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>
        
        {/* Academic Metrics Summary */}
        <Box sx={styles.infoSection}>
          <Typography variant="body1" gutterBottom>
            <strong>Thông tin học tập:</strong>
          </Typography>
          <Typography variant="body2" component="ul">
            <li>GPA học kỳ hiện tại: {metrics?.SemesterGPA?.toFixed(2) || 'N/A'}</li>
            <li>GPA tích lũy: {metrics?.CumulativeGPA?.toFixed(2) || 'N/A'}</li>
            <li>Tín chỉ đã đạt: {metrics?.EarnedCredits || '0'}/{metrics?.TotalCredits || '120'}</li>
            <li>Tiến độ học tập: {Math.round((metrics?.EarnedCredits / metrics?.TotalCredits) * 100) || 0}%</li>
          </Typography>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={styles.paper} elevation={0} variant="outlined">
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'text.primary' 
                }}
              >
                <TimelineIcon color="primary" />
                GPA học kỳ hiện tại
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography 
                variant="h3" 
                align="center" 
                color="primary"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                {metrics?.SemesterGPA?.toFixed(2) || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(metrics?.SemesterGPA / 4) * 100 || 0} 
                    color={metrics?.SemesterGPA >= 3 ? 'success' : metrics?.SemesterGPA >= 2 ? 'info' : 'error'}
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.05)'
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    /4.0
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={styles.paper} elevation={0} variant="outlined">
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'text.primary' 
                }}
              >
                <SpeedIcon color="primary" />
                GPA tích lũy
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography 
                variant="h3" 
                align="center" 
                color="secondary.main"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                {metrics?.CumulativeGPA?.toFixed(2) || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(metrics?.CumulativeGPA / 4) * 100 || 0} 
                    color={metrics?.CumulativeGPA >= 3 ? 'success' : metrics?.CumulativeGPA >= 2 ? 'info' : 'error'}
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.05)'
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    /4.0
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={styles.paper} elevation={0} variant="outlined">
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'text.primary' 
                }}
              >
                <EmojiEventsIcon color="primary" />
                Tín chỉ đã đạt
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography 
                variant="h3" 
                align="center" 
                color="success.main"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                {metrics?.EarnedCredits || '0'}/{metrics?.TotalCredits || '120'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(metrics?.EarnedCredits / metrics?.TotalCredits) * 100 || 0} 
                    color="success"
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.05)'
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((metrics?.EarnedCredits / metrics?.TotalCredits) * 100) || 0}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Academic Warnings List */}
        <Paper sx={styles.paper} elevation={0} variant="outlined">
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center',
              gap: 1.5,
              color: 'text.primary' 
            }}
          >
            <AssignmentTurnedInIcon color="primary" />
            Danh sách cảnh báo học vụ
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {warnings.length > 0 ? (
            <List sx={{ 
              p: 0, 
              '& .MuiListItem-root': { 
                p: 0, 
                mb: 2,
                '&:last-child': { mb: 0 }
              } 
            }}>
              {warnings.map((warning, index) => (
                <ListItem key={index}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      width: '100%',
                      p: 2
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: getWarningStatusColor(warning.Status) + '.light',
                              mr: 1.5
                            }}
                          >
                            {getWarningStatusIcon(warning.Status)}
                          </Avatar>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600,
                              color: getWarningStatusColor(warning.Status) + '.main'
                            }}
                          >
                            {warning.WarningType || 'Cảnh báo học vụ'}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body1" sx={{ mb: 2, pl: 5 }}>
                          {warning.Reason || warning.Description || 'Không có mô tả chi tiết.'}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} sx={{ pl: 5 }}>
                          <Chip 
                            size="small" 
                            label={warning.Status} 
                            color={getWarningStatusColor(warning.Status)} 
                            sx={styles.chip}
                          />
                          <Chip 
                            size="small" 
                            label={warning.SemesterName || `Học kỳ ${warning.SemesterID}`} 
                            variant="outlined"
                            sx={styles.chip}
                          />
                          {warning.AcademicYear && (
                            <Chip 
                              size="small" 
                              label={warning.AcademicYear} 
                              variant="outlined"
                              sx={styles.chip}
                            />
                          )}
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ height: '100%' }}>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row" width="40%">Ngày tạo</TableCell>
                                <TableCell align="right">
                                  {new Date(warning.WarningDate || warning.CreatedAt).toLocaleDateString('vi-VN')}
                                </TableCell>
                              </TableRow>
                              
                              {warning.RequiredAction && (
                                <TableRow>
                                  <TableCell component="th" scope="row">Yêu cầu</TableCell>
                                  <TableCell align="right">{warning.RequiredAction}</TableCell>
                                </TableRow>
                              )}
                              
                              {warning.Deadline && (
                                <TableRow>
                                  <TableCell component="th" scope="row">Hạn chót</TableCell>
                                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>
                                    {new Date(warning.Deadline).toLocaleDateString('vi-VN')}
                                  </TableCell>
                                </TableRow>
                              )}
                              
                              {warning.CreatedByName && (
                                <TableRow>
                                  <TableCell component="th" scope="row">Cảnh báo bởi</TableCell>
                                  <TableCell align="right">{warning.CreatedByName}</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                  </Paper>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert 
              severity="success" 
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' }
              }}
            >
              Bạn không có cảnh báo học vụ nào.
            </Alert>
          )}
        </Paper>
      </Paper>
    </div>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => {
  const theme = useTheme();
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3)
    }
  };
  
  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={500} height={30} sx={{ mb: 3 }} />
        <Divider sx={{ mb: 3 }} />
        
        <Skeleton variant="rounded" height={80} sx={{ mb: 4 }} />
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={200} />
          </Grid>
        </Grid>
        
        <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} />
      </Paper>
    </div>
  );
};

export default AcademicWarning; 
