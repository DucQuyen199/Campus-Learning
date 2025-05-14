import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, Grid, Paper, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText, Chip, CircularProgress
} from '@mui/material';
import { 
  School, Edit, ArrowBack, BusinessCenter, BarChart
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';

// Placeholder for the actual service
const academicService = {
  getProgramById: (id) => Promise.resolve({
    id: parseInt(id),
    code: 'CS',
    name: 'Computer Science',
    department: 'Engineering',
    description: 'Chương trình đào tạo ngành Khoa học máy tính cung cấp kiến thức nền tảng về thuật toán, lập trình, cơ sở dữ liệu, mạng máy tính và trí tuệ nhân tạo.',
    duration: 4,
    credits: 150,
    degree: 'Cử nhân',
    status: 'Active',
    createdAt: '01/01/2020',
    students: 120
  }),
  getProgramSubjects: (id) => Promise.resolve([
    { id: 1, code: 'CS101', name: 'Nhập môn lập trình', credits: 4, semester: 1 },
    { id: 2, code: 'CS201', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, semester: 2 },
    { id: 3, code: 'CS301', name: 'Cơ sở dữ liệu', credits: 3, semester: 3 },
    { id: 4, code: 'CS401', name: 'Trí tuệ nhân tạo', credits: 3, semester: 4 }
  ])
};

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`program-tabpanel-${index}`}
      aria-labelledby={`program-tab-${index}`}
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

const ProgramDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        const programData = await academicService.getProgramById(id);
        setProgram(programData);
        
        const subjectsData = await academicService.getProgramSubjects(id);
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Error fetching program details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const subjectColumns = [
    { field: 'code', headerName: 'Mã môn', width: 120 },
    { field: 'name', headerName: 'Tên môn học', width: 300 },
    { field: 'credits', headerName: 'Số tín chỉ', width: 120, type: 'number' },
    { field: 'semester', headerName: 'Học kỳ', width: 120, type: 'number' }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!program) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Program not found</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/academic/programs')}
          sx={{ mt: 2 }}
        >
          Back to Programs
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
            onClick={() => navigate('/academic/programs')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Chi tiết chương trình đào tạo
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Edit />}
          onClick={() => navigate(`/academic/programs/edit/${program.id}`)}
        >
          Chỉnh sửa
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ fontSize: 80, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{program.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Mã: {program.code}
                  </Typography>
                  <Chip 
                    label={program.status} 
                    color={program.status === 'Active' ? 'success' : 'default'} 
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
                    secondary={program.department} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Thời gian đào tạo" 
                    secondary={`${program.duration} năm`} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Bằng cấp" 
                    secondary={program.degree} 
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
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="program detail tabs">
            <Tab label="Thông tin chung" />
            <Tab label="Danh sách môn học" />
            <Tab label="Thống kê" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Mô tả chương trình
              </Typography>
              <Typography paragraph>
                {program.description}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin tổng quan
                  </Typography>
                  <List>
                    <ListItem>
                      <BusinessCenter sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Tổng số tín chỉ" secondary={program.credits} />
                    </ListItem>
                    <ListItem>
                      <School sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Số sinh viên đang theo học" secondary={program.students} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Danh sách môn học thuộc chương trình
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={subjects}
              columns={subjectColumns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 25]}
              disableSelectionOnClick
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
            Thống kê chương trình đào tạo
          </Typography>
          <Typography>
            Biểu đồ và thông tin thống kê về chương trình sẽ được hiển thị ở đây.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ProgramDetail; 