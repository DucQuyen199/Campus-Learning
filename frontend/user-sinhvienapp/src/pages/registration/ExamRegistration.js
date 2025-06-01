import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Backdrop,
  Snackbar,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { examRegistrationService } from '../../services/api';

const ExamRegistration = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [selectedExams, setSelectedExams] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [semesterId, setSemesterId] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [feeInfo, setFeeInfo] = useState({
    feePerExam: 200000,
    currency: 'VND',
    notes: []
  });
  const [totalFee, setTotalFee] = useState(0);

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
    tableContainer: {
      marginTop: theme.spacing(3)
    },
    chip: {
      margin: theme.spacing(0.5)
    },
    formControl: {
      minWidth: 200,
      marginRight: theme.spacing(2)
    },
    buttonGroup: {
      marginTop: theme.spacing(3)
    },
    infoSection: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.default
    }
  };

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch active semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setPageLoading(true);
        const data = await examRegistrationService.getActiveSemesters();
        
        if (!data || data.length === 0) {
          setError('Không có học kỳ nào đang mở đăng ký. Vui lòng kiểm tra lại sau.');
          setSemesters([]);
          return;
        }
        
        setSemesters(data);
        
        // Set first semester as default if available
        if (data && data.length > 0) {
          setSemesterId(data[0].SemesterID);
        }
      } catch (err) {
        console.error('Error fetching semesters:', err);
        setError('Không thể tải danh sách học kỳ. Vui lòng thử lại sau.');
        setSemesters([]);
      } finally {
        setPageLoading(false);
      }
    };
    
    const fetchFeeInfo = async () => {
      try {
        const data = await examRegistrationService.getExamFeeInfo();
        if (data) {
          setFeeInfo(data);
        }
      } catch (err) {
        console.error('Error fetching fee info:', err);
        // Keep using default fee info
      }
    };
    
    fetchSemesters();
    fetchFeeInfo();
  }, []);

  // Fetch available exams when semester changes
  useEffect(() => {
    const fetchExams = async () => {
      if (!semesterId || !currentUser?.UserID) return;
      
      try {
        setPageLoading(true);
        const data = await examRegistrationService.getAvailableExams(currentUser.UserID, semesterId);
        setAvailableExams(data);
        // Clear selected exams when semester changes
        setSelectedExams([]);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Không thể tải danh sách môn thi cải thiện. Vui lòng thử lại sau.');
        setAvailableExams([]);
      } finally {
        setPageLoading(false);
      }
    };
    
    fetchExams();
  }, [semesterId, currentUser]);

  // Calculate total fee
  useEffect(() => {
    const fee = selectedExams.length * (feeInfo?.feePerExam || 200000);
    setTotalFee(fee);
  }, [selectedExams, feeInfo]);

  const handleExamSelect = (examId) => {
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter(id => id !== examId));
    } else {
      setSelectedExams([...selectedExams, examId]);
    }
  };

  const handleSemesterChange = (event) => {
    setSemesterId(event.target.value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRegistration = async () => {
    if (selectedExams.length === 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn ít nhất một môn thi cải thiện trước khi đăng ký.',
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await examRegistrationService.registerForExams(
        currentUser.UserID,
        selectedExams,
        semesterId
      );
      
      setSnackbar({
        open: true,
        message: 'Đăng ký thi cải thiện thành công cho các môn học đã chọn.',
        severity: 'success'
      });
      
      // Clear selected exams and refresh available exams
      setSelectedExams([]);
      
      // Refresh available exams
      const updatedExams = await examRegistrationService.getAvailableExams(currentUser.UserID, semesterId);
      setAvailableExams(updatedExams);
      
    } catch (err) {
      console.error('Error registering for exams:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể đăng ký thi cải thiện. Vui lòng thử lại sau.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Loading state
  if (pageLoading) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
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
            Đăng ký thi cải thiện
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Đăng ký thi cải thiện điểm các môn học đã đạt điểm C trở lên
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Box sx={styles.infoSection}>
          <Typography variant="body1" gutterBottom>
            <strong>Thông tin quan trọng:</strong>
          </Typography>
          <Typography variant="body2" component="ul">
            <li>Chi phí đăng ký mỗi môn thi cải thiện: {formatCurrency(feeInfo?.feePerExam || 200000)}</li>
            {feeInfo.notes && feeInfo.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
            {feeInfo.paymentDeadline && (
              <li>Thời hạn thanh toán: {feeInfo.paymentDeadline} ngày sau khi đăng ký</li>
            )}
            {feeInfo.refundPolicy && (
              <li>Chính sách hoàn tiền: {feeInfo.refundPolicy}</li>
            )}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Chọn học kỳ
            </Typography>
            <FormControl sx={styles.formControl}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={semesterId}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                {semesters.length > 0 ? (
                  semesters.map(semester => (
                    <MenuItem key={semester.SemesterID} value={semester.SemesterID}>
                      {semester.SemesterName} - {semester.AcademicYear}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    Không có học kỳ nào đang mở đăng ký
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Các môn học có thể đăng ký thi cải thiện
            </Typography>
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Mã môn học</TableCell>
                    <TableCell>Tên môn học</TableCell>
                    <TableCell align="center">Tín chỉ</TableCell>
                    <TableCell align="center">Điểm hiện tại</TableCell>
                    <TableCell align="center">Ngày thi</TableCell>
                    <TableCell align="center">Giờ thi</TableCell>
                    <TableCell align="center">Phòng thi</TableCell>
                    <TableCell align="center">Lệ phí</TableCell>
                    <TableCell>Tình trạng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableExams.map((exam) => (
                    <TableRow 
                      key={exam.ExamID}
                      hover
                      onClick={() => exam.RegistrationStatus === 'Available' && handleExamSelect(exam.ExamID)}
                      selected={selectedExams.includes(exam.ExamID)}
                      disabled={exam.RegistrationStatus !== 'Available'}
                      sx={{
                        cursor: exam.RegistrationStatus === 'Available' ? 'pointer' : 'default',
                        opacity: exam.RegistrationStatus !== 'Available' ? 0.7 : 1
                      }}
                    >
                      <TableCell padding="checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedExams.includes(exam.ExamID)}
                          disabled={exam.RegistrationStatus !== 'Available'}
                          onChange={() => {}}
                        />
                      </TableCell>
                      <TableCell>{exam.SubjectCode}</TableCell>
                      <TableCell>{exam.SubjectName}</TableCell>
                      <TableCell align="center">{exam.Credits}</TableCell>
                      <TableCell align="center">{exam.CurrentGrade}</TableCell>
                      <TableCell align="center">
                        {exam.ExamDate ? new Date(exam.ExamDate).toLocaleDateString('vi-VN') : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        {exam.StartTime && exam.EndTime ? 
                          `${exam.StartTime.substring(0, 5)} - ${exam.EndTime.substring(0, 5)}` : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell align="center">{exam.ExamRoom || 'N/A'}</TableCell>
                      <TableCell align="center">{formatCurrency(exam.Fee)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            exam.RegistrationStatus === 'Available' ? 'Có thể đăng ký' :
                            exam.RegistrationStatus === 'Already Registered' ? 'Đã đăng ký' :
                            exam.RegistrationStatus === 'Not Available' ? 'Không thể đăng ký' :
                            'Không đủ điều kiện'
                          } 
                          color={
                            exam.RegistrationStatus === 'Available' ? 'success' :
                            exam.RegistrationStatus === 'Already Registered' ? 'primary' :
                            'default'
                          }
                          size="small"
                          sx={styles.chip}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {availableExams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body1">
                          {error ? 'Đã có lỗi xảy ra.' : 'Không có môn học nào có thể đăng ký thi cải thiện.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6">
                Tổng lệ phí: {formatCurrency(totalFee)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRegistration}
                disabled={selectedExams.length === 0 || loading}
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký thi'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Loading backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default ExamRegistration; 