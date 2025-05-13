import React, { useState } from 'react';
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
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Sample tuition data
const tuitionData = {
  studentId: '12345678',
  name: 'Nguyen Van A',
  major: 'Computer Science',
  semester: 'HK1-2023-2024',
  totalTuition: 12500000,
  paid: 0,
  remaining: 12500000,
  dueDate: '30/09/2023',
  items: [
    { id: 1, name: 'Tuition Fee', amount: 10000000 },
    { id: 2, name: 'Lab Fee', amount: 1500000 },
    { id: 3, name: 'Student Services', amount: 1000000 }
  ]
};

const TuitionPayment = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [paymentAmount, setPaymentAmount] = useState(tuitionData.remaining);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

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
    }
  };

  const handlePaymentAmountChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= tuitionData.remaining) {
      setPaymentAmount(value);
    }
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handlePayment = () => {
    // This would send payment data to an API
    setPaymentStatus({
      type: 'success',
      message: 'Thanh toán học phí thành công!'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

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
                  <strong>Mã sinh viên:</strong> {tuitionData.studentId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Họ và tên:</strong> {tuitionData.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Ngành học:</strong> {tuitionData.major}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Học kỳ:</strong> {tuitionData.semester}
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
                      {tuitionData.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell><strong>Tổng học phí</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(tuitionData.totalTuition)}</strong></TableCell>
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
                  <strong>Hạn thanh toán:</strong> {tuitionData.dueDate}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
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
            onClick={handlePayment}
            disabled={!paymentMethod || paymentAmount <= 0}
          >
            Thanh toán {formatCurrency(paymentAmount)}
          </Button>
        </Box>
      </Paper>
    </div>
  );
};

export default TuitionPayment; 