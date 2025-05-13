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
  TextField,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

// Sample data - would come from API in a real application
const sampleExams = [
  {
    id: 1,
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    credits: 3,
    currentGrade: 'C+',
    maxGrade: 'A',
    examDate: '12/15/2023',
    examTime: '09:00 - 11:00',
    examRoom: 'A301',
    status: 'Available',
    fee: 200000
  },
  {
    id: 2,
    courseCode: 'MATH201',
    courseName: 'Calculus II',
    credits: 4,
    currentGrade: 'B-',
    maxGrade: 'A',
    examDate: '12/18/2023',
    examTime: '13:00 - 15:00',
    examRoom: 'B205',
    status: 'Available',
    fee: 200000
  },
  {
    id: 3,
    courseCode: 'PHY102',
    courseName: 'Physics for Engineers',
    credits: 4,
    currentGrade: 'B',
    maxGrade: 'A',
    examDate: '12/20/2023',
    examTime: '09:00 - 11:00',
    examRoom: 'C105',
    status: 'Available',
    fee: 200000
  },
  {
    id: 4,
    courseCode: 'ENG203',
    courseName: 'Technical Writing',
    credits: 3,
    currentGrade: 'B+',
    maxGrade: 'A',
    examDate: '12/22/2023',
    examTime: '13:00 - 15:00',
    examRoom: 'D110',
    status: 'Registration Closed',
    fee: 200000
  }
];

const ExamRegistration = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedExams, setSelectedExams] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [semester, setSemester] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState(null);
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

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setAvailableExams(sampleExams);
  }, []);

  useEffect(() => {
    // Calculate total fee
    const fee = selectedExams.reduce((total, examId) => {
      const exam = availableExams.find(e => e.id === examId);
      return total + (exam ? exam.fee : 0);
    }, 0);
    setTotalFee(fee);
  }, [selectedExams, availableExams]);

  const handleExamSelect = (examId) => {
    if (selectedExams.includes(examId)) {
      setSelectedExams(selectedExams.filter(id => id !== examId));
    } else {
      setSelectedExams([...selectedExams, examId]);
    }
  };

  const handleSemesterChange = (event) => {
    setSemester(event.target.value);
  };

  const handleRegistration = () => {
    // This would send registration data to an API
    if (selectedExams.length > 0) {
      setRegistrationStatus({
        type: 'success',
        message: 'Đăng ký thi cải thiện thành công cho các môn học đã chọn.'
      });
    } else {
      setRegistrationStatus({
        type: 'error',
        message: 'Vui lòng chọn ít nhất một môn thi cải thiện trước khi đăng ký.'
      });
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
            Đăng ký thi cải thiện
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Đăng ký thi cải thiện điểm các môn học đã đạt điểm C trở lên
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {registrationStatus && (
          <Alert 
            severity={registrationStatus.type} 
            sx={{ mb: 3 }}
            onClose={() => setRegistrationStatus(null)}
          >
            {registrationStatus.message}
          </Alert>
        )}

        <Box sx={styles.infoSection}>
          <Typography variant="body1" gutterBottom>
            <strong>Thông tin quan trọng:</strong>
          </Typography>
          <Typography variant="body2" component="ul">
            <li>Chi phí đăng ký mỗi môn thi cải thiện: 200,000 VNĐ/môn</li>
            <li>Điểm thi cải thiện sẽ thay thế điểm hiện tại nếu cao hơn</li>
            <li>Lịch thi cải thiện sẽ được sắp xếp sau khi kết thúc đợt đăng ký</li>
            <li>Thời hạn đăng ký: từ 01/12/2023 đến 10/12/2023</li>
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
                value={semester}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                <MenuItem value="HK1-23-24">Học kỳ 1 - 2023/2024</MenuItem>
                <MenuItem value="HK2-23-24">Học kỳ 2 - 2023/2024</MenuItem>
                <MenuItem value="HK3-23-24">Học kỳ 3 - 2023/2024</MenuItem>
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
                      key={exam.id}
                      hover
                      onClick={() => exam.status === 'Available' && handleExamSelect(exam.id)}
                      selected={selectedExams.includes(exam.id)}
                      disabled={exam.status !== 'Available'}
                      sx={{
                        cursor: exam.status === 'Available' ? 'pointer' : 'default',
                        opacity: exam.status !== 'Available' ? 0.7 : 1
                      }}
                    >
                      <TableCell padding="checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedExams.includes(exam.id)}
                          disabled={exam.status !== 'Available'}
                          onChange={() => {}}
                        />
                      </TableCell>
                      <TableCell>{exam.courseCode}</TableCell>
                      <TableCell>{exam.courseName}</TableCell>
                      <TableCell align="center">{exam.credits}</TableCell>
                      <TableCell align="center">{exam.currentGrade}</TableCell>
                      <TableCell align="center">{exam.examDate}</TableCell>
                      <TableCell align="center">{exam.examTime}</TableCell>
                      <TableCell align="center">{exam.examRoom}</TableCell>
                      <TableCell align="center">{formatCurrency(exam.fee)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={exam.status === 'Available' ? 'Có thể đăng ký' : 'Đã hết hạn'} 
                          color={exam.status === 'Available' ? 'success' : 'default'}
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
                          Không có môn học nào có thể đăng ký thi cải thiện.
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
                disabled={selectedExams.length === 0}
              >
                Đăng ký thi
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default ExamRegistration; 