import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { GetApp } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Timeout for axios requests
const axiosWithTimeout = (timeout = 15000) => {
  const instance = axios.create({
    timeout: timeout
  });
  return instance;
};

const PaymentHistory = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [downloadingReceipt, setDownloadingReceipt] = useState(null);

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
    filterSection: {
      marginBottom: theme.spacing(3)
    },
    formControl: {
      minWidth: 200,
      marginRight: theme.spacing(2)
    },
    tableContainer: {
      marginTop: theme.spacing(3)
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
      height: '200px'
    }
  };

  // Fetch payment data from API
  const fetchPaymentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const api = axiosWithTimeout();
      
      // Get tuition history
      const response = await api.get(`${API_BASE_URL}/tuition/history/${currentUser.id}`);
      
      if (response.data.success) {
        const tuitionData = response.data.data;
        
        // Extract unique semesters
        const uniqueSemesters = [...new Set(tuitionData.map(item => 
          `${item.SemesterName} ${item.AcademicYear}`
        ))];
        
        setSemesters(uniqueSemesters);
        
        // For each tuition, get its payments
        const allPayments = [];
        
        for (const tuition of tuitionData) {
          try {
            const paymentsResponse = await api.get(`${API_BASE_URL}/tuition/payments/${tuition.TuitionID}`);
            
            if (paymentsResponse.data.success) {
              // Enhance payment data with semester info
              const enhancedPayments = paymentsResponse.data.data.map(payment => ({
                ...payment,
                semester: `${tuition.SemesterName} ${tuition.AcademicYear}`,
                semesterId: tuition.SemesterID,
                SemesterName: tuition.SemesterName,
                AcademicYear: tuition.AcademicYear
              }));
              
              allPayments.push(...enhancedPayments);
            }
          } catch (err) {
            console.error(`Error fetching payments for tuition ${tuition.TuitionID}:`, err);
          }
        }
        
        // Sort payments by date, most recent first
        allPayments.sort((a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate));
        
        setPayments(allPayments);
        setFilteredPayments(allPayments);
      } else {
        throw new Error(response.data.message || 'Could not retrieve payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải dữ liệu lịch sử thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchPaymentData();
    }
  }, [currentUser]);

  useEffect(() => {
    // Filter payments based on selected filters
    let result = payments;
    
    if (selectedSemester !== 'all') {
      result = result.filter(payment => `${payment.SemesterName} ${payment.AcademicYear}` === selectedSemester);
    }
    
    if (selectedStatus !== 'all') {
      result = result.filter(payment => payment.Status === selectedStatus);
    }
    
    setFilteredPayments(result);
  }, [selectedSemester, selectedStatus, payments]);

  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleDownloadReceipt = async (payment) => {
    setDownloadingReceipt(payment.PaymentID);
    
    try {
      // In a real implementation, this would call an API endpoint to get a PDF receipt
      // For demonstration purposes, we'll create a simple text receipt
      const receiptContent = generateReceiptContent(payment);
      
      // Create a blob from the receipt content
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary download link and trigger it
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `receipt-${payment.PaymentID}.txt`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Không thể tải xuống biên lai. Vui lòng thử lại sau.');
    } finally {
      setDownloadingReceipt(null);
    }
  };
  
  const generateReceiptContent = (payment) => {
    // Format the receipt content
    return `
=======================================================
              HÓA ĐƠN THANH TOÁN HỌC PHÍ
=======================================================

Mã giao dịch: ${payment.PaymentID}
Mã tham chiếu: ${payment.TransactionCode || 'N/A'}
Ngày thanh toán: ${formatDate(payment.PaymentDate)}
Học kỳ: ${payment.SemesterName} ${payment.AcademicYear}

-------------------------------------------------------
Thông tin sinh viên:
-------------------------------------------------------
Họ và tên: ${currentUser.FullName}
Mã sinh viên: ${currentUser.Username}

-------------------------------------------------------
Chi tiết thanh toán:
-------------------------------------------------------
Số tiền: ${formatCurrency(payment.Amount)}
Phương thức thanh toán: ${translatePaymentMethod(payment.PaymentMethod)}
Trạng thái: ${translateStatus(payment.Status)}

-------------------------------------------------------
Ghi chú:
${payment.Notes || 'Không có ghi chú'}

=======================================================
Đây là hóa đơn điện tử, không cần đóng dấu hay ký tên.
Thời gian xuất: ${new Date().toLocaleString('vi-VN')}
=======================================================
    `;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const translatePaymentMethod = (method) => {
    const methods = {
      'Credit Card': 'Thẻ tín dụng/ghi nợ',
      'credit_card': 'Thẻ tín dụng/ghi nợ',
      'Bank Transfer': 'Chuyển khoản ngân hàng',
      'bank_transfer': 'Chuyển khoản ngân hàng',
      'Cash': 'Tiền mặt',
      'Momo': 'Ví Momo',
      'ZaloPay': 'ZaloPay',
      'VNPay': 'VNPay',
      'ewallet': 'Ví điện tử'
    };
    
    return methods[method] || method;
  };
  
  const translateStatus = (status) => {
    const statuses = {
      'Completed': 'Thành công',
      'Pending': 'Đang xử lý',
      'Failed': 'Thất bại',
      'Refunded': 'Hoàn tiền',
      'Cancelled': 'Đã hủy'
    };
    
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Failed':
      case 'Cancelled':
        return 'error';
      case 'Refunded':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // If there's a loading error, show error message with retry button
  if (error) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Lịch sử giao dịch
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <Alert severity="error" sx={{ width: '100%', maxWidth: '500px' }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchPaymentData} 
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
              Lịch sử giao dịch
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" sx={{ marginTop: theme.spacing(2) }}>
              Đang tải dữ liệu lịch sử thanh toán...
            </Typography>
          </Box>
        </Paper>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Lịch sử giao dịch
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem lịch sử thanh toán học phí và tải xuống biên lai
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Box sx={styles.filterSection}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FormControl sx={styles.formControl}>
                <InputLabel>Học kỳ</InputLabel>
                <Select
                  value={selectedSemester}
                  onChange={handleSemesterChange}
                  label="Học kỳ"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {semesters.map((semester, index) => (
                    <MenuItem key={index} value={semester}>{semester}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <FormControl sx={styles.formControl}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  label="Trạng thái"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="Completed">Thành công</MenuItem>
                  <MenuItem value="Pending">Đang xử lý</MenuItem>
                  <MenuItem value="Failed">Thất bại</MenuItem>
                  <MenuItem value="Refunded">Hoàn tiền</MenuItem>
                  <MenuItem value="Cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <TableContainer component={Paper} sx={styles.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã giao dịch</TableCell>
                <TableCell>Ngày thanh toán</TableCell>
                <TableCell>Học kỳ</TableCell>
                <TableCell>Số tiền</TableCell>
                <TableCell>Phương thức</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Mã tham chiếu</TableCell>
                <TableCell align="center">Biên lai</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.PaymentID}>
                  <TableCell>{payment.PaymentID}</TableCell>
                  <TableCell>{formatDate(payment.PaymentDate)}</TableCell>
                  <TableCell>{payment.semester}</TableCell>
                  <TableCell>{formatCurrency(payment.Amount)}</TableCell>
                  <TableCell>{translatePaymentMethod(payment.PaymentMethod)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={translateStatus(payment.Status)}
                      color={getStatusColor(payment.Status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{payment.TransactionCode || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Button
                      startIcon={downloadingReceipt === payment.PaymentID ? <CircularProgress size={20} /> : <GetApp />}
                      size="small"
                      onClick={() => handleDownloadReceipt(payment)}
                      disabled={downloadingReceipt === payment.PaymentID || payment.Status !== 'Completed'}
                    >
                      Tải
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1">
                      Không có giao dịch nào phù hợp với bộ lọc.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={styles.buttonGroup}>
          <Button
            variant="contained" 
            color="primary"
            onClick={fetchPaymentData}
          >
            Làm mới dữ liệu
          </Button>
        </Box>
      </Paper>
    </div>
  );
};

export default PaymentHistory; 