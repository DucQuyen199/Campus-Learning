import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Tabs, 
  Tab, 
  Divider, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Edit as EditIcon, 
  ArrowBack as ArrowBackIcon, 
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Group as GroupIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`semester-tabpanel-${index}`}
      aria-labelledby={`semester-tab-${index}`}
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

const SemesterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Mock data
  const mockSemester = {
    id: parseInt(id),
    name: 'Spring 2024',
    startDate: '2024-01-15',
    endDate: '2024-05-30',
    description: 'Spring semester of the 2023-2024 academic year',
    status: 'In Progress',
    isActive: true,
    numberOfStudents: 680,
    numberOfSubjects: 20,
    academicYear: '2023-2024',
    registrationPeriod: {
      start: '2023-12-01',
      end: '2023-12-20'
    },
    examinationPeriod: {
      start: '2024-05-15',
      end: '2024-05-30'
    },
    statistics: {
      totalCredits: 78,
      averageGrade: 7.8,
      passRate: 92.5,
      subjects: [
        { name: 'Introduction to Programming', students: 120, averageGrade: 7.9 },
        { name: 'Data Structures and Algorithms', students: 95, averageGrade: 7.6 },
        { name: 'Database Systems', students: 88, averageGrade: 8.1 }
      ]
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSemester(mockSemester);
      setLoading(false);
    }, 500);
  }, [id, mockSemester]);

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

  if (!semester) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Semester not found</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/academic/semesters')}
          sx={{ mt: 2 }}
        >
          Back to Semesters
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Planned':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/academic/semesters')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Semester Details
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<EditIcon />}
          component={Link}
          to={`/academic/semesters/${semester.id}/edit`}
        >
          Edit Semester
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ fontSize: 80, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{semester.name}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Academic Year: {semester.academicYear}
                  </Typography>
                  <Chip 
                    label={semester.status} 
                    color={getStatusColor(semester.status)} 
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
                    primary="Start Date" 
                    secondary={semester.startDate} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="End Date" 
                    secondary={semester.endDate} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Active Status" 
                    secondary={semester.isActive ? 'Active' : 'Inactive'} 
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
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="semester detail tabs">
            <Tab label="Overview" />
            <Tab label="Subjects" />
            <Tab label="Students" />
            <Tab label="Schedule" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography paragraph>
                {semester.description}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Information
                  </Typography>
                  <List>
                    <ListItem>
                      <SchoolIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Academic Year" secondary={semester.academicYear} />
                    </ListItem>
                    <ListItem>
                      <MenuBookIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Total Subjects" secondary={semester.numberOfSubjects} />
                    </ListItem>
                    <ListItem>
                      <GroupIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Total Students" secondary={semester.numberOfStudents} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Important Dates
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Registration Period" 
                        secondary={`${semester.registrationPeriod.start} to ${semester.registrationPeriod.end}`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Examination Period" 
                        secondary={`${semester.examinationPeriod.start} to ${semester.examinationPeriod.end}`} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />}
            >
              Print
            </Button>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Subjects in this Semester
          </Typography>
          <Grid container spacing={2}>
            {semester.statistics.subjects.map((subject, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{subject.name}</Typography>
                    <Typography color="text.secondary">
                      <strong>Students:</strong> {subject.students}
                    </Typography>
                    <Typography color="text.secondary">
                      <strong>Average Grade:</strong> {subject.averageGrade}
                    </Typography>
                    <Tooltip title="View Subject Details">
                      <IconButton 
                        size="small" 
                        sx={{ mt: 1 }}
                        component={Link}
                        to={`/academic/subjects/${index + 1}`}
                      >
                        <MenuBookIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Students
          </Typography>
          <Typography paragraph>
            There are {semester.numberOfStudents} students enrolled in this semester.
          </Typography>
          <Button 
            variant="contained" 
            component={Link}
            to="/academic/results"
          >
            View Academic Results
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Schedule
          </Typography>
          <Typography paragraph>
            The semester schedule will be displayed here.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SemesterDetail; 