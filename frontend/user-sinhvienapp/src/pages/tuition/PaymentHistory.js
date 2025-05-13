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
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { GetApp } from '@mui/icons-material';

// Sample payment history data
const samplePayments = [
  {
    id: 'PAY123456',
    date: '15/09/2023',
    amount: 6250000,
    method: 'Thẻ tín dụng',
    semester: 'HK1-2023-2024',
    status: 'Thành công',
    reference: 'REF123456'
  },
  {
    id: 'PAY123457',
    date: '15/09/2023',
    amount: 6250000,
    method: 'Chuyển khoản',
    semester: 'HK1-2023-2024',
    status: 'Thành công',
    reference: 'REF123457'
  },
  {
    id: 'PAY123458',
    date: '20/03/2023',
    amount: 12500000,
    method: 'Ví điện tử',
    semester: 'HK2-2022-2023',
    status: 'Thành công',
    reference: 'REF123458'
  },
  {
    id: 'PAY123459',
    date: '10/10/2022',
    amount: 12500000,
    method: 'Thẻ tín dụng',
    semester: 'HK1-2022-2023',
    status: 'Thành công',
    reference: 'REF123459'
  }
];

const PaymentHistory = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

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
    }
  };

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setPayments(samplePayments);
    setFilteredPayments(samplePayments);
  }, []);

  useEffect(() => {
    // Filter payments based on selected filters
    let result = payments;
    
    if (selectedSemester !== 'all') {
      result = result.filter(payment => payment.semester === selectedSemester);
    }
    
    if (selectedStatus !== 'all') {
      result = result.filter(payment => payment.status === selectedStatus);
    }
    
    setFilteredPayments(result);
  }, [selectedSemester, selectedStatus, payments]);

  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleDownloadReceipt = (paymentId) => {
    // This would download a receipt in a real application
    alert(`Downloading receipt for payment: ${paymentId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Thành công':
        return 'success';
      case 'Đang xử lý':
        return 'warning';
      case 'Thất bại':
        return 'error';
      default:
        return 'default';
    }
  };

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
                  <MenuItem value="HK1-2023-2024">HK1 2023-2024</MenuItem>
                  <MenuItem value="HK2-2022-2023">HK2 2022-2023</MenuItem>
                  <MenuItem value="HK1-2022-2023">HK1 2022-2023</MenuItem>
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
                  <MenuItem value="Thành công">Thành công</MenuItem>
                  <MenuItem value="Đang xử lý">Đang xử lý</MenuItem>
                  <MenuItem value="Thất bại">Thất bại</MenuItem>
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
                <TableCell>Tham chiếu</TableCell>
                <TableCell align="center">Biên lai</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.id}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.semester}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Chip 
                      label={payment.status} 
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{payment.reference}</TableCell>
                  <TableCell align="center">
                    <Button
                      startIcon={<GetApp />}
                      size="small"
                      onClick={() => handleDownloadReceipt(payment.id)}
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
      </Paper>
    </div>
  );
};

export default PaymentHistory; 