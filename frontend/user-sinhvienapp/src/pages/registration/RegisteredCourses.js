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
  useTheme,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { BookmarkRemove, Print, Download } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

const RegisteredCourses = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [semester, setSemester] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [actionStatus, setActionStatus] = useState(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [semestersLoading, setSemestersLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

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
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing(5)
    }
  };

  // Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      setSemestersLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/course-registration/semesters`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          setSemesters(response.data.semesters);
          
          // Get current semester
          const currentResponse = await axios.get(`${API_BASE_URL}/course-registration/semesters/current`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (currentResponse.data.success && currentResponse.data.semester) {
            setSemester(currentResponse.data.semester.id.toString());
          } else if (response.data.semesters.length > 0) {
            // Default to first semester if no current semester
            setSemester(response.data.semesters[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching semesters:', error);
        setError('Không thể tải danh sách học kỳ.');
        showAlert('Không thể tải danh sách học kỳ.', 'error');
      } finally {
        setSemestersLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  // Fetch registered courses when semester changes
  useEffect(() => {
    if (semester) {
      fetchRegisteredCourses(semester);
    }
  }, [semester]);

  const fetchRegisteredCourses = async (semesterId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/course-registration/${semesterId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setRegisteredCourses(response.data.courses || []);
        
        // Calculate total credits
        const credits = (response.data.courses || []).reduce((total, course) => {
          return total + course.credits;
        }, 0);
        
        setTotalCredits(credits);
      }
    } catch (error) {
      console.error('Error fetching registered courses:', error);
      setError('Không thể tải danh sách môn học đã đăng ký.');
      showAlert('Không thể tải danh sách môn học đã đăng ký.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (event) => {
    setSemester(event.target.value);
  };

  const handleCancelRegistration = async (courseId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/course-registration/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Update the UI by removing the course
        setRegisteredCourses(registeredCourses.filter(course => course.id !== courseId));
        
        // Recalculate total credits
        const updatedCredits = registeredCourses
          .filter(course => course.id !== courseId)
          .reduce((total, course) => total + course.credits, 0);
        
        setTotalCredits(updatedCredits);
        
        showAlert('Hủy đăng ký môn học thành công.', 'success');
      } else {
        showAlert(response.data.error || 'Không thể hủy đăng ký môn học.', 'error');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      showAlert(error.response?.data?.error || 'Không thể hủy đăng ký môn học.', 'error');
    }
  };

  const handlePrintSchedule = () => {
    // This would open a print dialog with the schedule
    window.print();
  };

  const handleDownloadSchedule = () => {
    // This would download the schedule as a PDF or other format
    alert('Tính năng tải xuống lịch học sẽ sớm được phát triển.');
  };
  
  const showAlert = (message, severity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };
  
  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
  };

  const getSemesterNameById = (id) => {
    const found = semesters.find(s => s.id.toString() === id.toString());
    return found ? `${found.name} - ${found.academicYear}` : 'Không có thông tin';
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
        
        <Snackbar
          open={alertOpen}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>

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
            <FormControl sx={styles.formControl} disabled={semestersLoading}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={semester}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                {semestersLoading ? (
                  <MenuItem value="">
                    <CircularProgress size={24} /> Đang tải...
                  </MenuItem>
                ) : (
                  semesters.map(sem => (
                    <MenuItem key={sem.id} value={sem.id}>
                      {sem.name} - {sem.academicYear}
                    </MenuItem>
                  ))
                )}
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
                      <strong>Học kỳ:</strong> {getSemesterNameById(semester)}
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

        {loading ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : (
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
                {registeredCourses.length > 0 ? registeredCourses.map((course) => (
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
                        label={course.status} 
                        color={course.rawStatus === 'Approved' ? 'success' : 
                               course.rawStatus === 'Pending' ? 'warning' : 
                               'default'}
                        size="small"
                        sx={styles.chip}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {course.canCancel ? (
                        <Button
                          variant="contained"
                          size="small"
                          color="error"
                          startIcon={<BookmarkRemove />}
                          onClick={() => handleCancelRegistration(course.id)}
                        >
                          Hủy
                        </Button>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          Không thể hủy
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
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
        )}
      </Paper>
    </div>
  );
};

export default RegisteredCourses; 