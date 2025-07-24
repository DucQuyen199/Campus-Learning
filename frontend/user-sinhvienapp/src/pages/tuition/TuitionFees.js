/*-----------------------------------------------------------------
* File: TuitionFees.js
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
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Print, GetApp } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Timeout for axios requests
const axiosWithTimeout = (timeout = 15000) => {
  const instance = axios.create({
    timeout: timeout
  });
  return instance;
};

const TuitionFees = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [tuitionHistory, setTuitionHistory] = useState([]);
  const [currentTuition, setCurrentTuition] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      height: '200px'
    }
  };

  const fetchTuitionData = async () => {
    if (!currentUser || !currentUser.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const api = axiosWithTimeout();
      
      // Get tuition history for current user
      const response = await api.get(`${API_BASE_URL}/tuition/history/${currentUser.id}`);
      
      if (response.data.success) {
        const tuitionData = response.data.data;
        
        // Sort by semester (newest first)
        tuitionData.sort((a, b) => {
          // Assuming SemesterID is incremental with newer semesters having higher IDs
          return b.SemesterID - a.SemesterID;
        });
        
        setTuitionHistory(tuitionData);
        
        // Select current semester (most recent) by default
        if (tuitionData.length > 0) {
          setCurrentTuition(tuitionData[0]);
          setSelectedSemester(tuitionData[0].SemesterID.toString());
        }
        
        // Calculate totals
        const paid = tuitionData.reduce((sum, item) => sum + (item.PaidAmount || 0), 0);
        const remaining = tuitionData.reduce((sum, item) => sum + (item.RemainingAmount || 0), 0);
        
        setTotalPaid(paid);
        setTotalRemaining(remaining);
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

  const handleSemesterChange = (event) => {
    const selected = event.target.value;
    setSelectedSemester(selected);
    
    if (selected) {
      const selectedTuition = tuitionHistory.find(item => item.SemesterID.toString() === selected);
      setCurrentTuition(selectedTuition);
    } else {
      setCurrentTuition(tuitionHistory[0]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate PDF receipt content
    const receiptContent = generateReceiptContent(currentTuition);
    
    // Create a blob from the receipt content
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary download link and trigger it
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `tuition-receipt-${currentTuition.SemesterCode}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
  };
  
  const generateReceiptContent = (tuition) => {
    // Format the receipt content
    return `
=======================================================
              THÔNG TIN HỌC PHÍ
=======================================================

Mã số sinh viên: ${currentUser.Username}
Họ và tên: ${currentUser.FullName}
Học kỳ: ${tuition.SemesterName} ${tuition.AcademicYear}
Ngày in: ${new Date().toLocaleDateString('vi-VN')}

-------------------------------------------------------
Chi tiết học phí:
-------------------------------------------------------
Học phí cơ bản: ${formatCurrency(tuition.TuitionFee)}
Các khoản phí khác: ${formatCurrency(tuition.OtherFees || 0)}
Tổng cộng: ${formatCurrency(tuition.TotalAmount)}

Đã thanh toán: ${formatCurrency(tuition.PaidAmount)}
Số tiền còn lại: ${formatCurrency(tuition.RemainingAmount)}

Hạn thanh toán: ${formatDate(tuition.DueDate)}
Trạng thái: ${getTuitionStatusText(tuition)}

=======================================================
Đây là thông tin học phí chính thức từ nhà trường.
Liên hệ phòng Tài chính - Kế toán nếu có thắc mắc.
=======================================================
    `;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('vi-VN');
  };
  
  const getTuitionStatusText = (tuition) => {
    if (!tuition) return '';
    if (tuition.Status === 'Paid') return 'Đã thanh toán';
    if (tuition.Status === 'Partial') return 'Thanh toán một phần';
    if (tuition.Status === 'Unpaid') return 'Chưa thanh toán';
    if (tuition.Status === 'Overdue') return 'Quá hạn';
    if (tuition.Status === 'Waived') return 'Được miễn giảm';
    return tuition.Status;
  };

  const getStatusChipColor = (status) => {
    if (status === 'Paid') return 'success';
    if (status === 'Partial') return 'warning';
    if (status === 'Unpaid') return 'default';
    if (status === 'Overdue') return 'error';
    if (status === 'Waived') return 'info';
    return 'default';
  };

  // If there's a loading error, show error message with retry button
  if (error) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Xem học phí
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
              Xem học phí
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" sx={{ marginTop: theme.spacing(2) }}>
              Đang tải dữ liệu học phí...
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
            {tuitionHistory.map((item) => (
              <MenuItem key={item.SemesterID} value={item.SemesterID.toString()}>
                {item.SemesterName} {item.AcademicYear}
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
                    <strong>Học kỳ:</strong> {currentTuition.SemesterName} {currentTuition.AcademicYear}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Trạng thái:</strong> 
                    <Chip 
                      label={getTuitionStatusText(currentTuition)}
                      color={getStatusChipColor(currentTuition.Status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Hạn thanh toán:</strong> {formatDate(currentTuition.DueDate)}
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
                      <TableCell align="right">{formatCurrency(currentTuition.TuitionFee)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Các khoản phí khác</TableCell>
                      <TableCell align="right">{formatCurrency(currentTuition.OtherFees || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Tổng cộng</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(currentTuition.TotalAmount)}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Đã thanh toán</TableCell>
                      <TableCell align="right">{formatCurrency(currentTuition.PaidAmount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Số tiền còn lại</strong></TableCell>
                      <TableCell align="right"><strong>{formatCurrency(currentTuition.RemainingAmount)}</strong></TableCell>
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
                <Button
                  variant="contained"
                  color="primary"
                  href={`/tuition/payment/${currentTuition.TuitionID}`}
                  disabled={currentTuition.RemainingAmount <= 0}
                >
                  Thanh toán học phí
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
