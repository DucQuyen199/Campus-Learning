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
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Print, GetApp } from '@mui/icons-material';

// Sample tuition data
const tuitionData = [
  {
    id: 1,
    semester: 'HK1-2023-2024',
    tuitionFee: 10000000,
    otherFees: 2500000,
    totalAmount: 12500000,
    paidAmount: 6250000,
    remainingAmount: 6250000,
    dueDate: '30/09/2023',
    status: 'Thanh toán một phần'
  },
  {
    id: 2,
    semester: 'HK2-2022-2023',
    tuitionFee: 10000000,
    otherFees: 2500000,
    totalAmount: 12500000,
    paidAmount: 12500000,
    remainingAmount: 0,
    dueDate: '28/02/2023',
    status: 'Đã thanh toán'
  },
  {
    id: 3,
    semester: 'HK1-2022-2023',
    tuitionFee: 10000000,
    otherFees: 2500000,
    totalAmount: 12500000,
    paidAmount: 12500000,
    remainingAmount: 0,
    dueDate: '30/09/2022',
    status: 'Đã thanh toán'
  }
];

const TuitionFees = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [tuitionHistory, setTuitionHistory] = useState([]);
  const [currentTuition, setCurrentTuition] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);

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
    summaryCard: {
      marginBottom: theme.spacing(3)
    },
    tableContainer: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    formControl: {
      minWidth: 200,
      marginBottom: theme.spacing(3)
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(2)
    },
    chipPaid: {
      backgroundColor: theme.palette.success.main,
      color: theme.palette.success.contrastText
    },
    chipPending: {
      backgroundColor: theme.palette.warning.main,
      color: theme.palette.warning.contrastText
    },
    chipOverdue: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText
    }
  };

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setTuitionHistory(tuitionData);
    setCurrentTuition(tuitionData[0]);
    
    // Calculate totals
    const paid = tuitionData.reduce((sum, item) => sum + item.paidAmount, 0);
    const remaining = tuitionData.reduce((sum, item) => sum + item.remainingAmount, 0);
    
    setTotalPaid(paid);
    setTotalRemaining(remaining);
  }, []);

  const handleSemesterChange = (event) => {
    const selected = event.target.value;
    setSelectedSemester(selected);
    
    if (selected) {
      const selectedTuition = tuitionHistory.find(item => item.semester === selected);
      setCurrentTuition(selectedTuition);
    } else {
      setCurrentTuition(tuitionHistory[0]);
    }
  };

  const handlePrint = () => {
    // This would print the tuition details in a real application
    window.print();
  };

  const handleDownload = () => {
    // This would download a PDF of tuition details in a real application
    alert('Downloading tuition details as PDF...');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusChipColor = (status) => {
    if (status === 'Đã thanh toán') return 'success';
    if (status === 'Thanh toán một phần') return 'warning';
    if (status === 'Chưa thanh toán') return 'error';
    return 'default';
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Xem học phí
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem thông tin học phí theo từng học kỳ
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Card sx={styles.summaryCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tóm tắt học phí
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body1">
                  <strong>Tổng học phí đã đóng:</strong> {formatCurrency(totalPaid)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body1">
                  <strong>Học phí còn nợ:</strong> {formatCurrency(totalRemaining)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body1">
                  <strong>Tổng học phí:</strong> {formatCurrency(totalPaid + totalRemaining)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <FormControl sx={styles.formControl}>
          <InputLabel>Chọn học kỳ</InputLabel>
          <Select
            value={selectedSemester}
            onChange={handleSemesterChange}
            label="Chọn học kỳ"
          >
            <MenuItem value="">
              <em>Học kỳ hiện tại</em>
            </MenuItem>
            {tuitionHistory.map((item) => (
              <MenuItem key={item.id} value={item.semester}>
                {item.semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentTuition && (
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Học kỳ:</strong> {currentTuition.semester}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Trạng thái:</strong> 
                    <Chip 
                      label={currentTuition.status}
                      color={getStatusChipColor(currentTuition.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Hạn thanh toán:</strong> {currentTuition.dueDate}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
              </Grid>

              <TableContainer sx={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mô tả</TableCell>
                      <TableCell align="right">Số tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Học phí cơ bản</TableCell>
                      <TableCell align="right">{formatCurrency(currentTuition.tuitionFee)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Các khoản phí khác</TableCell>
                      <TableCell align="right">{formatCurrency(currentTuition.otherFees)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Tổng cộng</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(currentTuition.totalAmount)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Đã thanh toán</TableCell>
                      <TableCell align="right">{formatCurrency(currentTuition.paidAmount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Số tiền còn lại</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(currentTuition.remainingAmount)}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={styles.buttonGroup}>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrint}
                >
                  In thông tin
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={handleDownload}
                >
                  Tải PDF
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>
    </div>
  );
};

export default TuitionFees; 