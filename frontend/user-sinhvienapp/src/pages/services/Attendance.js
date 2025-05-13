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
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Close, Warning } from '@mui/icons-material';

// Sample courses
const courses = [
  { id: 1, code: 'CS101', name: 'Introduction to Computer Science' },
  { id: 2, code: 'MATH201', name: 'Calculus II' },
  { id: 3, code: 'PHY102', name: 'Physics for Engineers' }
];

// Sample semesters
const semesters = ['HK1-2023-2024', 'HK2-2022-2023', 'HK1-2022-2023'];

// Sample attendance data
const attendanceData = {
  'CS101': [
    { id: 1, date: '06/11/2023', time: '09:00 - 10:30', room: 'A301', status: 'Present' },
    { id: 2, date: '08/11/2023', time: '09:00 - 10:30', room: 'A301', status: 'Present' },
    { id: 3, date: '13/11/2023', time: '09:00 - 10:30', room: 'A301', status: 'Absent' },
    { id: 4, date: '15/11/2023', time: '09:00 - 10:30', room: 'A301', status: 'Present' },
    { id: 5, date: '20/11/2023', time: '09:00 - 10:30', room: 'A301', status: 'Late' }
  ],
  'MATH201': [
    { id: 6, date: '07/11/2023', time: '13:00 - 14:30', room: 'B205', status: 'Present' },
    { id: 7, date: '09/11/2023', time: '13:00 - 14:30', room: 'B205', status: 'Present' },
    { id: 8, date: '14/11/2023', time: '13:00 - 14:30', room: 'B205', status: 'Present' },
    { id: 9, date: '16/11/2023', time: '13:00 - 14:30', room: 'B205', status: 'Present' },
    { id: 10, date: '21/11/2023', time: '13:00 - 14:30', room: 'B205', status: 'Present' }
  ],
  'PHY102': [
    { id: 11, date: '07/11/2023', time: '15:00 - 16:30', room: 'C105', status: 'Present' },
    { id: 12, date: '09/11/2023', time: '15:00 - 16:30', room: 'C105', status: 'Absent' },
    { id: 13, date: '14/11/2023', time: '15:00 - 16:30', room: 'C105', status: 'Present' },
    { id: 14, date: '16/11/2023', time: '15:00 - 16:30', room: 'C105', status: 'Late' },
    { id: 15, date: '21/11/2023', time: '15:00 - 16:30', room: 'C105', status: 'Present' }
  ]
};

const Attendance = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(false);

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
      marginTop: theme.spacing(3)
    },
    summaryCard: {
      marginBottom: theme.spacing(3)
    },
    circularProgress: {
      marginRight: theme.spacing(1)
    }
  };

  useEffect(() => {
    // Set default values
    if (semesters.length > 0) {
      setSelectedSemester(semesters[0]);
    }
    
    if (courses.length > 0) {
      setSelectedCourse(courses[0].code);
      updateAttendance(courses[0].code);
    }
  }, []);

  const updateAttendance = (courseCode) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const data = attendanceData[courseCode] || [];
      setAttendance(data);
      
      // Calculate statistics
      const present = data.filter(item => item.status === 'Present').length;
      const absent = data.filter(item => item.status === 'Absent').length;
      const late = data.filter(item => item.status === 'Late').length;
      const total = data.length;
      const percentage = total > 0 ? Math.round(((present + (late * 0.5)) / total) * 100) : 0;
      
      setAttendanceStats({
        present,
        absent,
        late,
        total,
        percentage
      });
      
      setLoading(false);
    }, 500);
  };

  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
  };

  const handleCourseChange = (event) => {
    const courseCode = event.target.value;
    setSelectedCourse(courseCode);
    updateAttendance(courseCode);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Present':
        return (
          <Chip 
            icon={<Check />} 
            label="Có mặt" 
            color="success"
            size="small" 
          />
        );
      case 'Absent':
        return (
          <Chip 
            icon={<Close />} 
            label="Vắng mặt" 
            color="error"
            size="small" 
          />
        );
      case 'Late':
        return (
          <Chip 
            icon={<Warning />} 
            label="Đi muộn" 
            color="warning"
            size="small" 
          />
        );
      default:
        return null;
    }
  };

  const getAttendanceWarningStatus = () => {
    if (attendanceStats.percentage < 50) {
      return (
        <Alert severity="error">
          <strong>Cảnh báo nghiêm trọng:</strong> Tỷ lệ tham dự của bạn dưới 50%. Bạn có nguy cơ không đủ điều kiện dự thi.
        </Alert>
      );
    } else if (attendanceStats.percentage < 80) {
      return (
        <Alert severity="warning">
          <strong>Cảnh báo:</strong> Tỷ lệ tham dự của bạn dưới 80%. Bạn nên đảm bảo tham dự đầy đủ các buổi học còn lại.
        </Alert>
      );
    } else {
      return (
        <Alert severity="success">
          <strong>Tốt:</strong> Tỷ lệ tham dự của bạn đạt yêu cầu.
        </Alert>
      );
    }
  };

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Xem điểm danh
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xem thông tin điểm danh các môn học theo từng học kỳ
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Grid container spacing={2}>
          <Grid item>
            <FormControl sx={styles.formControl}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={selectedSemester}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester} value={semester}>
                    {semester}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl sx={styles.formControl}>
              <InputLabel>Môn học</InputLabel>
              <Select
                value={selectedCourse}
                onChange={handleCourseChange}
                label="Môn học"
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.code}>
                    {course.code} - {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Card sx={styles.summaryCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thống kê điểm danh {selectedCourse && `- ${courses.find(c => c.code === selectedCourse)?.name}`}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Tổng số buổi:</strong> {attendanceStats.total}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Có mặt:</strong> {attendanceStats.present} ({Math.round((attendanceStats.present / attendanceStats.total) * 100) || 0}%)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Vắng mặt:</strong> {attendanceStats.absent} ({Math.round((attendanceStats.absent / attendanceStats.total) * 100) || 0}%)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body1">
                  <strong>Đi muộn:</strong> {attendanceStats.late} ({Math.round((attendanceStats.late / attendanceStats.total) * 100) || 0}%)
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={attendanceStats.percentage} 
                    color={
                      attendanceStats.percentage < 50 ? 'error' : 
                      attendanceStats.percentage < 80 ? 'warning' : 
                      'success'
                    }
                    size={32}
                    sx={styles.circularProgress}
                  />
                  <Typography variant="h6">
                    Tỷ lệ tham dự: {attendanceStats.percentage}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                {getAttendanceWarningStatus()}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          attendance.length > 0 ? (
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Phòng học</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.time}</TableCell>
                      <TableCell>{item.room}</TableCell>
                      <TableCell>{getStatusChip(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" align="center">
                  Không có dữ liệu điểm danh cho môn học này.
                </Typography>
              </CardContent>
            </Card>
          )
        )}
      </Paper>
    </div>
  );
};

export default Attendance; 