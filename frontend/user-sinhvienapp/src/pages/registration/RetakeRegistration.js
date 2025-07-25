/*-----------------------------------------------------------------
* File: RetakeRegistration.js
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
  useTheme,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const RetakeRegistration = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classOptions, setClassOptions] = useState({});

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
    }
  };

  // Fetch available semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/academic/semesters`);
        if (response.data.success) {
          const currentSemesters = response.data.data.filter(sem => sem.IsCurrent || sem.Status === 'Upcoming');
          setSemesters(currentSemesters);
          
          // Set default semester if available
          if (currentSemesters.length > 0) {
            setSelectedSemester(currentSemesters[0].SemesterID.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching semesters:', error);
        setRegistrationStatus({
          type: 'error',
          message: 'Không thể tải danh sách học kỳ.'
        });
      }
    };
    
    fetchSemesters();
  }, []);

  // Fetch retakeable courses
  useEffect(() => {
    const fetchRetakeableCourses = async () => {
      if (!currentUser?.id) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/academic/retakeable-courses/${currentUser.id}`);
        if (response.data.success) {
          setAvailableCourses(response.data.data);
          
          // Build class options map
          const options = {};
          response.data.data.forEach(course => {
            if (course.classOptions && course.classOptions.length > 0) {
              options[course.id] = course.classOptions;
            }
          });
          setClassOptions(options);
        }
      } catch (error) {
        console.error('Error fetching retakeable courses:', error);
        setRegistrationStatus({
          type: 'error',
          message: 'Không thể tải danh sách môn học có thể đăng ký học lại.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRetakeableCourses();
  }, [currentUser]);

  const handleCourseSelect = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
  };

  const handleRegistration = async () => {
    if (selectedCourses.length === 0 || !selectedSemester) {
      setRegistrationStatus({
        type: 'error',
        message: 'Vui lòng chọn ít nhất một môn học và học kỳ trước khi đăng ký.'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Register each selected course
      const registrationPromises = selectedCourses.map(async (courseId) => {
        const course = availableCourses.find(c => c.id === courseId);
        // Use the first available class option
        if (!course.classOptions || course.classOptions.length === 0) {
          throw new Error(`Không có lớp học nào khả dụng cho môn ${course.courseName}`);
        }
        
        const classId = course.classOptions[0].ClassID;
        
        return axios.post(`${API_BASE_URL}/academic/register-course`, {
          userId: currentUser.id,
          classId: classId,
          registrationType: 'Retake'
        });
      });
      
      // Wait for all registrations to complete
      await Promise.all(registrationPromises);
      
      // Success
      setRegistrationStatus({
        type: 'success',
        message: 'Đăng ký học lại thành công cho các khóa học đã chọn.'
      });
      
      // Clear selection
      setSelectedCourses([]);
      
    } catch (error) {
      console.error('Error registering for retake courses:', error);
      setRegistrationStatus({
        type: 'error',
        message: error.response?.data?.message || 'Đăng ký học lại thất bại. Vui lòng thử lại sau.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Đăng ký học lại & cải thiện
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Đăng ký học lại các môn học có điểm dưới C hoặc cải thiện điểm các môn học trước đây
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

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Chọn học kỳ
            </Typography>
            <FormControl sx={styles.formControl}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={selectedSemester}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                {semesters.map(semester => (
                  <MenuItem key={semester.SemesterID} value={semester.SemesterID.toString()}>
                    {semester.SemesterName} - {semester.AcademicYear}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Các môn học có thể đăng ký học lại
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : availableCourses.length === 0 ? (
              <Alert severity="info">
                Bạn không có môn học nào cần đăng ký học lại.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Mã môn học</TableCell>
                      <TableCell>Tên môn học</TableCell>
                      <TableCell align="center">Tín chỉ</TableCell>
                      <TableCell align="center">Điểm trước</TableCell>
                      <TableCell>Học kỳ đã học</TableCell>
                      <TableCell>Tình trạng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableCourses.map((course) => (
                      <TableRow 
                        key={course.id}
                        hover
                        onClick={() => course.status === 'Available' && handleCourseSelect(course.id)}
                        selected={selectedCourses.includes(course.id)}
                        disabled={course.status !== 'Available'}
                        sx={{
                          cursor: course.status === 'Available' ? 'pointer' : 'default',
                          opacity: course.status === 'Available' ? 1 : 0.6
                        }}
                      >
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            disabled={course.status !== 'Available'}
                            onChange={() => {}}
                          />
                        </TableCell>
                        <TableCell>{course.courseCode}</TableCell>
                        <TableCell>{course.courseName}</TableCell>
                        <TableCell align="center">{course.credits}</TableCell>
                        <TableCell align="center">{course.previousGrade}</TableCell>
                        <TableCell>{course.semester}</TableCell>
                        <TableCell>
                          <Chip
                            label={course.status}
                            color={course.status === 'Available' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>

          <Grid item xs={12} sx={styles.buttonGroup}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                disabled={selectedCourses.length === 0 || !selectedSemester || loading}
                onClick={handleRegistration}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng ký học lại'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default RetakeRegistration; 
