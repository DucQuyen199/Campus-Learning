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
  Tooltip
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
      <Box sx={{ mt: 4, maxWidth: '100%', px: { xs: 2, sm: 4 } }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2, 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      mt: 2, 
      px: { xs: 1, sm: 2, md: 3 },
      maxWidth: '100%',
      animation: 'fadeIn 0.6s ease-out',
      '@keyframes fadeIn': {
        '0%': { opacity: 0, transform: 'translateY(20px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' }
      }
    }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'primary.main',
          textAlign: { xs: 'center', md: 'left' },
          mb: 3,
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: { xs: '50%', md: 0 },
            transform: { xs: 'translateX(-50%)', md: 'translateX(0)' },
            width: { xs: '80px', md: '120px' },
            height: '4px',
            background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            borderRadius: 2
          }
        }}
      >
        Cảnh báo học vụ
      </Typography>
      
      {/* Academic Metrics Summary */}
      <Fade in timeout={800}>
        <Card 
          elevation={3} 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(192, 192, 192, 0.2)',
          }}
        >
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <SchoolIcon sx={{ fontSize: 30 }} />
            <Typography variant="h5" fontWeight="600">
              Tóm tắt thông tin học tập
            </Typography>
          </Box>
          <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    } 
                  }}
                >
                  <CardHeader 
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <TimelineIcon />
                      </Avatar>
                    }
                    title="GPA học kỳ hiện tại" 
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} 
                    sx={{ pb: 1 }}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography 
                      variant="h3" 
                      align="center" 
                      color="primary"
                      sx={{ fontWeight: 700, mb: 1 }}
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
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    } 
                  }}
                >
                  <CardHeader 
                    avatar={
                      <Avatar sx={{ bgcolor: 'secondary.light' }}>
                        <SpeedIcon />
                      </Avatar>
                    }
                    title="GPA tích lũy" 
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} 
                    sx={{ pb: 1 }}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography 
                      variant="h3" 
                      align="center" 
                      color="secondary.main"
                      sx={{ fontWeight: 700, mb: 1 }}
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
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': { 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    } 
                  }}
                >
                  <CardHeader 
                    avatar={
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <EmojiEventsIcon />
                      </Avatar>
                    }
                    title="Tín chỉ đã đạt" 
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }} 
                    sx={{ pb: 1 }}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Typography 
                      variant="h3" 
                      align="center" 
                      color="success.main"
                      sx={{ fontWeight: 700, mb: 1 }}
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
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>
      
      {/* Academic Warnings List */}
      <Fade in timeout={1000}>
        <Card 
          elevation={3} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(192, 192, 192, 0.2)',
          }}
        >
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <AssignmentTurnedInIcon sx={{ fontSize: 30 }} />
            <Typography variant="h5" fontWeight="600">
              Danh sách cảnh báo học vụ
            </Typography>
          </Box>
          
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        width: '100%',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': { 
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        } 
                      }}
                    >
                      <CardContent>
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
                                sx={{ fontWeight: 500 }}
                              />
                              <Chip 
                                size="small" 
                                label={warning.SemesterName || `Học kỳ ${warning.SemesterID}`} 
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                              {warning.AcademicYear && (
                                <Chip 
                                  size="small" 
                                  label={warning.AcademicYear} 
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              )}
                            </Stack>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box sx={{ 
                              p: 2, 
                              bgcolor: 'rgba(0,0,0,0.02)', 
                              borderRadius: 1,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Ngày tạo:</strong> {new Date(warning.WarningDate || warning.CreatedAt).toLocaleDateString('vi-VN')}
                              </Typography>
                              
                              {warning.RequiredAction && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    mb: 1,
                                    p: 1,
                                    bgcolor: 'info.light',
                                    color: 'info.contrastText',
                                    borderRadius: 1,
                                    fontWeight: 500
                                  }}
                                >
                                  <strong>Yêu cầu:</strong> {warning.RequiredAction}
                                </Typography>
                              )}
                              
                              {warning.Deadline && (
                                <Typography 
                                  variant="body2" 
                                  color="error" 
                                  sx={{ 
                                    fontWeight: 500
                                  }}
                                >
                                  <strong>Hạn chót:</strong> {new Date(warning.Deadline).toLocaleDateString('vi-VN')}
                                </Typography>
                              )}
                              
                              {warning.CreatedByName && (
                                <Typography variant="body2" sx={{ mt: 'auto', fontSize: '0.8rem', color: 'text.secondary' }}>
                                  Cảnh báo bởi: {warning.CreatedByName}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
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
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => {
  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2, md: 3 }, maxWidth: '100%' }}>
      <Skeleton variant="text" width={300} height={60} sx={{ mb: 3 }} />
      
      <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
      
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
      
      <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={120} />
    </Box>
  );
};

export default AcademicWarning; 