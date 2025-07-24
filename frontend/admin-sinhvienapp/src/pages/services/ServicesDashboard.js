/*-----------------------------------------------------------------
* File: ServicesDashboard.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PendingActions,
  Assignment,
  CheckCircle,
  Cancel,
  ReceiptLong,
  HourglassTop,
  Visibility,
  BarChart,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { studentServicesApi } from '../../services/api';
import PageContainer from '../../components/layout/PageContainer';

// Custom progress indicator component
const StatusProgressCard = ({ title, value, total, icon, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h3" component="div" sx={{ mb: 1, fontWeight: 'medium' }}>
          {value}
        </Typography>
        
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {percentage}% trong tổng số yêu cầu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {value}/{total}
          </Typography>
        </Box>
        
        <Box sx={{ width: '100%', mt: 1, bgcolor: 'background.paper', borderRadius: 1, height: 8 }}>
          <Box
            sx={{
              width: `${percentage}%`,
              bgcolor: `${color}.main`,
              height: '100%',
              borderRadius: 1,
              transition: 'width 1s ease-in-out',
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const ServicesDashboard = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch service statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const response = await studentServicesApi.getServicesStatistics();
        setStatistics(response);
      } catch (error) {
        console.error('Error fetching service statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Processing': return 'info';
      case 'Completed': return 'success';
      case 'Rejected': return 'error';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  // Get status label in Vietnamese
  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ xử lý';
      case 'Processing': return 'Đang xử lý';
      case 'Completed': return 'Hoàn thành';
      case 'Rejected': return 'Từ chối';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Calculate total requests
  const getTotalRequests = () => {
    if (!statistics || !statistics.statusCounts) return 0;
    return statistics.statusCounts.reduce((acc, curr) => acc + curr.Count, 0);
  };

  // Get count for a specific status
  const getStatusCount = (status) => {
    if (!statistics || !statistics.statusCounts) return 0;
    const statusItem = statistics.statusCounts.find(item => item.Status === status);
    return statusItem ? statusItem.Count : 0;
  };

  if (loading) {
    return <PageContainer title="Thống kê dịch vụ sinh viên">
    <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress />
    </Box>
  </PageContainer>;
  }

  return (
    <PageContainer title="Thống kê dịch vụ sinh viên">
      <Box mb={4}>
        <Grid container spacing={3} alignItems="stretch">
          {/* Header with action buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h1">
                Thống kê dịch vụ sinh viên
              </Typography>
              <Box>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/services/requests')}
                  sx={{ mr: 1 }}
                >
                  Quản lý yêu cầu
                </Button>
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/services')}
                >
                  Danh sách dịch vụ
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Status cards */}
          <Grid item xs={12} md={3}>
            <StatusProgressCard
              title="Chờ xử lý"
              value={getStatusCount('Pending')}
              total={getTotalRequests()}
              icon={<PendingActions />}
              color="warning"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatusProgressCard
              title="Đang xử lý"
              value={getStatusCount('Processing')}
              total={getTotalRequests()}
              icon={<HourglassTop />}
              color="info"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatusProgressCard
              title="Hoàn thành"
              value={getStatusCount('Completed')}
              total={getTotalRequests()}
              icon={<CheckCircle />}
              color="success"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <StatusProgressCard
              title="Từ chối/Hủy"
              value={getStatusCount('Rejected') + getStatusCount('Cancelled')}
              total={getTotalRequests()}
              icon={<Cancel />}
              color="error"
            />
          </Grid>

          {/* Popular services */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Dịch vụ được yêu cầu nhiều nhất"
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <IconButton size="small" onClick={() => navigate('/services')}>
                    <BarChart />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {statistics && statistics.topServices && statistics.topServices.length > 0 ? (
                    statistics.topServices.map((service, index) => (
                      <ListItem key={service.ServiceID} divider={index < statistics.topServices.length - 1}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: index < 3 ? 'primary.main' : 'action.disabledBackground' }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={service.ServiceName}
                          secondary={`${service.RequestCount} yêu cầu`}
                        />
                        <Chip
                          icon={<TrendingUp />}
                          label={`${Math.round((service.RequestCount / getTotalRequests()) * 100)}%`}
                          size="small"
                          color={index < 3 ? 'primary' : 'default'}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Không có dữ liệu" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent requests */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Yêu cầu dịch vụ gần đây"
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <IconButton size="small" onClick={() => navigate('/services/requests')}>
                    <Assignment />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {statistics && statistics.recentRequests && statistics.recentRequests.length > 0 ? (
                    statistics.recentRequests.map((request, index) => (
                      <ListItem key={request.RegistrationID} 
                        divider={index < statistics.recentRequests.length - 1}
                        secondaryAction={
                          <Tooltip title="Xem chi tiết">
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => navigate(`/services/requests/${request.RegistrationID}`)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <ListItemIcon>
                          <ReceiptLong color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          disableTypography
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                                {request.ServiceName}
                              </Typography>
                              <Chip
                                label={getStatusLabel(request.Status)}
                                color={getStatusColor(request.Status)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box display="flex" flexDirection="column">
                              <Typography variant="caption" component="span">
                                {request.StudentName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" component="span">
                                {formatDate(request.RequestDate)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Không có yêu cầu gần đây" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default ServicesDashboard; 
