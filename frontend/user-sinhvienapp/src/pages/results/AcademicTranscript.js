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
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Print, GetApp } from '@mui/icons-material';

// Sample academic data
const academicData = {
  studentId: '12345678',
  name: 'Nguyen Van A',
  major: 'Computer Science',
  faculty: 'Faculty of Information Technology',
  program: 'Regular',
  enrollmentYear: '2020',
  expectedGraduation: '2024',
  overallGPA: 3.2,
  completedCredits: 95,
  requiredCredits: 130,
  semesters: ['All', 'HK1-2023-2024', 'HK2-2022-2023', 'HK1-2022-2023', 'HK2-2021-2022', 'HK1-2021-2022', 'HK2-2020-2021', 'HK1-2020-2021'],
  transcriptData: {
    'HK1-2023-2024': [
      { id: 1, courseCode: 'CS401', courseName: 'Advanced Algorithms', credits: 3, grade: 'A-', points: 3.7 },
      { id: 2, courseCode: 'CS450', courseName: 'Machine Learning', credits: 4, grade: 'B+', points: 3.3 }
    ],
    'HK2-2022-2023': [
      { id: 3, courseCode: 'CS301', courseName: 'Software Engineering', credits: 4, grade: 'A', points: 4.0 },
      { id: 4, courseCode: 'CS350', courseName: 'Computer Networks', credits: 3, grade: 'B', points: 3.0 },
      { id: 5, courseCode: 'MATH301', courseName: 'Numerical Methods', credits: 3, grade: 'B+', points: 3.3 }
    ],
    'HK1-2022-2023': [
      { id: 6, courseCode: 'CS201', courseName: 'Data Structures and Algorithms', credits: 4, grade: 'A', points: 4.0 },
      { id: 7, courseCode: 'CS231', courseName: 'Database Systems', credits: 3, grade: 'B+', points: 3.3 },
      { id: 8, courseCode: 'ENG201', courseName: 'Technical Communication', credits: 2, grade: 'A-', points: 3.7 }
    ],
    'HK2-2021-2022': [
      { id: 9, courseCode: 'CS102', courseName: 'Programming Methodology', credits: 4, grade: 'A', points: 4.0 },
      { id: 10, courseCode: 'MATH202', courseName: 'Probability & Statistics', credits: 3, grade: 'B', points: 3.0 },
      { id: 11, courseCode: 'PHY102', courseName: 'Physics for Engineers', credits: 4, grade: 'B-', points: 2.7 }
    ],
    'HK1-2021-2022': [
      { id: 12, courseCode: 'MATH201', courseName: 'Calculus II', credits: 4, grade: 'B', points: 3.0 },
      { id: 13, courseCode: 'CS150', courseName: 'Introduction to Computer Systems', credits: 3, grade: 'A-', points: 3.7 },
      { id: 14, courseCode: 'ENG102', courseName: 'English for Academic Purposes II', credits: 2, grade: 'A', points: 4.0 }
    ],
    'HK2-2020-2021': [
      { id: 15, courseCode: 'MATH101', courseName: 'Calculus I', credits: 4, grade: 'B+', points: 3.3 },
      { id: 16, courseCode: 'PHY101', courseName: 'General Physics', credits: 4, grade: 'B', points: 3.0 },
      { id: 17, courseCode: 'CHE101', courseName: 'General Chemistry', credits: 3, grade: 'C+', points: 2.3 }
    ],
    'HK1-2020-2021': [
      { id: 18, courseCode: 'CS101', courseName: 'Introduction to Computer Science', credits: 3, grade: 'A', points: 4.0 },
      { id: 19, courseCode: 'ENG101', courseName: 'English for Academic Purposes I', credits: 2, grade: 'B+', points: 3.3 },
      { id: 20, courseCode: 'GEN101', courseName: 'Introduction to University Studies', credits: 1, grade: 'A', points: 4.0 }
    ]
  }
};

// Function to get all courses from all semesters
const getAllCourses = () => {
  let allCourses = [];
  Object.keys(academicData.transcriptData).forEach(semester => {
    allCourses = [...allCourses, ...academicData.transcriptData[semester]];
  });
  return allCourses;
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
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [currentCourses, setCurrentCourses] = useState([]);
  const [semesterGPA, setSemesterGPA] = useState(0);
  const [cumulativeGPA, setCumulativeGPA] = useState(0);

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
    }
  };

  useEffect(() => {
    handleSemesterChange({ target: { value: 'All' } });
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSemesterChange = (event) => {
    const semester = event.target.value;
    setSelectedSemester(semester);
    
    let courses = [];
    let gpa = 0;
    
    if (semester === 'All') {
      courses = getAllCourses();
    } else {
      courses = academicData.transcriptData[semester] || [];
    }
    
    setCurrentCourses(courses);
    
    // Calculate semester GPA
    if (courses.length > 0) {
      const totalPoints = courses.reduce((sum, course) => sum + (course.points * course.credits), 0);
      const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
      gpa = totalPoints / totalCredits;
    }
    
    setSemesterGPA(gpa);
    
    // Overall GPA is fixed from the data
    setCumulativeGPA(academicData.overallGPA);
  };

  const handlePrint = () => {
    // This would print the transcript in a real application
    window.print();
  };

  const handleDownload = () => {
    // This would download a PDF of the transcript in a real application
    alert('Downloading transcript as PDF...');
  };

  const formatGPA = (gpa) => {
    return gpa.toFixed(2);
  };

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

        <Card sx={styles.summaryCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thông tin sinh viên
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Mã SV:</strong> {academicData.studentId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Họ tên:</strong> {academicData.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Ngành:</strong> {academicData.major}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Khoa:</strong> {academicData.faculty}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Chương trình:</strong> {academicData.program}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body1">
                  <strong>Khóa:</strong> {academicData.enrollmentYear}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={styles.summaryCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tổng quan học tập
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Điểm trung bình tích lũy:</strong> {formatGPA(cumulativeGPA)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Số tín chỉ đã hoàn thành:</strong> {academicData.completedCredits}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Số tín chỉ yêu cầu:</strong> {academicData.requiredCredits}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Dự kiến tốt nghiệp:</strong> {academicData.expectedGraduation}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <FormControl sx={styles.formControl}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={selectedSemester}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                {academicData.semesters.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    {semester === 'All' ? 'Tất cả học kỳ' : semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            {selectedSemester !== 'All' && (
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
                  {selectedSemester === 'All' && <TableCell>Học kỳ</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell align="center">{course.credits}</TableCell>
                    <TableCell align="center">{course.grade}</TableCell>
                    <TableCell align="center">{course.points.toFixed(1)}</TableCell>
                    {selectedSemester === 'All' && (
                      <TableCell>
                        {Object.keys(academicData.transcriptData).find(
                          semester => academicData.transcriptData[semester].some(c => c.id === course.id)
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {currentCourses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={selectedSemester === 'All' ? 6 : 5} align="center">
                      <Typography variant="body1">
                        Không có dữ liệu cho học kỳ này.
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
              Tải xuống (PDF)
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