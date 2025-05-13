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
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Search,
  Delete,
  Info,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const CourseRegistration = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Sample data for course registration period
  const registrationPeriod = {
    isActive: true,
    startDate: new Date('2023-12-01'),
    endDate: new Date('2023-12-15'),
    currentSemester: 'Học kỳ 2, 2023-2024'
  };
  
  // Sample data for semesters
  const semesters = [
    { id: 1, name: 'Học kỳ 1, 2023-2024' },
    { id: 2, name: 'Học kỳ 2, 2023-2024' },
    { id: 3, name: 'Học kỳ 3, 2023-2024' }
  ];
  
  // Sample data for available courses
  const [availableCourses, setAvailableCourses] = useState([
    {
      id: 1,
      courseCode: 'CS101',
      courseName: 'Nhập môn Khoa học máy tính',
      credits: 3,
      classType: 'Lớp lý thuyết',
      instructor: 'Nguyễn Văn A',
      schedule: 'Thứ 2 (7:00-9:00), P.101',
      totalSlots: 60,
      availableSlots: 15,
      status: 'OPEN'
    },
    {
      id: 2,
      courseCode: 'CS102',
      courseName: 'Lập trình cơ bản',
      credits: 4,
      classType: 'Lớp lý thuyết',
      instructor: 'Trần Thị B',
      schedule: 'Thứ 3 (13:00-15:00), P.102',
      totalSlots: 50,
      availableSlots: 0,
      status: 'FULL'
    },
    {
      id: 3,
      courseCode: 'CS103',
      courseName: 'Cấu trúc dữ liệu và giải thuật',
      credits: 4,
      classType: 'Lớp lý thuyết',
      instructor: 'Lê Văn C',
      schedule: 'Thứ 4 (7:00-9:00), P.103',
      totalSlots: 45,
      availableSlots: 5,
      status: 'OPEN'
    }
  ]);
  
  // Sample data for registered courses
  const [registeredCourses, setRegisteredCourses] = useState([
    {
      id: 4,
      courseCode: 'MATH101',
      courseName: 'Giải tích 1',
      credits: 4,
      classType: 'Lớp lý thuyết',
      instructor: 'Phạm Thị D',
      schedule: 'Thứ 5 (7:00-9:00), P.104',
      registrationDate: new Date('2023-11-28')
    }
  ]);
  
  // Filter courses based on search query
  const filteredCourses = availableCourses.filter(course => 
    course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  // Handle semester selection change
  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
  };
  
  // Open confirmation dialog for course registration
  const handleOpenRegistrationDialog = (course) => {
    setSelectedCourse(course);
    setOpenDialog(true);
  };
  
  // Close confirmation dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Register for a course
  const handleRegisterCourse = () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Add to registered courses
      setRegisteredCourses([
        ...registeredCourses,
        {
          ...selectedCourse,
          registrationDate: new Date()
        }
      ]);
      
      // Update available slots and remove course if it's now full
      const updatedCourses = availableCourses.map(course => {
        if (course.id === selectedCourse.id) {
          const updatedSlots = course.availableSlots - 1;
          return {
            ...course,
            availableSlots: updatedSlots,
            status: updatedSlots <= 0 ? 'FULL' : 'OPEN'
          };
        }
        return course;
      });
      
      setAvailableCourses(updatedCourses.filter(course => course.availableSlots > 0));
      
      setSnackbar({
        open: true,
        message: `Đăng ký thành công môn học ${selectedCourse.courseName}`,
        severity: 'success'
      });
      
      setLoading(false);
      setOpenDialog(false);
    }, 1000);
  };
  
  // Remove a registered course
  const handleRemoveCourse = (courseId) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Find the course to be removed
      const courseToRestore = registeredCourses.find(course => course.id === courseId);
      
      // Update registered courses
      setRegisteredCourses(registeredCourses.filter(course => course.id !== courseId));
      
      // Restore the course to available courses if it was still within registration period
      if (courseToRestore) {
        const existingCourse = availableCourses.find(course => course.id === courseId);
        
        if (existingCourse) {
          // Update existing course
          setAvailableCourses(availableCourses.map(course => 
            course.id === courseId 
              ? { ...course, availableSlots: course.availableSlots + 1, status: 'OPEN' }
              : course
          ));
        } else {
          // Add course back to available courses
          setAvailableCourses([
            ...availableCourses,
            {
              ...courseToRestore,
              availableSlots: 1,
              status: 'OPEN'
            }
          ]);
        }
      }
      
      setSnackbar({
        open: true,
        message: `Đã hủy đăng ký môn học thành công`,
        severity: 'info'
      });
      
      setLoading(false);
    }, 1000);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };
  
  // Calculate total credits
  const totalCredits = registeredCourses.reduce((sum, course) => sum + course.credits, 0);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Đăng ký môn học
      </Typography>
      
      {/* Registration Period Info */}
      <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6">
              {registrationPeriod.currentSemester}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Thời gian đăng ký: {registrationPeriod.startDate.toLocaleDateString('vi-VN')} - {registrationPeriod.endDate.toLocaleDateString('vi-VN')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            {registrationPeriod.isActive ? (
              <Chip 
                icon={<CheckCircle />} 
                label="Đang mở đăng ký" 
                color="success" 
                variant="outlined" 
              />
            ) : (
              <Chip 
                icon={<Info />} 
                label="Đã đóng đăng ký" 
                color="error" 
                variant="outlined" 
              />
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Search & Filter */}
      <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Tìm kiếm môn học"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Nhập mã môn, tên môn hoặc tên giảng viên"
              InputProps={{
                endAdornment: (
                  <Search color="action" />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel id="semester-select-label">Học kỳ</InputLabel>
              <Select
                labelId="semester-select-label"
                id="semester-select"
                value={selectedSemester}
                label="Học kỳ"
                onChange={handleSemesterChange}
              >
                <MenuItem value="">
                  <em>Tất cả</em>
                </MenuItem>
                {semesters.map((semester) => (
                  <MenuItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              Tổng tín chỉ đăng ký: {totalCredits}/24
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Available Courses */}
      <Paper elevation={3} sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Danh sách môn học có thể đăng ký
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {filteredCourses.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã môn học</TableCell>
                  <TableCell>Tên môn học</TableCell>
                  <TableCell align="center">Tín chỉ</TableCell>
                  <TableCell>Loại lớp</TableCell>
                  <TableCell>Giảng viên</TableCell>
                  <TableCell>Lịch học</TableCell>
                  <TableCell align="center">Slot</TableCell>
                  <TableCell align="center">Đăng ký</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell align="center">{course.credits}</TableCell>
                    <TableCell>{course.classType}</TableCell>
                    <TableCell>{course.instructor}</TableCell>
                    <TableCell>{course.schedule}</TableCell>
                    <TableCell align="center">
                      {course.availableSlots}/{course.totalSlots}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="primary"
                        onClick={() => handleOpenRegistrationDialog(course)}
                        disabled={!registrationPeriod.isActive || course.status === 'FULL'}
                      >
                        <Add />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            Không tìm thấy môn học phù hợp với tìm kiếm của bạn.
          </Alert>
        )}
      </Paper>
      
      {/* Registered Courses */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Môn học đã đăng ký
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {registeredCourses.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã môn học</TableCell>
                  <TableCell>Tên môn học</TableCell>
                  <TableCell align="center">Tín chỉ</TableCell>
                  <TableCell>Loại lớp</TableCell>
                  <TableCell>Giảng viên</TableCell>
                  <TableCell>Lịch học</TableCell>
                  <TableCell>Ngày đăng ký</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registeredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.courseCode}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell align="center">{course.credits}</TableCell>
                    <TableCell>{course.classType}</TableCell>
                    <TableCell>{course.instructor}</TableCell>
                    <TableCell>{course.schedule}</TableCell>
                    <TableCell>
                      {course.registrationDate.toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error"
                        onClick={() => handleRemoveCourse(course.id)}
                        disabled={!registrationPeriod.isActive}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            Bạn chưa đăng ký môn học nào.
          </Alert>
        )}
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Xác nhận đăng ký môn học</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn đăng ký môn học sau đây không?
          </DialogContentText>
          {selectedCourse && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                {selectedCourse.courseName} ({selectedCourse.courseCode})
              </Typography>
              <Typography variant="body2">
                Giảng viên: {selectedCourse.instructor}
              </Typography>
              <Typography variant="body2">
                Lịch học: {selectedCourse.schedule}
              </Typography>
              <Typography variant="body2">
                Tín chỉ: {selectedCourse.credits}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleRegisterCourse} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Xác nhận đăng ký'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
};

export default CourseRegistration; 