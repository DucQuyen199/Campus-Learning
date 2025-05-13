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
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const RetakeRegistration = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState(null);

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

  // Sample data - would come from API in a real application
  const sampleCourses = [
    {
      id: 1,
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      credits: 3,
      previousGrade: 'D',
      semester: 'Spring 2023',
      status: 'Available'
    },
    {
      id: 2,
      courseCode: 'MATH201',
      courseName: 'Calculus II',
      credits: 4,
      previousGrade: 'D+',
      semester: 'Fall 2022',
      status: 'Available'
    },
    {
      id: 3,
      courseCode: 'PHY102',
      courseName: 'Physics for Engineers',
      credits: 4,
      previousGrade: 'C-',
      semester: 'Fall 2022',
      status: 'Available'
    },
    {
      id: 4,
      courseCode: 'ENG203',
      courseName: 'Technical Writing',
      credits: 3,
      previousGrade: 'C',
      semester: 'Spring 2023',
      status: 'Not Available'
    }
  ];

  useEffect(() => {
    // In a real application, this would fetch data from an API
    setAvailableCourses(sampleCourses);
  }, []);

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

  const handleRegistration = () => {
    // This would send registration data to an API
    if (selectedCourses.length > 0 && selectedSemester) {
      setRegistrationStatus({
        type: 'success',
        message: 'Đăng ký học lại thành công cho các khóa học đã chọn.'
      });
    } else {
      setRegistrationStatus({
        type: 'error',
        message: 'Vui lòng chọn khóa học và học kỳ trước khi đăng ký.'
      });
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
                <MenuItem value="HK1-23-24">Học kỳ 1 - 2023/2024</MenuItem>
                <MenuItem value="HK2-23-24">Học kỳ 2 - 2023/2024</MenuItem>
                <MenuItem value="HK3-23-24">Học kỳ 3 - 2023/2024</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Các môn học có thể đăng ký học lại
            </Typography>
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
          </Grid>

          <Grid item xs={12} sx={styles.buttonGroup}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                disabled={selectedCourses.length === 0 || !selectedSemester}
                onClick={handleRegistration}
              >
                Đăng ký học lại
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default RetakeRegistration; 