/*-----------------------------------------------------------------
* File: RequestDetail.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  Divider,
  Grid,
  CircularProgress,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  AlertTitle,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  Person,
  Email,
  Phone,
  Receipt,
  PlaylistAddCheck,
  AccessTime,
  AttachMoney,
  Business,
  CheckCircle,
  Cancel,
  ReceiptLong
} from '@mui/icons-material';
import { format } from 'date-fns';
import { studentServicesApi } from '../../services/api';
import PageContainer from '../../components/layout/PageContainer';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [comments, setComments] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch request details
  useEffect(() => {
    const fetchRequestDetails = async () => {
      setLoading(true);
      try {
        const response = await studentServicesApi.getRequestById(id);
        setRequest(response);
        setStatus(response.Status);
        setComments(response.Comments || '');
      } catch (error) {
        console.error('Error fetching request details:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải thông tin yêu cầu dịch vụ',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
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

  // Handle status update
  const handleUpdateStatus = async () => {
    try {
      await studentServicesApi.updateRequestStatus(id, {
        status,
        comments
      });
      
      // Update request object with new status
      setRequest({
        ...request,
        Status: status,
        Comments: comments,
        ProcessedAt: new Date().toISOString()
      });
      
      setSnackbar({
        open: true,
        message: 'Cập nhật trạng thái yêu cầu thành công',
        severity: 'success'
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating request status:', error);
      setSnackbar({
        open: true,
        message: 'Không thể cập nhật trạng thái yêu cầu',
        severity: 'error'
      });
    }
  };

  // Handle dialog open and close
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer title="Chi tiết yêu cầu dịch vụ">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  // Error state
  if (!request) {
    return (
      <PageContainer title="Chi tiết yêu cầu dịch vụ">
        <Box mb={4}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/services/requests')}
            sx={{ mb: 2 }}
          >
            Quay lại danh sách
          </Button>
          <Alert severity="error">
            <AlertTitle>Lỗi</AlertTitle>
            Không tìm thấy thông tin yêu cầu dịch vụ
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Chi tiết yêu cầu dịch vụ #${id}`}>
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/services/requests')}
          sx={{ mb: 2 }}
        >
          Quay lại danh sách
        </Button>

        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Yêu cầu dịch vụ #{request.RegistrationID}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarMonth fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      Ngày yêu cầu: {formatDate(request.RequestDate)}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusLabel(request.Status)}
                    color={getStatusColor(request.Status)}
                    size="small"
                  />
                </Box>

                <Box mt={{ xs: 2, sm: 0 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenDialog}
                    disabled={request.Status === 'Completed' || request.Status === 'Rejected' || request.Status === 'Cancelled'}
                  >
                    Cập nhật trạng thái
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Service Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Thông tin dịch vụ
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List disablePadding>
                  <ListItem disablePadding sx={{ pb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ReceiptLong color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tên dịch vụ"
                      secondary={request.ServiceName || 'N/A'}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                    />
                  </ListItem>

                  <ListItem disablePadding sx={{ pb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <AttachMoney color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Giá dịch vụ"
                      secondary={formatPrice(request.TotalPrice || 0)}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                    />
                  </ListItem>

                  <ListItem disablePadding sx={{ pb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <AccessTime color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Thời gian xử lý"
                      secondary={request.ProcessingTime || 'N/A'}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>

                  <ListItem disablePadding sx={{ pb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Business color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phòng ban phụ trách"
                      secondary={request.Department || 'N/A'}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Receipt color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Số lượng"
                      secondary={request.Quantity || '1'}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Card>
          </Grid>

          {/* Student Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Thông tin sinh viên
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar
                    sx={{ width: 64, height: 64, mr: 2 }}
                    src={request.Avatar}
                    alt={request.StudentName}
                  >
                    {request.StudentName ? request.StudentName.charAt(0) : 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{request.StudentName || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {request.Username || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <List disablePadding>
                  <ListItem disablePadding sx={{ pb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Email color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={request.Email || 'N/A'}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>

                  <ListItem disablePadding sx={{ pb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Phone color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Số điện thoại"
                      secondary={request.PhoneNumber || 'N/A'}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <PlaylistAddCheck color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Trạng thái thanh toán"
                      secondary={
                        <Chip
                          label={request.PaymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          color={request.PaymentStatus === 'Paid' ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      }
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Card>
          </Grid>

          {/* Processing Details */}
          <Grid item xs={12}>
            <Card>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Thông tin xử lý
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Lịch sử xử lý
                      </Typography>
                      <List disablePadding>
                        <ListItem disablePadding sx={{ pb: 2 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Person color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Người xử lý"
                            secondary={request.ProcessorName || 'Chưa có'}
                            primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                            secondaryTypographyProps={{ variant: 'body1' }}
                          />
                        </ListItem>

                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CalendarMonth color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Thời gian xử lý"
                            secondary={request.ProcessedAt ? formatDate(request.ProcessedAt) : 'Chưa xử lý'}
                            primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                            secondaryTypographyProps={{ variant: 'body1' }}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Ghi chú
                      </Typography>
                      {request.Comments ? (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {request.Comments}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary" fontStyle="italic">
                          Chưa có ghi chú
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Update Status Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật trạng thái yêu cầu</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Cập nhật trạng thái cho yêu cầu dịch vụ #{request.RegistrationID} - {request.ServiceName}
          </DialogContentText>

          <FormControl fullWidth margin="normal">
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={status}
              label="Trạng thái"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="Pending">
                <Box display="flex" alignItems="center">
                  <Chip label="Chờ xử lý" size="small" color="warning" sx={{ mr: 1 }} />
                  Chờ xử lý
                </Box>
              </MenuItem>
              <MenuItem value="Processing">
                <Box display="flex" alignItems="center">
                  <Chip label="Đang xử lý" size="small" color="info" sx={{ mr: 1 }} />
                  Đang xử lý
                </Box>
              </MenuItem>
              <MenuItem value="Completed">
                <Box display="flex" alignItems="center">
                  <Chip label="Hoàn thành" size="small" color="success" sx={{ mr: 1 }} />
                  Hoàn thành
                </Box>
              </MenuItem>
              <MenuItem value="Rejected">
                <Box display="flex" alignItems="center">
                  <Chip label="Từ chối" size="small" color="error" sx={{ mr: 1 }} />
                  Từ chối
                </Box>
              </MenuItem>
              <MenuItem value="Cancelled">
                <Box display="flex" alignItems="center">
                  <Chip label="Đã hủy" size="small" color="default" sx={{ mr: 1 }} />
                  Đã hủy
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            label="Ghi chú"
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Nhập ghi chú về việc xử lý yêu cầu này..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained"
            color={status === 'Completed' ? 'success' : (status === 'Rejected' || status === 'Cancelled') ? 'error' : 'primary'}
            startIcon={status === 'Completed' ? <CheckCircle /> : (status === 'Rejected' || status === 'Cancelled') ? <Cancel /> : null}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default RequestDetail; 
