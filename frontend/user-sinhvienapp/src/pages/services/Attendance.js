/*-----------------------------------------------------------------
* File: Attendance.js
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
import { attendanceService } from '../../services/attendanceService';

const Attendance = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
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
    const fetchInitial = async () => {
      try {
        const uid = currentUser?.UserID;
        if (!uid) return;

        // Load semesters having attendance data
        const sems = await attendanceService.getSemesters(uid);
        setSemesters(sems);

        if (sems.length > 0) {
          setSelectedSemester(sems[0].SemesterID);
        }
      } catch (err) {
        console.error('Error loading semesters:', err);
      }
    };
    fetchInitial();
  }, [currentUser]);

  // Load courses when semester changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedSemester || !currentUser) return;
      try {
        const list = await attendanceService.getCourses(currentUser.UserID, selectedSemester);
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourse(list[0]);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
      }
    };
    fetchCourses();
  }, [selectedSemester, currentUser]);

  // Load attendance when course changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedCourse || !currentUser) return;
      setLoading(true);
      try {
        const records = await attendanceService.getAttendance(currentUser.UserID, selectedCourse.ClassID);
        updateAttendanceState(records);
      } catch (err) {
        console.error('Error loading attendance:', err);
        setAttendance([]);
        setAttendanceStats({present:0,absent:0,late:0,total:0,percentage:0});
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [selectedCourse, currentUser]);

  const updateAttendanceState = (data) => {
    setAttendance(data);
    // stats
    const present = data.filter(i => i.Status === 'Present').length;
    const absent = data.filter(i => i.Status === 'Absent').length;
    const late = data.filter(i => i.Status === 'Late').length;
    const total = data.length;
    const percentage = total ? Math.round(((present + late*0.5)/total)*100) : 0;
    setAttendanceStats({present, absent, late, total, percentage});
  };

  const handleSemesterChange = async(event) => {
    setSelectedSemester(event.target.value);
  };

  const handleCourseChange = async (event) => {
    const classId = event.target.value;
    const courseObj = courses.find(c=>c.ClassID===classId);
    setSelectedCourse(courseObj);
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
                {semesters.map((sem) => (
                  <MenuItem key={sem.SemesterID} value={sem.SemesterID}>
                    {sem.SemesterName} - {sem.AcademicYear}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl sx={styles.formControl}>
              <InputLabel>Môn học</InputLabel>
              <Select
                value={selectedCourse?.ClassID}
                onChange={handleCourseChange}
                label="Môn học"
              >
                {courses.map((course) => (
                  <MenuItem key={course.ClassID} value={course.ClassID}>
                    {course.SubjectCode || course.ClassCode} - {course.SubjectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Card sx={styles.summaryCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thống kê điểm danh {selectedCourse && `- ${selectedCourse.SubjectName}`}
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
                    <TableRow key={item.AttendanceID}>
                      <TableCell>{new Date(item.SessionDate).toLocaleDateString()}</TableCell>
                      <TableCell>{`${item.CheckInTime || ''} - ${item.CheckOutTime || ''}`}</TableCell>
                      <TableCell>{item.Location || '-'}</TableCell>
                      <TableCell>{getStatusChip(item.Status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" align="center">
                  Không có dữ liệu điểm danh.
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
