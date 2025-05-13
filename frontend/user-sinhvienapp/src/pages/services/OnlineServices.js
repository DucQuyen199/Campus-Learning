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
  useTheme
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
  Close
} from '@mui/icons-material';

// Sample services data
const servicesData = [
  {
    id: 1,
    title: 'Xác nhận sinh viên',
    description: 'Xin giấy xác nhận đang học tập tại trường',
    icon: <Assignment color="primary" />,
    fee: 10000,
    processingTime: '3 ngày làm việc'
  },
  {
    id: 2,
    title: 'Bảng điểm chính thức',
    description: 'Xin bảng điểm chính thức có dấu mộc của trường',
    icon: <ReceiptLong color="primary" />,
    fee: 20000,
    processingTime: '5 ngày làm việc'
  },
  {
    id: 3,
    title: 'Thẻ sinh viên',
    description: 'Làm lại thẻ sinh viên khi bị mất hoặc hỏng',
    icon: <Badge color="primary" />,
    fee: 50000,
    processingTime: '7 ngày làm việc'
  },
  {
    id: 4,
    title: 'Giấy giới thiệu thực tập',
    description: 'Xin giấy giới thiệu để đi thực tập tại doanh nghiệp',
    icon: <LibraryBooks color="primary" />,
    fee: 10000,
    processingTime: '3 ngày làm việc'
  },
  {
    id: 5,
    title: 'Xác nhận hoàn thành chương trình',
    description: 'Xác nhận đã hoàn thành chương trình học (chờ nhận bằng)',
    icon: <School color="primary" />,
    fee: 30000,
    processingTime: '5 ngày làm việc'
  }
];

// Sample request history
const requestHistoryData = [
  {
    id: 1,
    serviceTitle: 'Xác nhận sinh viên',
    requestDate: '15/11/2023',
    purpose: 'Xin visa du học',
    quantity: 2,
    status: 'Approved',
    receiveDate: '18/11/2023'
  },
  {
    id: 2,
    serviceTitle: 'Bảng điểm chính thức',
    requestDate: '10/10/2023',
    purpose: 'Xin học bổng',
    quantity: 1,
    status: 'Approved',
    receiveDate: '15/10/2023'
  },
  {
    id: 3,
    serviceTitle: 'Giấy giới thiệu thực tập',
    requestDate: '20/11/2023',
    purpose: 'Thực tập tại công ty ABC',
    quantity: 1,
    status: 'Pending',
    receiveDate: null
  },
  {
    id: 4,
    serviceTitle: 'Thẻ sinh viên',
    requestDate: '01/09/2023',
    purpose: 'Làm lại do bị mất',
    quantity: 1,
    status: 'Rejected',
    receiveDate: null,
    rejectionReason: 'Thông tin kèm theo không đầy đủ'
  }
];

// Request types/purposes
const purposes = [
  { id: 1, name: 'Xin visa du học' },
  { id: 2, name: 'Xin học bổng' },
  { id: 3, name: 'Xin thực tập' },
  { id: 4, name: 'Xin việc làm' },
  { id: 5, name: 'Mục đích khác' }
];

const OnlineServices = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);

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

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setRequestHistory(requestHistoryData);
  }, []);

  const handleOpenDialog = (service) => {
    setSelectedService(service);
    setDialogOpen(true);
    
    // Reset form
    setPurpose('');
    setQuantity(1);
    setNote('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
  };

  const handlePurposeChange = (event) => {
    setPurpose(event.target.value);
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

  const handleSubmitRequest = () => {
    // Validate form
    if (!purpose) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng chọn mục đích yêu cầu.'
      });
      return;
    }

    // In a real application, this would send request data to an API
    // Add new request to history
    const newRequest = {
      id: requestHistory.length + 1,
      serviceTitle: selectedService.title,
      requestDate: new Date().toLocaleDateString('vi-VN'),
      purpose: purposes.find(p => p.id === purpose)?.name || 'Mục đích khác',
      quantity,
      status: 'Pending',
      receiveDate: null
    };

    setRequestHistory([newRequest, ...requestHistory]);

    // Close dialog and show success message
    setDialogOpen(false);
    setSubmitStatus({
      type: 'success',
      message: 'Yêu cầu của bạn đã được ghi nhận. Vui lòng theo dõi trạng thái xử lý.'
    });

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSubmitStatus(null);
    }, 3000);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <Chip 
            icon={<Check />} 
            label="Đã duyệt" 
            size="small"
            color="success"
          />
        );
      case 'Pending':
        return (
          <Chip 
            icon={<Pending />} 
            label="Đang xử lý" 
            size="small"
            color="warning"
          />
        );
      case 'Rejected':
        return (
          <Chip 
            icon={<Close />} 
            label="Từ chối" 
            size="small"
            color="error"
          />
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
        
        <Grid container spacing={3}>
          {servicesData.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <Card sx={styles.card}>
                <CardContent sx={styles.cardContent}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ ...styles.icon }}>
                      {service.icon}
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
          ))}
        </Grid>

        <Box sx={styles.requestHistory}>
          <Typography variant="h6" gutterBottom>
            Lịch sử yêu cầu
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dịch vụ</TableCell>
                  <TableCell>Ngày yêu cầu</TableCell>
                  <TableCell>Mục đích</TableCell>
                  <TableCell align="center">Số lượng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ngày nhận</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requestHistory.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.serviceTitle}</TableCell>
                    <TableCell>{request.requestDate}</TableCell>
                    <TableCell>{request.purpose}</TableCell>
                    <TableCell align="center">{request.quantity}</TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>{request.receiveDate || '-'}</TableCell>
                  </TableRow>
                ))}
                {requestHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1">
                        Bạn chưa có yêu cầu dịch vụ nào.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
                  <FormControl fullWidth sx={styles.formControl} required>
                    <InputLabel>Mục đích yêu cầu</InputLabel>
                    <Select
                      value={purpose}
                      onChange={handlePurposeChange}
                      label="Mục đích yêu cầu"
                    >
                      {purposes.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
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
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmitRequest}
          >
            Gửi yêu cầu
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OnlineServices; 