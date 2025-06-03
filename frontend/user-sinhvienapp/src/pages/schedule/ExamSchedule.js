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

const ExamSchedule = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [currentExams, setCurrentExams] = useState([]);
  const [semesterInfo, setSemesterInfo] = useState(null);
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
    infoCard: {
      marginBottom: theme.spacing(3)
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      height: '200px'
    }
  };

  // Fetch available semesters with exams
  const fetchExamSemesters = async () => {
    try {
      const api = axiosWithTimeout();
      const response = await api.get(`${API_BASE_URL}/exam-schedule/semesters`);
      
      if (response.data.success) {
        setSemesters(response.data.data);
        
        // Find current semester if any
        const currentSemester = response.data.data.find(sem => sem.IsCurrent);
        if (currentSemester) {
          setSelectedSemesterId(currentSemester.SemesterID.toString());
          fetchExamSchedule(currentUser.id, currentSemester.SemesterID);
        } else if (response.data.data.length > 0) {
          // If no current semester, use the first one
          setSelectedSemesterId(response.data.data[0].SemesterID.toString());
          fetchExamSchedule(currentUser.id, response.data.data[0].SemesterID);
        }
      } else {
        throw new Error(response.data.message || 'Failed to get semester data');
      }
    } catch (error) {
      console.error('Error fetching exam semesters:', error);
      setError('Không thể tải dữ liệu học kỳ. Vui lòng thử lại sau.');
    }
  };

  // Fetch exam schedule for a specific semester
  const fetchExamSchedule = async (userId, semesterId) => {
    setLoading(true);
    setError(null);
    
    try {
      const api = axiosWithTimeout();
      const response = await api.get(`${API_BASE_URL}/exam-schedule/${userId}/${semesterId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setCurrentExams(data.exams);
        setSemesterInfo(data.semester);
      } else {
        throw new Error(response.data.message || 'Failed to get exam schedule');
      }
    } catch (error) {
      console.error('Error fetching exam schedule:', error);
      setError('Không thể tải lịch thi. Vui lòng thử lại sau.');
      setCurrentExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchExamSemesters();
    }
  }, [currentUser]);

  const handleSemesterChange = (event) => {
    const semesterId = event.target.value;
    setSelectedSemesterId(semesterId);
    if (semesterId && currentUser) {
      fetchExamSchedule(currentUser.id, semesterId);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple formatted content for download
    const content = generatePrintableContent();
    
    // Create a blob from the content
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary download link and trigger it
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `exam-schedule-${selectedSemesterId}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
  };

  const generatePrintableContent = () => {
    if (!semesterInfo || !currentExams) return '';
    
    let content = `LỊCH THI HỌC KỲ ${semesterInfo.name} ${semesterInfo.academicYear}\n`;
    content += `Sinh viên: ${currentUser.FullName}\n`;
    content += `Mã số sinh viên: ${currentUser.Username}\n\n`;
    content += `Thời gian thi: ${semesterInfo.examPeriod?.start} - ${semesterInfo.examPeriod?.end}\n`;
    content += `Số môn thi: ${currentExams.length}\n\n`;
    content += "DANH SÁCH CÁC MÔN THI\n";
    content += "=======================================================\n";
    
    currentExams.forEach((exam, index) => {
      content += `${index + 1}. ${exam.courseName} (${exam.courseCode})\n`;
      content += `   Ngày thi: ${exam.examDate}\n`;
      content += `   Giờ thi: ${exam.examTime}\n`;
      content += `   Phòng thi: ${exam.examRoom}\n`;
      content += `   Số báo danh: ${exam.seatNumber}\n`;
      content += `   Loại thi: ${exam.examType}\n`;
      content += "-------------------------------------------------------\n";
    });
    
    return content;
  };

  // If loading, show loading spinner
  if (loading) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box sx={styles.titleSection}>
            <Typography variant="h4" gutterBottom>
              Lịch thi
            </Typography>
          </Box>
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Đang tải dữ liệu lịch thi...
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
              Lịch thi
            </Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Alert severity="error">{error}</Alert>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => fetchExamSemesters()}
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
            Lịch thi
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem lịch thi của các kỳ thi hiện tại và trước đây
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <FormControl sx={styles.formControl}>
          <InputLabel>Học kỳ</InputLabel>
          <Select
            value={selectedSemesterId}
            onChange={handleSemesterChange}
            label="Học kỳ"
          >
            {semesters.map((semester) => (
              <MenuItem key={semester.SemesterID} value={semester.SemesterID.toString()}>
                {semester.SemesterName} {semester.AcademicYear} {semester.IsCurrent ? "(Hiện tại)" : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {semesterInfo && (
          <Card sx={styles.infoCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin kỳ thi {semesterInfo.name} {semesterInfo.academicYear}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Thời gian thi:</strong> {semesterInfo.examPeriod?.start} - {semesterInfo.examPeriod?.end}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Số môn thi:</strong> {currentExams.length}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="error">
                    <strong>Lưu ý:</strong> Sinh viên cần có mặt tại phòng thi trước giờ thi ít nhất 15 phút và mang theo thẻ sinh viên.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {currentExams.length > 0 ? (
          <>
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã môn học</TableCell>
                    <TableCell>Tên môn học</TableCell>
                    <TableCell>Ngày thi</TableCell>
                    <TableCell>Giờ thi</TableCell>
                    <TableCell>Phòng thi</TableCell>
                    <TableCell>Loại thi</TableCell>
                    <TableCell>Số báo danh</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>{exam.courseCode}</TableCell>
                      <TableCell>{exam.courseName}</TableCell>
                      <TableCell>{exam.examDate}</TableCell>
                      <TableCell>{exam.examTime}</TableCell>
                      <TableCell>{exam.examRoom}</TableCell>
                      <TableCell>{exam.examType}</TableCell>
                      <TableCell>{exam.seatNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={styles.buttonGroup}>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={handlePrint}
              >
                In lịch thi
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleDownload}
              >
                Tải lịch thi
              </Button>
            </Box>
          </>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center">
                Không có lịch thi cho học kỳ này.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>
    </div>
  );
};

export default ExamSchedule; 