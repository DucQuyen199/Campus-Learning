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
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { BookmarkRemove, Print, Download } from '@mui/icons-material';

// Sample data - would come from API in a real application
const sampleRegisteredCourses = [
  {
    id: 1,
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    section: '01',
    credits: 3,
    dayOfWeek: 'Monday, Wednesday',
    timeSlot: '09:00 - 10:30',
    classroom: 'A301',
    instructor: 'Dr. John Smith',
    status: 'Confirmed',
    canCancel: true
  },
  {
    id: 2,
    courseCode: 'MATH201',
    courseName: 'Calculus II',
    section: '02',
    credits: 4,
    dayOfWeek: 'Tuesday, Thursday',
    timeSlot: '10:30 - 12:00',
    classroom: 'B205',
    instructor: 'Dr. Jane Doe',
    status: 'Confirmed',
    canCancel: true
  },
  {
    id: 3,
    courseCode: 'PHY102',
    courseName: 'Physics for Engineers',
    section: '03',
    credits: 4,
    dayOfWeek: 'Monday, Wednesday, Friday',
    timeSlot: '13:00 - 14:00',
    classroom: 'C105',
    instructor: 'Dr. Robert Johnson',
    status: 'Confirmed',
    canCancel: true
  },
  {
    id: 4,
    courseCode: 'ENG203',
    courseName: 'Technical Writing',
    section: '01',
    credits: 3,
    dayOfWeek: 'Friday',
    timeSlot: '15:00 - 18:00',
    classroom: 'D110',
    instructor: 'Prof. Sarah Williams',
    status: 'Waitlisted',
    canCancel: true
  }
];

const RegisteredCourses = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [semester, setSemester] = useState('HK1-23-24');
  const [actionStatus, setActionStatus] = useState(null);
  const [totalCredits, setTotalCredits] = useState(0);

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
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3),
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(2)
    },
    summaryCard: {
      marginBottom: theme.spacing(3)
    },
    cancelButton: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.error.dark
      }
    }
  };

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setRegisteredCourses(sampleRegisteredCourses);
    
    // Calculate total credits
    const credits = sampleRegisteredCourses.reduce((total, course) => {
      return total + course.credits;
    }, 0);
    setTotalCredits(credits);
  }, []);

  const handleSemesterChange = (event) => {
    setSemester(event.target.value);
    // This would typically fetch data for the selected semester from an API
  };

  const handleCancelRegistration = (courseId) => {
    // This would send a request to cancel the registration
    setActionStatus({
      type: 'success',
      message: 'Hủy đăng ký môn học thành công.'
    });
    
    // Update the UI by removing the course
    setRegisteredCourses(registeredCourses.filter(course => course.id !== courseId));
    
    // Recalculate total credits
    const updatedCredits = registeredCourses
      .filter(course => course.id !== courseId)
      .reduce((total, course) => total + course.credits, 0);
    setTotalCredits(updatedCredits);
  };

  const handlePrintSchedule = () => {
    // This would open a print dialog with the schedule
    alert('Printing schedule...');
  };

  const handleDownloadSchedule = () => {
    // This would download the schedule as a PDF or other format
    alert('Downloading schedule...');
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Danh sách lớp học phần đã đăng ký
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem và quản lý danh sách các môn học đã đăng ký trong học kỳ
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {actionStatus && (
          <Alert 
            severity={actionStatus.type} 
            sx={{ mb: 3 }}
            onClose={() => setActionStatus(null)}
          >
            {actionStatus.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
            <Card sx={styles.summaryCard}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tổng quan đăng ký
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body1">
                      <strong>Tổng số môn học:</strong> {registeredCourses.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body1">
                      <strong>Tổng số tín chỉ:</strong> {totalCredits}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body1">
                      <strong>Học kỳ:</strong> {semester === 'HK1-23-24' ? 'Học kỳ 1 - 2023/2024' : 
                                              semester === 'HK2-23-24' ? 'Học kỳ 2 - 2023/2024' : 
                                              'Học kỳ 3 - 2023/2024'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sx={styles.buttonGroup}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrintSchedule}
            >
              In thời khóa biểu
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadSchedule}
            >
              Tải xuống lịch học
            </Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={styles.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã môn học</TableCell>
                <TableCell>Tên môn học</TableCell>
                <TableCell>Nhóm</TableCell>
                <TableCell align="center">Tín chỉ</TableCell>
                <TableCell>Lịch học</TableCell>
                <TableCell>Phòng</TableCell>
                <TableCell>Giảng viên</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registeredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.courseCode}</TableCell>
                  <TableCell>{course.courseName}</TableCell>
                  <TableCell>{course.section}</TableCell>
                  <TableCell align="center">{course.credits}</TableCell>
                  <TableCell>
                    <div>{course.dayOfWeek}</div>
                    <div>{course.timeSlot}</div>
                  </TableCell>
                  <TableCell>{course.classroom}</TableCell>
                  <TableCell>{course.instructor}</TableCell>
                  <TableCell>
                    <Chip 
                      label={course.status === 'Confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'} 
                      color={course.status === 'Confirmed' ? 'success' : 'warning'}
                      size="small"
                      sx={styles.chip}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {course.canCancel && (
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        startIcon={<BookmarkRemove />}
                        onClick={() => handleCancelRegistration(course.id)}
                      >
                        Hủy
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {registeredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body1">
                      Không có môn học nào được đăng ký trong học kỳ này.
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

export default RegisteredCourses; 