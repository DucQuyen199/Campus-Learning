/*-----------------------------------------------------------------
* File: OnlineServices.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress,
  FormHelperText,
  IconButton
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Assignment, 
  ReceiptLong, 
  Badge, 
  LibraryBooks, 
  School,
  Check,
  Pending,
  Close,
  Description,
  LocalLibrary,
  CardMembership,
  CreditCard,
  Error,
  Info
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Service icons mapping
const serviceIcons = {
  "Xác nhận sinh viên": <Assignment color="primary" />,
  "Bảng điểm chính thức": <ReceiptLong color="primary" />,
  "Thẻ sinh viên": <Badge color="primary" />,
  "Giấy giới thiệu thực tập": <LibraryBooks color="primary" />,
  "Xác nhận hoàn thành chương trình": <School color="primary" />,
  "Bản sao bằng tốt nghiệp": <CardMembership color="primary" />,
  "Bản sao học bạ": <Description color="primary" />,
  "Giấy xác nhận điểm rèn luyện": <LibraryBooks color="primary" />,
  "Giấy chứng nhận sinh viên": <LocalLibrary color="primary" />,
  "default": <Description color="primary" />
};

// Remove the static sample purposes since we'll fetch them dynamically
// Sample request purposes
// const samplePurposes = [
//   { id: 1, name: 'Xin visa du học' },
//   { id: 2, name: 'Xin học bổng' },
//   { id: 3, name: 'Xin thực tập' },
//   { id: 4, name: 'Xin việc làm' },
//   { id: 5, name: 'Mục đích khác' }
// ];

const OnlineServices = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [purposesLoading, setPurposesLoading] = useState(false);

  // Styles using theme directly instead of makeStyles
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
    card: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    cardContent: {
      flexGrow: 1
    },
    icon: {
      fontSize: 40,
      marginBottom: theme.spacing(2)
    },
    requestHistory: {
      marginTop: theme.spacing(4)
    },
    formControl: {
      marginBottom: theme.spacing(3)
    },
    chipPending: {
      backgroundColor: theme.palette.warning.main,
      color: theme.palette.warning.contrastText
    },
    chipApproved: {
      backgroundColor: theme.palette.success.main,
      color: theme.palette.success.contrastText
    },
    chipRejected: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText
    }
  };

  // Fetch services and metadata
  useEffect(() => {
    const fetchServicesData = async () => {
      setServicesLoading(true);
      try {
        const [servicesResponse, metadataResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/services`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }),
          axios.get(`${API_BASE_URL}/services/metadata`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);
        
        if (servicesResponse.data.success) {
          setServices(servicesResponse.data.services);
        }
        
        if (metadataResponse.data.success) {
          setDeliveryMethods(metadataResponse.data.deliveryMethods);
        }
      } catch (error) {
        console.error('Error fetching services data:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Có lỗi xảy ra khi lấy thông tin dịch vụ'
        });
      } finally {
        setServicesLoading(false);
      }
    };
    
    fetchServicesData();
  }, []);

  // Fetch request history
  useEffect(() => {
    const fetchRequestHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/services/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          setRequestHistory(response.data.requests);
        }
      } catch (error) {
        console.error('Error fetching request history:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Có lỗi xảy ra khi lấy lịch sử yêu cầu'
        });
      } finally {
        setHistoryLoading(false);
      }
    };
    
    fetchRequestHistory();
  }, []);

  const handleOpenDialog = (service) => {
    setSelectedService(service);
    setDialogOpen(true);
    
    // Reset form
    setPurpose('');
    setQuantity(1);
    setNote('');
    setDeliveryMethod(deliveryMethods.length > 0 ? deliveryMethods[0].id : '');
    
    // Fetch purposes for this service
    fetchServicePurposes(service.id);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
  };

  const handlePurposeChange = (event) => {
    setPurpose(event.target.value);
  };

  const handleDeliveryMethodChange = (event) => {
    setDeliveryMethod(event.target.value);
  };

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 10) {
      setQuantity(value);
    }
  };

  const handleNoteChange = (event) => {
    setNote(event.target.value);
  };

  const handleSubmitRequest = async () => {
    // Validate form
    if (!purpose) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng chọn mục đích yêu cầu.'
      });
      return;
    }

    if (!deliveryMethod) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng chọn phương thức nhận.'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/services/request`, {
        serviceId: selectedService.id,
        quantity,
        deliveryMethod,
        purpose: purposes.find(p => p.id === purpose)?.name || 'Mục đích khác',
        comments: note
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Close dialog
        setDialogOpen(false);
        
        // Show success message
        setSubmitStatus({
          type: 'success',
          message: response.data.message || 'Yêu cầu dịch vụ đã được gửi thành công!'
        });
        
        // Refresh request history
        fetchUpdatedHistory();
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.data.message || 'Có lỗi xảy ra khi gửi yêu cầu.'
        });
      }
    } catch (error) {
      console.error('Error submitting service request:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUpdatedHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/services/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setRequestHistory(response.data.requests);
      }
    } catch (error) {
      console.error('Error refreshing request history:', error);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return (
          <Chip 
            icon={<Check />} 
            label="Đã duyệt" 
            size="small"
            color="success"
          />
        );
      case 'Pending':
      case 'Processing':
        return (
          <Chip 
            icon={<Pending />} 
            label="Đang xử lý" 
            size="small"
            color="warning"
          />
        );
      case 'Rejected':
      case 'Cancelled':
        return (
          <Chip 
            icon={<Close />} 
            label="Từ chối" 
            size="small"
            color="error"
          />
        );
      default:
        return (
          <Chip 
            icon={<Info />} 
            label={status} 
            size="small"
            color="default"
          />
        );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getServiceIcon = (serviceName) => {
    return serviceIcons[serviceName] || serviceIcons.default;
  };

  const fetchServicePurposes = async (serviceId) => {
    setPurposesLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/services/purposes/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setPurposes(response.data.purposes);
      } else {
        console.error('Error loading purposes:', response.data.message);
        setPurposes([{ id: 'other', name: 'Mục đích khác' }]);
      }
    } catch (error) {
      console.error('Error fetching service purposes:', error);
      setPurposes([{ id: 'other', name: 'Mục đích khác' }]);
    } finally {
      setPurposesLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Dịch vụ trực tuyến
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Yêu cầu các dịch vụ và giấy tờ từ nhà trường trực tuyến
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {submitStatus && (
          <Alert 
            severity={submitStatus.type} 
            sx={{ mb: 3 }}
            onClose={() => setSubmitStatus(null)}
          >
            {submitStatus.message}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Các dịch vụ có sẵn
        </Typography>
        
        {servicesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {services.length > 0 ? services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <Card sx={styles.card}>
                  <CardContent sx={styles.cardContent}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ ...styles.icon }}>
                        {getServiceIcon(service.title)}
                      </Box>
                      <Typography variant="h6" align="center" gutterBottom>
                        {service.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {service.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Phí:</strong> {formatCurrency(service.fee)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Thời gian xử lý:</strong> {service.processingTime}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      fullWidth
                      variant="contained"
                      onClick={() => handleOpenDialog(service)}
                    >
                      Yêu cầu dịch vụ
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Hiện tại không có dịch vụ nào có sẵn. Vui lòng quay lại sau.
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        <Box sx={styles.requestHistory}>
          <Typography variant="h6" gutterBottom>
            Lịch sử yêu cầu
          </Typography>
          
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dịch vụ</TableCell>
                    <TableCell>Ngày yêu cầu</TableCell>
                    <TableCell>Mục đích</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Trạng thái thanh toán</TableCell>
                    <TableCell>Ngày nhận</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requestHistory.length > 0 ? requestHistory.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.serviceTitle}</TableCell>
                      <TableCell>{request.requestDate}</TableCell>
                      <TableCell>{request.purpose}</TableCell>
                      <TableCell align="center">{request.quantity}</TableCell>
                      <TableCell>{getStatusChip(request.status)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                          size="small" 
                          color={request.paymentStatus === 'Paid' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{request.receiveDate || '-'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body1">
                          Bạn chưa có yêu cầu dịch vụ nào.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Yêu cầu dịch vụ: {selectedService?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            {selectedService && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    <strong>Mô tả:</strong> {selectedService.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    <strong>Phí:</strong> {formatCurrency(selectedService.fee)} / bản
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    <strong>Thời gian xử lý:</strong> {selectedService.processingTime}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth sx={styles.formControl} required error={submitStatus?.type === 'error' && !purpose}>
                    <InputLabel>Mục đích yêu cầu</InputLabel>
                    <Select
                      value={purpose}
                      onChange={handlePurposeChange}
                      label="Mục đích yêu cầu"
                      disabled={loading || purposesLoading}
                    >
                      {purposesLoading ? (
                        <MenuItem disabled>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Đang tải...
                          </Box>
                        </MenuItem>
                      ) : purposes.length > 0 ? (
                        purposes.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>Không có mục đích phù hợp</MenuItem>
                      )}
                    </Select>
                    {submitStatus?.type === 'error' && !purpose && (
                      <FormHelperText>Trường này là bắt buộc</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth sx={styles.formControl} required error={submitStatus?.type === 'error' && !deliveryMethod}>
                    <InputLabel>Phương thức nhận</InputLabel>
                    <Select
                      value={deliveryMethod}
                      onChange={handleDeliveryMethodChange}
                      label="Phương thức nhận"
                      disabled={loading}
                    >
                      {deliveryMethods.map((method) => (
                        <MenuItem key={method.id} value={method.id}>
                          {method.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {submitStatus?.type === 'error' && !deliveryMethod && (
                      <FormHelperText>Trường này là bắt buộc</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Số lượng bản"
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    fullWidth
                    sx={styles.formControl}
                    InputProps={{
                      inputProps: { min: 1, max: 10 }
                    }}
                    disabled={loading}
                    helperText="Tối đa 10 bản"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Ghi chú thêm (nếu có)"
                    value={note}
                    onChange={handleNoteChange}
                    fullWidth
                    multiline
                    rows={3}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Hủy</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmitRequest}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OnlineServices; 
