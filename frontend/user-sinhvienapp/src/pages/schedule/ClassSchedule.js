import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
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
  Tabs,
  useTheme,
  useMediaQuery,
  Skeleton,
  Fade,
  Avatar
} from '@mui/material';
import {
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  Event as EventIcon,
  EventNote as EventNoteIcon,
  Download as DownloadIcon,
  Place as PlaceIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarMonthIcon
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
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
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
    return <LoadingSkeleton />;
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ mt: 4, maxWidth: '100%', px: { xs: 2, sm: 4 } }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2, 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      mt: 2, 
      px: { xs: 1, sm: 2, md: 3 },
      maxWidth: '100%',
      animation: 'fadeIn 0.6s ease-out',
      '@keyframes fadeIn': {
        '0%': { opacity: 0, transform: 'translateY(20px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' }
      }
    }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'primary.main',
          textAlign: { xs: 'center', md: 'left' },
          mb: 3,
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: { xs: '50%', md: 0 },
            transform: { xs: 'translateX(-50%)', md: 'translateX(0)' },
            width: { xs: '80px', md: '120px' },
            height: '4px',
            background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            borderRadius: 2
          }
        }}
      >
        Lịch học
      </Typography>
      
      {/* Semester selection and info */}
      <Fade in timeout={800}>
        <Card 
          elevation={3} 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(192, 192, 192, 0.2)',
          }}
        >
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <CalendarMonthIcon sx={{ fontSize: 30 }} />
            <Typography variant="h5" fontWeight="600">
              Thông tin lịch học
            </Typography>
          </Box>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
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
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.02)'
                }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                    <DateRangeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Tuần hiện tại: {currentWeek}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 1).toLocaleDateString('vi-VN')}
                      {' '} - {' '}
                      {new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 7).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton 
                  color="primary" 
                  title="Tải lịch xuống"
                  sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'white',
                    '&:hover': { 
                      bgcolor: 'primary.main',
                    }
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>
      
      {/* View selection tabs */}
      <Fade in timeout={900}>
        <Card 
          elevation={3} 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(192, 192, 192, 0.2)',
          }}
        >
          <Tabs 
            value={selectedView} 
            onChange={handleViewChange} 
            aria-label="class schedule tabs"
            indicatorColor="primary"
            textColor="primary"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                py: 2
              }
            }}
          >
            <Tab 
              label="Lịch học theo tuần" 
              icon={<EventIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Danh sách lớp học" 
              icon={<EventNoteIcon />} 
              iconPosition="start" 
            />
          </Tabs>
        </Card>
      </Fade>
      
      {/* Week View */}
      {selectedView === 0 && (
        <Fade in timeout={1000}>
          <Card 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(192, 192, 192, 0.2)',
            }}
          >
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <TableCell 
                      sx={{ 
                        width: '10%', 
                        borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
                        py: 2
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>Thời gian</Typography>
                    </TableCell>
                    {daysOfWeek.map((day) => (
                      <TableCell 
                        key={day} 
                        align="center"
                        sx={{ 
                          borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
                          py: 2
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>{day}</Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            color: 'text.secondary',
                            mt: 0.5
                          }}
                        >
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
                  {timeSlots.map((timeSlot, index) => (
                    <TableRow key={timeSlot.id} sx={{ backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'transparent' }}>
                      <TableCell 
                        sx={{ 
                          py: 2,
                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mb: 1, bgcolor: 'primary.light' }}>
                            <ScheduleIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="caption" fontWeight={500}>{timeSlot.start}</Typography>
                          <Typography variant="caption" color="text.secondary">-</Typography>
                          <Typography variant="caption" fontWeight={500}>{timeSlot.end}</Typography>
                        </Box>
                      </TableCell>
                      {daysOfWeek.map((day) => {
                        const classInfo = getClassForTimeSlot(day, timeSlot);
                        return (
                          <TableCell 
                            key={`${day}-${timeSlot.id}`} 
                            align="center"
                            sx={{ 
                              py: 2,
                              borderBottom: '1px solid rgba(0, 0, 0, 0.05)' 
                            }}
                          >
                            {classInfo ? (
                              <Card 
                                variant="outlined" 
                                sx={{ 
                                  backgroundColor: `${getCourseColor(classInfo.courseCode)}.50`,
                                  borderColor: `${getCourseColor(classInfo.courseCode)}.main`,
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                  '&:hover': { 
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {classInfo.courseCode}
                                  </Typography>
                                  <Typography variant="body2" noWrap>
                                    {classInfo.courseName}
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
                                    <PlaceIcon fontSize="small" color={getCourseColor(classInfo.courseCode)} />
                                    <Typography variant="caption" fontWeight={500}>
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
          </Card>
        </Fade>
      )}
      
      {/* List View */}
      {selectedView === 1 && (
        <Fade in timeout={1000}>
          <Card 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(192, 192, 192, 0.2)',
            }}
          >
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <TableCell sx={{ fontWeight: 600, py: 2, borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>Mã môn học</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2, borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>Tên môn học</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2, borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>Giảng viên</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2, borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>Thứ</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2, borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>Giờ học</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2, borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>Phòng</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2, borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>Tuần học</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheduleData.map((schedule, index) => (
                    <TableRow 
                      key={schedule.id}
                      hover
                      sx={{ 
                        backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'transparent',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' }
                      }}
                    >
                      <TableCell sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                        <Chip 
                          label={schedule.courseCode} 
                          color={getCourseColor(schedule.courseCode)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>{schedule.courseName}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>{schedule.instructor}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>{schedule.day}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          {schedule.startTime} - {schedule.endTime}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PlaceIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          {schedule.room}, {schedule.building}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                        <Chip 
                          label={`Tuần ${schedule.weekNum}`} 
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Fade>
      )}
    </Box>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => {
  return (
    <Box sx={{ mt: 2, px: { xs: 1, sm: 2, md: 3 }, maxWidth: '100%' }}>
      <Skeleton variant="text" width={300} height={60} sx={{ mb: 3 }} />
      
      <Skeleton variant="rounded" height={120} sx={{ mb: 4 }} />
      
      <Skeleton variant="rounded" height={60} sx={{ mb: 4 }} />
      
      <Skeleton variant="rounded" height={400} />
    </Box>
  );
};

export default ClassSchedule; 