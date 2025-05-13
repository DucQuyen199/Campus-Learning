import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress
} from '@mui/material';
import { Warning, Error, CheckCircle, Info } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { academicService } from '../../services/api';

// Helper function to get warning status color
const getWarningStatusColor = (status) => {
  switch (status) {
    case 'CRITICAL':
      return 'error';
    case 'WARNING':
      return 'warning';
    case 'RESOLVED':
      return 'success';
    default:
      return 'info';
  }
};

// Helper function to get warning status icon
const getWarningStatusIcon = (status) => {
  switch (status) {
    case 'CRITICAL':
      return <Error color="error" />;
    case 'WARNING':
      return <Warning color="warning" />;
    case 'RESOLVED':
      return <CheckCircle color="success" />;
    default:
      return <Info color="info" />;
  }
};

const AcademicWarning = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [metrics, setMetrics] = useState(null);
  
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
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cảnh báo học vụ
      </Typography>
      
      {/* Academic Metrics Summary */}
      <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tóm tắt thông tin học tập
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardHeader 
                title="GPA học kỳ hiện tại" 
                titleTypographyProps={{ variant: 'subtitle1' }} 
              />
              <CardContent>
                <Typography variant="h4" align="center" color="primary">
                  {metrics?.SemesterGPA?.toFixed(2) || 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(metrics?.SemesterGPA / 4) * 100 || 0} 
                      color={metrics?.SemesterGPA >= 3 ? 'success' : metrics?.SemesterGPA >= 2 ? 'warning' : 'error'}
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
            <Card variant="outlined">
              <CardHeader 
                title="GPA tích lũy" 
                titleTypographyProps={{ variant: 'subtitle1' }} 
              />
              <CardContent>
                <Typography variant="h4" align="center" color="primary">
                  {metrics?.CumulativeGPA?.toFixed(2) || 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(metrics?.CumulativeGPA / 4) * 100 || 0} 
                      color={metrics?.CumulativeGPA >= 3 ? 'success' : metrics?.CumulativeGPA >= 2 ? 'warning' : 'error'}
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
            <Card variant="outlined">
              <CardHeader 
                title="Tín chỉ đã đạt" 
                titleTypographyProps={{ variant: 'subtitle1' }} 
              />
              <CardContent>
                <Typography variant="h4" align="center" color="primary">
                  {metrics?.EarnedCredits || '0'}/{metrics?.TotalCredits || '120'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(metrics?.EarnedCredits / metrics?.TotalCredits) * 100 || 0} 
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
      </Paper>
      
      {/* Academic Warnings List */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Danh sách cảnh báo học vụ
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {warnings.length > 0 ? (
          <List>
            {warnings.map((warning, index) => (
              <ListItem key={index} divider={index < warnings.length - 1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getWarningStatusIcon(warning.Status)}
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {warning.Title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {warning.Description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        size="small" 
                        label={warning.Status} 
                        color={getWarningStatusColor(warning.Status)} 
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        size="small" 
                        label={warning.SemesterName || `Học kỳ ${warning.SemesterID}`} 
                        variant="outlined" 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ListItemText
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Ngày tạo: {new Date(warning.CreatedAt).toLocaleDateString('vi-VN')}
                          </Typography>
                          <br />
                          {warning.RequiredAction && (
                            <>
                              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                                Yêu cầu: {warning.RequiredAction}
                              </Typography>
                              <br />
                            </>
                          )}
                          {warning.Deadline && (
                            <Typography variant="body2" component="span" color="error">
                              Hạn chót: {new Date(warning.Deadline).toLocaleDateString('vi-VN')}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="success" sx={{ mt: 2 }}>
            Bạn không có cảnh báo học vụ nào.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default AcademicWarning; 