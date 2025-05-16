import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Chip,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Edit as EditIcon, 
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { academicService } from '../../services/api';

const SemesterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  
  useEffect(() => {
    fetchSemesterData();
  }, [id]);
  
  const fetchSemesterData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch semester details
      const response = await academicService.getSemesterById(id);
      
      if (response && response.success) {
        const semesterData = response.data;
        
        const formattedSemester = {
          id: semesterData.SemesterID,
          code: semesterData.SemesterCode,
          name: semesterData.SemesterName,
          academicYear: semesterData.AcademicYear,
          startDate: new Date(semesterData.StartDate).toLocaleDateString('vi-VN'),
          endDate: new Date(semesterData.EndDate).toLocaleDateString('vi-VN'),
          registrationStartDate: semesterData.RegistrationStartDate ? 
            new Date(semesterData.RegistrationStartDate).toLocaleDateString('vi-VN') : 'N/A',
          registrationEndDate: semesterData.RegistrationEndDate ? 
            new Date(semesterData.RegistrationEndDate).toLocaleDateString('vi-VN') : 'N/A',
          status: semesterData.Status,
          isActive: semesterData.IsCurrent === true || semesterData.IsCurrent === 1,
          students: {
            total: semesterData.StudentCount || 0,
            registered: semesterData.RegisteredStudentCount || 0,
            completed: semesterData.CompletedStudentCount || 0
    }
  };

        setSemester(formattedSemester);
        
        // Fetch subjects for this semester
        fetchSemesterSubjects(id);
      } else {
        throw new Error(response?.message || 'Không thể tải thông tin học kỳ');
      }
    } catch (err) {
      console.error('Error fetching semester details:', err);
      setError('Không thể tải thông tin học kỳ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSemesterSubjects = async (semesterId) => {
    try {
      setSubjectsLoading(true);
      
      // Fetch subjects for this semester
      const response = await academicService.getSemesterSubjects(semesterId);
      
      if (response && response.success) {
        const subjectsData = response.data || [];
        
        // Format subjects data
        const formattedSubjects = subjectsData.map(subject => ({
          id: subject.SubjectID,
          code: subject.SubjectCode,
          name: subject.SubjectName,
          credits: subject.Credits,
          department: subject.Department,
          faculty: subject.Faculty
        }));
        
        setSemesterSubjects(formattedSubjects);
      } else {
        console.warn('Could not load semester subjects:', response?.message);
      }
    } catch (err) {
      console.error('Error fetching semester subjects:', err);
    } finally {
      setSubjectsLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Đã kết thúc':
        return 'success';
      case 'In Progress':
      case 'Ongoing':
      case 'Đang diễn ra':
        return 'primary';
      case 'Planned':
      case 'Upcoming':
      case 'Sắp tới':
        return 'warning';
      case 'Cancelled':
      case 'Đã hủy':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const translateStatus = (status) => {
    switch (status) {
      case 'Completed':
        return 'Đã kết thúc';
      case 'In Progress':
      case 'Ongoing':
        return 'Đang diễn ra';
      case 'Planned':
      case 'Upcoming':
        return 'Sắp tới';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/academic/semesters')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách học kỳ
        </Button>
      </Box>
    );
  }

  if (!semester) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Không tìm thấy thông tin học kỳ.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/academic/semesters')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách học kỳ
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {semester.name}
        </Typography>
        
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/academic/semesters')}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
        <Button 
          variant="contained" 
            color="primary" 
          startIcon={<EditIcon />}
          component={Link}
            to={`/academic/semesters/${id}/edit`}
        >
            Chỉnh sửa
        </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Mã học kỳ
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {semester.code}
                  </Typography>
            
            <Typography variant="subtitle1" color="textSecondary">
              Năm học
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {semester.academicYear}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary">
              Ngày bắt đầu
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {semester.startDate}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary">
              Ngày kết thúc
              </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {semester.endDate}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Trạng thái
                  </Typography>
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={translateStatus(semester.status)} 
                color={getStatusColor(semester.status)} 
              />
            </Box>
            
            <Typography variant="subtitle1" color="textSecondary">
              Đang diễn ra
                  </Typography>
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={semester.isActive ? 'Có' : 'Không'} 
                color={semester.isActive ? 'success' : 'default'} 
                      />
            </Box>
            
            <Typography variant="subtitle1" color="textSecondary">
              Thời gian đăng ký
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {semester.registrationStartDate} - {semester.registrationEndDate}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
              Thống kê
          </Typography>
            
          <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText'
                  }}
                >
                  <Typography variant="h5">{semesterSubjects?.length || 0}</Typography>
                  <Typography variant="body2">Môn học</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText'
                  }}
                >
                  <Typography variant="h5">{semester.students?.total || 0}</Typography>
                  <Typography variant="body2">Sinh viên</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    backgroundColor: 'success.light',
                    color: 'success.contrastText'
                  }}
                      >
                  <Typography variant="h5">{semester.students?.registered || 0}</Typography>
                  <Typography variant="body2">Đã đăng ký</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
          Danh sách môn học
          </Typography>
        
        {subjectsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : semesterSubjects && semesterSubjects.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã môn</TableCell>
                  <TableCell>Tên môn học</TableCell>
                  <TableCell align="center">Số tín chỉ</TableCell>
                  <TableCell>Khoa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {semesterSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell align="center">{subject.credits}</TableCell>
                    <TableCell>{subject.department}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">Chưa có môn học nào được thêm vào học kỳ này.</Alert>
        )}
      </Paper>
    </Box>
  );
};

export default SemesterDetail; 