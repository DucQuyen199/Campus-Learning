import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Add a timeout to axios requests
const axiosWithTimeout = (timeout = 15000) => {
  const instance = axios.create({
    timeout: timeout
  });
  return instance;
};

const TuitionPayment = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [tuitionData, setTuitionData] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [loadingTimeoutExceeded, setLoadingTimeoutExceeded] = useState(false);

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
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    buttonGroup: {
      marginTop: theme.spacing(3),
      display: 'flex',
      justifyContent: 'flex-end'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      minHeight: '300px'
    },
    paymentHistoryButton: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2)
    },
    paymentHistoryCard: {
      marginTop: theme.spacing(2)
    }
  };

  // Set a loading timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId;
    
    if (loading && currentUser && currentUser.id) {
      timeoutId = setTimeout(() => {
        setLoadingTimeoutExceeded(true);
        setLoading(false);
        setError('Thời gian tải dữ liệu quá lâu. Vui lòng thử lại.');
      }, 20000); // 20 seconds timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, currentUser]);

  // Fetch tuition data from API
  const fetchTuitionData = async () => {
    setLoading(true);
    setError(null);
    setLoadingTimeoutExceeded(false);
    
    try {
      const api = axiosWithTimeout();
      
      // Fetch tuition and payment history in one call
      const response = await api.get(`${API_BASE_URL}/tuition/current/${currentUser.id}`);
      
      if (response.data.success) {
        const tuition = response.data.data;
        setTuitionData(tuition);
        setPaymentAmount(tuition.remaining);
        // Payment history included in tuition.payments
        setPaymentHistory(tuition.payments || []);
      } else {
        throw new Error(response.data.message || 'Could not retrieve tuition data');
      }
    } catch (err) {
      console.error('Error fetching tuition data:', err);
      setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải dữ liệu học phí.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchTuitionData();
    }
  }, [currentUser]);

  const handlePaymentAmountChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0 && tuitionData && value <= tuitionData.remaining) {
      setPaymentAmount(value);
    }
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handleOpenPaymentConfirmation = () => {
    setShowPaymentConfirmation(true);
  };

  const handleClosePaymentConfirmation = () => {
    setShowPaymentConfirmation(false);
  };

  const handlePayment = async () => {
    setSubmitting(true);
    setPaymentStatus(null);
    handleClosePaymentConfirmation();
    
    try {
      const api = axiosWithTimeout(30000); // Longer timeout for payment processing
      
      // Generate a mock transaction code (in a real app, this would come from the payment gateway)
      const transactionCode = `TXN-${Math.floor(Math.random() * 1000000)}`;
      
      const response = await api.post(`${API_BASE_URL}/tuition/pay`, {
        tuitionId: tuitionData.TuitionID,
        userId: currentUser.id,
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        transactionCode: transactionCode
      });
      
      if (response.data.success) {
        // Update the tuition data with the latest information
        setTuitionData(response.data.data.tuition);
        
        // Add the new payment to the payment history
        setPaymentHistory([response.data.data.payment, ...paymentHistory]);
        
        setPaymentStatus({
          type: 'success',
          message: 'Thanh toán học phí thành công!'
        });
        
        // Reset payment amount to the new remaining balance
        setPaymentAmount(response.data.data.tuition.remaining);
        setPaymentMethod('');
      } else {
        throw new Error(response.data.message || 'Payment processing failed');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setPaymentStatus({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi xử lý thanh toán.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePaymentHistory = () => {
    setShowPaymentHistory(!showPaymentHistory);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // If there's a loading error, show error message with retry button
  if (error) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Thanh toán học phí
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <Alert severity="error" sx={{ width: '100%', maxWidth: '500px' }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchTuitionData} 
              sx={{ marginTop: theme.spacing(2) }}
            >
              Thử lại
            </Button>
          </Box>
        </Paper>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Thanh toán học phí
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" sx={{ marginTop: theme.spacing(2) }}>
              Đang tải thông tin học phí...
            </Typography>
          </Box>
        </Paper>
      </div>
    );
  }

  // If no tuition data is available
  if (!tuitionData) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Thanh toán học phí
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Thanh toán học phí trực tuyến qua các phương thức thanh toán khác nhau
            </Typography>
            <Divider sx={{ mt: 2 }} />
          </Box>
          <Alert severity="info">
            Không có thông tin học phí cho học kỳ hiện tại. Vui lòng liên hệ phòng tài chính để biết thêm chi tiết.
          </Alert>
        </Paper>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Thanh toán học phí
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Thanh toán học phí trực tuyến qua các phương thức thanh toán khác nhau
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {paymentStatus && (
          <Alert 
            severity={paymentStatus.type} 
            sx={{ mb: 3 }}
            onClose={() => setPaymentStatus(null)}
          >
            {paymentStatus.message}
          </Alert>
        )}

        <Card sx={styles.card}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thông tin học phí
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Mã sinh viên:</strong> {tuitionData.StudentCode || currentUser.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Họ và tên:</strong> {tuitionData.StudentName || currentUser.FullName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Học kỳ:</strong> {tuitionData.SemesterName} {tuitionData.AcademicYear}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Trạng thái:</strong> <span style={{ 
                    color: tuitionData.Status === 'Paid' ? theme.palette.success.main : 
                           tuitionData.Status === 'Unpaid' ? theme.palette.error.main : 
                           theme.palette.warning.main 
                  }}>
                    {tuitionData.Status === 'Paid' ? 'Đã thanh toán' : 
                     tuitionData.Status === 'Unpaid' ? 'Chưa thanh toán' : 
                     tuitionData.Status === 'Partial' ? 'Thanh toán một phần' : 
                     tuitionData.Status === 'Waived' ? 'Được miễn giảm' : 
                     tuitionData.Status === 'Overdue' ? 'Quá hạn' : tuitionData.Status}
                  </span>
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Khoản mục</TableCell>
                        <TableCell align="right">Số tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tuitionData.items && tuitionData.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell><strong>Tổng học phí</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(tuitionData.TotalAmount)}</strong></TableCell>
                      </TableRow>
                      {tuitionData.ScholarshipAmount > 0 && (
                        <TableRow>
                          <TableCell>Học bổng/Miễn giảm</TableCell>
                          <TableCell align="right">- {formatCurrency(tuitionData.ScholarshipAmount)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell><strong>Số tiền phải đóng</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(tuitionData.FinalAmount)}</strong></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Đã thanh toán</TableCell>
                        <TableCell align="right">{formatCurrency(tuitionData.paid)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Còn lại</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(tuitionData.remaining)}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" color="error">
                  <strong>Hạn thanh toán:</strong> {tuitionData.DueDate ? formatDate(tuitionData.DueDate) : 'Chưa có thông tin'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Button 
          variant="outlined" 
          color="primary"
          onClick={handleTogglePaymentHistory}
          sx={styles.paymentHistoryButton}
        >
          {showPaymentHistory ? 'Ẩn lịch sử thanh toán' : 'Xem lịch sử thanh toán'}
        </Button>

        {showPaymentHistory && (
          <Card sx={styles.paymentHistoryCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lịch sử thanh toán
              </Typography>
              {paymentHistory.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ngày thanh toán</TableCell>
                        <TableCell>Số tiền</TableCell>
                        <TableCell>Phương thức</TableCell>
                        <TableCell>Mã giao dịch</TableCell>
                        <TableCell>Trạng thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.PaymentID}>
                          <TableCell>{formatDate(payment.PaymentDate)}</TableCell>
                          <TableCell>{formatCurrency(payment.Amount)}</TableCell>
                          <TableCell>
                            {payment.PaymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                             payment.PaymentMethod === 'credit_card' ? 'Thẻ tín dụng/ghi nợ' :
                             payment.PaymentMethod === 'ewallet' ? 'Ví điện tử' : payment.PaymentMethod}
                          </TableCell>
                          <TableCell>{payment.TransactionCode || 'N/A'}</TableCell>
                          <TableCell>
                            <span style={{
                              color: payment.Status === 'Completed' ? theme.palette.success.main :
                                     payment.Status === 'Pending' ? theme.palette.warning.main :
                                     payment.Status === 'Failed' ? theme.palette.error.main : 'inherit'
                            }}>
                              {payment.Status === 'Completed' ? 'Hoàn thành' :
                               payment.Status === 'Pending' ? 'Đang xử lý' :
                               payment.Status === 'Failed' ? 'Thất bại' : payment.Status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1">
                  Chưa có lịch sử thanh toán nào
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        {tuitionData.remaining > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Thanh toán
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Số tiền thanh toán"
                  value={paymentAmount}
                  onChange={handlePaymentAmountChange}
                  fullWidth
                  type="number"
                  InputProps={{
                    inputProps: { min: 1, max: tuitionData.remaining }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Phương thức thanh toán</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    label="Phương thức thanh toán"
                  >
                    <MenuItem value="credit_card">Thẻ tín dụng/ghi nợ</MenuItem>
                    <MenuItem value="bank_transfer">Chuyển khoản ngân hàng</MenuItem>
                    <MenuItem value="ewallet">Ví điện tử</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={styles.buttonGroup}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenPaymentConfirmation}
                disabled={!paymentMethod || paymentAmount <= 0 || submitting}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `Thanh toán ${formatCurrency(paymentAmount)}`
                )}
              </Button>
            </Box>
          </>
        )}

        {/* Payment Confirmation Dialog */}
        <Dialog
          open={showPaymentConfirmation}
          onClose={handleClosePaymentConfirmation}
        >
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Bạn sắp thanh toán <strong>{formatCurrency(paymentAmount)}</strong> cho học phí học kỳ {tuitionData.SemesterName} {tuitionData.AcademicYear}.
              <br /><br />
              Phương thức thanh toán: <strong>
                {paymentMethod === 'credit_card' ? 'Thẻ tín dụng/ghi nợ' :
                 paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                 paymentMethod === 'ewallet' ? 'Ví điện tử' : paymentMethod}
              </strong>
              <br /><br />
              Bạn có chắc chắn muốn tiếp tục không?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePaymentConfirmation} color="primary">
              Hủy bỏ
            </Button>
            <Button onClick={handlePayment} color="primary" variant="contained">
              Xác nhận thanh toán
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default TuitionPayment; 