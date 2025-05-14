import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, Grid, Paper, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText, Chip, CircularProgress
} from '@mui/material';
import { 
  Person, School, Email, Phone, Home, CalendarToday,
  Edit, ArrowBack
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

// Placeholder for the actual service
const studentsService = {
  getStudentById: (id) => Promise.resolve({
    id: id,
    studentId: 'SV00' + id,
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0123456789',
    address: '123 Đường ABC, Quận XYZ, TP.HCM',
    dateOfBirth: '01/01/2000',
    gender: 'Nam',
    program: 'Computer Science',
    enrollmentDate: '09/01/2022',
    status: 'Active',
    academicStatus: 'Good Standing',
    currentSemester: 3,
    gpa: 3.5
  })
};

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const data = await studentsService.getStudentById(id);
        setStudent(data);
      } catch (error) {
        console.error('Error fetching student details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Student not found</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/students')}
          sx={{ mt: 2 }}
        >
          Back to Students
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/students')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Chi tiết sinh viên
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Edit />}
          onClick={() => navigate(`/students/edit/${student.id}`)}
        >
          Chỉnh sửa
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ fontSize: 80, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{student.fullName}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {student.studentId}
                  </Typography>
                  <Chip 
                    label={student.status} 
                    color={student.status === 'Active' ? 'success' : 'default'} 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Chương trình đào tạo" 
                    secondary={student.program} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Học kỳ hiện tại" 
                    secondary={`Học kỳ ${student.currentSemester}`} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Tình trạng học tập" 
                    secondary={student.academicStatus} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="student detail tabs">
            <Tab label="Thông tin cá nhân" />
            <Tab label="Kết quả học tập" />
            <Tab label="Lịch sử học phí" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin liên hệ
                  </Typography>
                  <List>
                    <ListItem>
                      <Email sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Email" secondary={student.email} />
                    </ListItem>
                    <ListItem>
                      <Phone sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Số điện thoại" secondary={student.phone} />
                    </ListItem>
                    <ListItem>
                      <Home sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Địa chỉ" secondary={student.address} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin cá nhân
                  </Typography>
                  <List>
                    <ListItem>
                      <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Ngày sinh" secondary={student.dateOfBirth} />
                    </ListItem>
                    <ListItem>
                      <Person sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Giới tính" secondary={student.gender} />
                    </ListItem>
                    <ListItem>
                      <School sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Ngày nhập học" secondary={student.enrollmentDate} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Điểm trung bình: <strong>{student.gpa}</strong>
          </Typography>
          <Typography>
            Nội dung chi tiết về kết quả học tập sẽ được hiển thị ở đây.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography>
            Lịch sử đóng học phí sẽ được hiển thị ở đây.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StudentDetail; 