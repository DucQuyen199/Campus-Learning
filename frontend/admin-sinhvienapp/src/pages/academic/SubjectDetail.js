import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, Grid, Paper, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText, Chip, CircularProgress
} from '@mui/material';
import { 
  School, Edit, ArrowBack, MenuBook, Group
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

// Placeholder for the actual service
const academicService = {
  getSubjectById: (id) => Promise.resolve({
    id: parseInt(id),
    code: 'CS101',
    name: 'Nhập môn lập trình',
    description: 'Môn học cung cấp kiến thức cơ bản về lập trình, cấu trúc điều khiển, kiểu dữ liệu và thuật toán đơn giản.',
    credits: 4,
    department: 'Engineering',
    program: 'Computer Science',
    prerequisite: 'Không',
    status: 'Active',
    semester: 1,
    students: 45
  })
};

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subject-tabpanel-${index}`}
      aria-labelledby={`subject-tab-${index}`}
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

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      try {
        const data = await academicService.getSubjectById(id);
        setSubject(data);
      } catch (error) {
        console.error('Error fetching subject details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetails();
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

  if (!subject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Subject not found</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/academic/subjects')}
          sx={{ mt: 2 }}
        >
          Back to Subjects
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
            onClick={() => navigate('/academic/subjects')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Chi tiết môn học
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Edit />}
          onClick={() => navigate(`/academic/subjects/edit/${subject.id}`)}
        >
          Chỉnh sửa
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MenuBook sx={{ fontSize: 80, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{subject.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Mã: {subject.code}
                  </Typography>
                  <Chip 
                    label={subject.status} 
                    color={subject.status === 'Active' ? 'success' : 'default'} 
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
                    primary="Khoa phụ trách" 
                    secondary={subject.department} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Chương trình" 
                    secondary={subject.program} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Số tín chỉ" 
                    secondary={subject.credits} 
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
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="subject detail tabs">
            <Tab label="Thông tin chung" />
            <Tab label="Sinh viên đăng ký" />
            <Tab label="Lịch giảng dạy" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Mô tả môn học
              </Typography>
              <Typography paragraph>
                {subject.description}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin học tập
                  </Typography>
                  <List>
                    <ListItem>
                      <School sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Môn học tiên quyết" secondary={subject.prerequisite} />
                    </ListItem>
                    <ListItem>
                      <MenuBook sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Học kỳ" secondary={subject.semester} />
                    </ListItem>
                    <ListItem>
                      <Group sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Số sinh viên đăng ký" secondary={subject.students} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Danh sách sinh viên
          </Typography>
          <Typography>
            Danh sách sinh viên đăng ký môn học sẽ được hiển thị ở đây.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Lịch giảng dạy
          </Typography>
          <Typography>
            Lịch giảng dạy của môn học sẽ được hiển thị ở đây.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SubjectDetail; 