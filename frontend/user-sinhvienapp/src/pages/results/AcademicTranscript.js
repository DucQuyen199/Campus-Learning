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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Print, GetApp } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Set up axios with timeout
const axiosWithTimeout = (timeout = 15000) => {
  const instance = axios.create({
    timeout: timeout
  });
  
  // Add JWT token to all requests
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  return instance;
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AcademicTranscript = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [currentCourses, setCurrentCourses] = useState([]);
  const [semesterGPA, setSemesterGPA] = useState(0);
  const [cumulativeGPA, setCumulativeGPA] = useState(0);
  const [semesters, setSemesters] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gradeBySemester, setGradeBySemester] = useState({});
  const [semesterGPAs, setSemesterGPAs] = useState({});

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
    formControl: {
      minWidth: 200,
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(3)
    },
    tableContainer: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(2),
      marginTop: theme.spacing(2)
    },
    summaryCard: {
      marginBottom: theme.spacing(3)
    },
    tabs: {
      marginBottom: theme.spacing(2)
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      height: '200px'
    }
  };

  // Fetch all academic data
  const fetchAcademicData = async () => {
    if (!currentUser || !currentUser.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const api = axiosWithTimeout();
      const response = await api.get(`${API_BASE_URL}/academic-transcript/${currentUser.id}/all`);
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Set summary info
        setSummary(data.summary);
        setCumulativeGPA(data.summary.overallGPA);
        
        // Set semesters
        const allSemesters = [
          { SemesterID: 'all', SemesterName: 'Tất cả học kỳ', AcademicYear: '' },
          ...data.semesters
        ];
        setSemesters(allSemesters);
        
        // Set grades organized by semester
        setGradeBySemester(data.gradeBySemester);
        
        // Set semester GPAs
        setSemesterGPAs(data.semesterGPAs);
        
        // Default to showing all courses
        setCurrentCourses(data.courses);
        
      } else {
        throw new Error(response.data.message || 'Failed to get academic data');
      }
    } catch (error) {
      console.error('Error fetching academic data:', error);
      setError('Không thể tải dữ liệu học tập. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch specific semester
  const fetchSemesterGrades = async (semesterId) => {
    if (!currentUser || !currentUser.id || !semesterId || semesterId === 'all') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const api = axiosWithTimeout();
      const response = await api.get(`${API_BASE_URL}/academic-transcript/${currentUser.id}/${semesterId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setCurrentCourses(data.courses);
        setSemesterGPA(data.gpa);
      } else {
        throw new Error(response.data.message || 'Failed to get semester grades');
      }
    } catch (error) {
      console.error('Error fetching semester grades:', error);
      setError('Không thể tải điểm học kỳ. Vui lòng thử lại sau.');
      setCurrentCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchAcademicData();
    }
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSemesterChange = (event) => {
    const semesterId = event.target.value;
    setSelectedSemester(semesterId);
    
    if (semesterId === 'all') {
      // Show all courses
      setCurrentCourses(Object.values(gradeBySemester).flat());
      setSemesterGPA(0); // No semester-specific GPA when showing all
    } else {
      // Fetch specific semester grades
      const semesterObj = semesters.find(s => s.SemesterID.toString() === semesterId);
      
      if (semesterObj && gradeBySemester[semesterObj.SemesterCode]) {
        // Use cached data if available
        setCurrentCourses(gradeBySemester[semesterObj.SemesterCode]);
        setSemesterGPA(semesterGPAs[semesterObj.SemesterCode] || 0);
      } else {
        // Fetch from server if not in cache
        fetchSemesterGrades(semesterId);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple formatted content for download
    const content = generateTranscriptContent();
    
    // Create a blob from the content
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary download link and trigger it
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `academic-transcript-${currentUser?.Username || 'student'}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
  };
  
  const generateTranscriptContent = () => {
    if (!summary) return '';
    
    let content = `BẢNG ĐIỂM HỌC TẬP\n`;
    content += `=======================================================\n\n`;
    content += `Mã SV: ${summary.studentId}\n`;
    content += `Họ tên: ${summary.name}\n`;
    content += `Ngành: ${summary.major}\n`;
    content += `Khoa: ${summary.faculty}\n`;
    content += `Chương trình: ${summary.program}\n`;
    content += `Khóa: ${summary.enrollmentYear}\n\n`;
    
    content += `Điểm trung bình tích lũy: ${formatGPA(summary.overallGPA)}\n`;
    content += `Số tín chỉ đã hoàn thành: ${summary.completedCredits}\n`;
    content += `Số tín chỉ yêu cầu: ${summary.requiredCredits}\n`;
    content += `Dự kiến tốt nghiệp: ${summary.expectedGraduation}\n\n`;
    
    if (selectedSemester === 'all') {
      content += `KẾT QUẢ TẤT CẢ HỌC KỲ\n`;
      content += `=======================================================\n`;
      
      // Group by semester
      semesters.forEach(semester => {
        if (semester.SemesterID === 'all') return;
        
        const semesterCourses = gradeBySemester[semester.SemesterCode] || [];
        if (semesterCourses.length === 0) return;
        
        content += `\n${semester.SemesterName} ${semester.AcademicYear}\n`;
        content += `-------------------------------------------------------\n`;
        content += `Mã môn học | Tên môn học | Tín chỉ | Điểm chữ | Điểm số\n`;
        
        semesterCourses.forEach(course => {
          content += `${course.courseCode} | ${course.courseName} | ${course.credits} | ${course.grade} | ${course.points.toFixed(1)}\n`;
        });
        
        content += `GPA Học kỳ: ${formatGPA(semesterGPAs[semester.SemesterCode] || 0)}\n`;
      });
    } else {
      const semesterObj = semesters.find(s => s.SemesterID.toString() === selectedSemester);
      if (semesterObj) {
        content += `KẾT QUẢ HỌC KỲ: ${semesterObj.SemesterName} ${semesterObj.AcademicYear}\n`;
        content += `=======================================================\n`;
        content += `Mã môn học | Tên môn học | Tín chỉ | Điểm chữ | Điểm số\n`;
        
        currentCourses.forEach(course => {
          content += `${course.courseCode} | ${course.courseName} | ${course.credits} | ${course.grade} | ${course.points.toFixed(1)}\n`;
        });
        
        content += `GPA Học kỳ: ${formatGPA(semesterGPA)}\n`;
      }
    }
    
    return content;
  };

  const formatGPA = (gpa) => {
    return gpa ? gpa.toFixed(2) : '0.00';
  };
  
  // If loading, show loading spinner
  if (loading) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Bảng điểm
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Đang tải dữ liệu học tập...
            </Typography>
          </Box>
        </Paper>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Bảng điểm
            </Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Alert severity="error">{error}</Alert>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchAcademicData}
              sx={{ mt: 2 }}
            >
              Thử lại
            </Button>
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
            Bảng điểm
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem điểm học tập và bảng điểm chi tiết
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {summary && (
          <Card sx={styles.summaryCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin sinh viên
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body1">
                    <strong>Mã SV:</strong> {summary.studentId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body1">
                    <strong>Họ tên:</strong> {summary.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body1">
                    <strong>Ngành:</strong> {summary.major}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body1">
                    <strong>Khoa:</strong> {summary.faculty}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body1">
                    <strong>Chương trình:</strong> {summary.program}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body1">
                    <strong>Khóa:</strong> {summary.enrollmentYear}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {summary && (
          <Card sx={styles.summaryCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tổng quan học tập
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body1">
                    <strong>Điểm trung bình tích lũy:</strong> {formatGPA(summary.overallGPA)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body1">
                    <strong>Số tín chỉ đã hoàn thành:</strong> {summary.completedCredits}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body1">
                    <strong>Số tín chỉ yêu cầu:</strong> {summary.requiredCredits}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body1">
                    <strong>Dự kiến tốt nghiệp:</strong> {summary.expectedGraduation}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <FormControl sx={styles.formControl}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={selectedSemester}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester.SemesterID} value={semester.SemesterID.toString()}>
                    {semester.SemesterID === 'all' 
                      ? 'Tất cả học kỳ' 
                      : `${semester.SemesterName} ${semester.AcademicYear}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            {selectedSemester !== 'all' && (
              <Typography variant="body1">
                <strong>GPA học kỳ:</strong> {formatGPA(semesterGPA)}
              </Typography>
            )}
          </Grid>
        </Grid>

        <Tabs value={tabValue} onChange={handleTabChange} sx={styles.tabs}>
          <Tab label="Bảng điểm chi tiết" />
          <Tab label="Biểu đồ học tập" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper} sx={styles.tableContainer}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã môn học</TableCell>
                  <TableCell>Tên môn học</TableCell>
                  <TableCell align="center">Tín chỉ</TableCell>
                  <TableCell align="center">Điểm chữ</TableCell>
                  <TableCell align="center">Điểm số</TableCell>
                  {selectedSemester === 'all' && <TableCell>Học kỳ</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell align="center">{course.credits}</TableCell>
                    <TableCell align="center">{course.grade}</TableCell>
                    <TableCell align="center">{course.points && course.points.toFixed(1)}</TableCell>
                    {selectedSemester === 'all' && (
                      <TableCell>
                        {course.SemesterName} {course.AcademicYear}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {currentCourses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={selectedSemester === 'all' ? 6 : 5} align="center">
                      <Typography variant="body1">
                        Không có dữ liệu điểm cho học kỳ này.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={styles.buttonGroup}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              In bảng điểm
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={handleDownload}
            >
              Tải xuống
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1" align="center">
            Biểu đồ học tập đang được phát triển. 
            Tính năng này sẽ hiển thị biểu đồ điểm số và tiến trình học tập của bạn.
          </Typography>
        </TabPanel>
      </Paper>
    </div>
  );
};

export default AcademicTranscript; 