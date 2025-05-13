import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Tab,
  Tabs
} from '@mui/material';
import {
  Today,
  DateRange,
  Event,
  EventNote,
  DownloadOutlined,
  Place,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { scheduleService } from '../../services/api';

// Class Schedule Component
const ClassSchedule = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedView, setSelectedView] = useState(0);
  const [scheduleData, setScheduleData] = useState([]);
  
  // Sample data for semesters
  const semesters = [
    { id: 1, name: 'Học kỳ 1, 2023-2024' },
    { id: 2, name: 'Học kỳ 2, 2023-2024', isCurrent: true },
    { id: 3, name: 'Học kỳ 3, 2023-2024' }
  ];
  
  // Get current semester
  const currentSemester = semesters.find(s => s.isCurrent)?.id || 2;
  
  // Days of the week
  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  
  // Time slots
  const timeSlots = [
    { id: 1, start: '07:00', end: '09:00' },
    { id: 2, start: '09:30', end: '11:30' },
    { id: 3, start: '13:00', end: '15:00' },
    { id: 4, start: '15:30', end: '17:30' },
    { id: 5, start: '18:00', end: '20:00' }
  ];
  
  // Sample schedule data
  const sampleScheduleData = [
    {
      id: 1,
      courseCode: 'CS101',
      courseName: 'Nhập môn Khoa học máy tính',
      instructor: 'Nguyễn Văn A',
      day: 'Thứ 2',
      startTime: '07:00',
      endTime: '09:00',
      room: 'P.101',
      building: 'A1',
      weekNum: 1
    },
    {
      id: 2,
      courseCode: 'MATH101',
      courseName: 'Giải tích 1',
      instructor: 'Trần Thị B',
      day: 'Thứ 3',
      startTime: '09:30',
      endTime: '11:30',
      room: 'P.102',
      building: 'A1',
      weekNum: 1
    },
    {
      id: 3,
      courseCode: 'CS102',
      courseName: 'Lập trình cơ bản',
      instructor: 'Lê Văn C',
      day: 'Thứ 4',
      startTime: '13:00',
      endTime: '15:00',
      room: 'P.103',
      building: 'A2',
      weekNum: 1
    },
    {
      id: 4,
      courseCode: 'ENG101',
      courseName: 'Tiếng Anh học thuật',
      instructor: 'Phạm Thị D',
      day: 'Thứ 5',
      startTime: '15:30',
      endTime: '17:30',
      room: 'P.104',
      building: 'A3',
      weekNum: 1
    },
    {
      id: 5,
      courseCode: 'PHY101',
      courseName: 'Vật lý đại cương',
      instructor: 'Hoàng Văn E',
      day: 'Thứ 6',
      startTime: '07:00',
      endTime: '09:00',
      room: 'P.105',
      building: 'A1',
      weekNum: 1
    }
  ];
  
  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser || !currentUser.UserID) {
          setError('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }
        
        // Initialize selected semester if not set
        if (!selectedSemester) {
          setSelectedSemester(currentSemester);
        }
        
        try {
          // Fetch class schedule - for now using sample data
          // const scheduleData = await scheduleService.getClassSchedule(
          //   currentUser.UserID, 
          //   selectedSemester || currentSemester
          // );
          
          // Simulating API call with sample data
          setTimeout(() => {
            setScheduleData(sampleScheduleData);
            setLoading(false);
          }, 1000);
        } catch (err) {
          console.error('Error fetching class schedule:', err);
          setError('Không thể tải lịch học. Vui lòng thử lại sau.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchScheduleData:', err);
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchScheduleData();
  }, [currentUser, selectedSemester, currentSemester]);
  
  // Handle semester change
  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
  };
  
  // Handle view change
  const handleViewChange = (event, newValue) => {
    setSelectedView(newValue);
  };
  
  // Get current date and week
  const currentDate = new Date();
  const currentWeek = Math.ceil((currentDate.getDate() - currentDate.getDay() + 1) / 7);
  
  // Helper function to get schedule for a specific day
  const getScheduleForDay = (day) => {
    return scheduleData.filter(schedule => schedule.day === day);
  };
  
  // Helper function to check if time slot has a class
  const getClassForTimeSlot = (day, timeSlot) => {
    return scheduleData.find(schedule => 
      schedule.day === day && 
      schedule.startTime === timeSlot.start && 
      schedule.endTime === timeSlot.end
    );
  };
  
  // Helper function to get color for course
  const getCourseColor = (courseCode) => {
    const colors = ['primary', 'secondary', 'success', 'error', 'info', 'warning'];
    // Simple hash function to determine color based on courseCode
    const hashCode = courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hashCode % colors.length];
  };
  
  // Loading state
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Lịch học
      </Typography>
      
      {/* Semester selection and info */}
      <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="semester-select-label">Học kỳ</InputLabel>
              <Select
                labelId="semester-select-label"
                id="semester-select"
                value={selectedSemester}
                label="Học kỳ"
                onChange={handleSemesterChange}
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester.id} value={semester.id}>
                    {semester.name} {semester.isCurrent ? '(Hiện tại)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DateRange sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="body1">
                Tuần hiện tại: {currentWeek} (từ {
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 1).toLocaleDateString('vi-VN')
                } đến {
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 7).toLocaleDateString('vi-VN')
                })
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
            <IconButton color="primary" title="Tải lịch xuống">
              <DownloadOutlined />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>
      
      {/* View selection tabs */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedView} onChange={handleViewChange} aria-label="class schedule tabs">
            <Tab label="Lịch học theo tuần" icon={<Event />} iconPosition="start" />
            <Tab label="Danh sách lớp học" icon={<EventNote />} iconPosition="start" />
          </Tabs>
        </Box>
      </Paper>
      
      {/* Week View */}
      {selectedView === 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '10%' }}>
                    <Typography variant="subtitle2">Thời gian</Typography>
                  </TableCell>
                  {daysOfWeek.map((day) => (
                    <TableCell key={day} align="center">
                      <Typography variant="subtitle2">{day}</Typography>
                      <Typography variant="caption">
                        {
                          (() => {
                            const d = new Date(currentDate);
                            const dayNum = daysOfWeek.indexOf(day);
                            d.setDate(d.getDate() - d.getDay() + dayNum + 1);
                            return d.toLocaleDateString('vi-VN');
                          })()
                        }
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {timeSlots.map((timeSlot) => (
                  <TableRow key={timeSlot.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="caption">{timeSlot.start}</Typography>
                        <Typography variant="caption">-</Typography>
                        <Typography variant="caption">{timeSlot.end}</Typography>
                      </Box>
                    </TableCell>
                    {daysOfWeek.map((day) => {
                      const classInfo = getClassForTimeSlot(day, timeSlot);
                      return (
                        <TableCell key={`${day}-${timeSlot.id}`} align="center">
                          {classInfo ? (
                            <Card variant="outlined" sx={{ backgroundColor: `${getCourseColor(classInfo.courseCode)}.50` }}>
                              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="subtitle2">
                                  {classInfo.courseCode}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                  {classInfo.courseName}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
                                  <Place fontSize="small" />
                                  <Typography variant="caption">
                                    {classInfo.room}, {classInfo.building}
                                  </Typography>
                                </Stack>
                              </CardContent>
                            </Card>
                          ) : (
                            ''
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* List View */}
      {selectedView === 1 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã môn học</TableCell>
                  <TableCell>Tên môn học</TableCell>
                  <TableCell>Giảng viên</TableCell>
                  <TableCell>Thứ</TableCell>
                  <TableCell>Giờ học</TableCell>
                  <TableCell>Phòng</TableCell>
                  <TableCell>Tuần học</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduleData.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Chip 
                        label={schedule.courseCode} 
                        color={getCourseColor(schedule.courseCode)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{schedule.courseName}</TableCell>
                    <TableCell>{schedule.instructor}</TableCell>
                    <TableCell>{schedule.day}</TableCell>
                    <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                    <TableCell>{schedule.room}, {schedule.building}</TableCell>
                    <TableCell>Tuần {schedule.weekNum}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default ClassSchedule; 