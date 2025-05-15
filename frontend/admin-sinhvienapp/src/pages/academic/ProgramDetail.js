import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, Grid, Paper, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Snackbar, Alert, IconButton
} from '@mui/material';
import { 
  School, Edit, ArrowBack, BusinessCenter, BarChart, Add, Delete
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { academicService } from '../../services/api';

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
  
  // State for subject addition
  const [openSubjectDialog, setOpenSubjectDialog] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectSemester, setSubjectSemester] = useState(1);
  const [isRequired, setIsRequired] = useState(true);
  const [subjectType, setSubjectType] = useState('Core');
  const [inputMode, setInputMode] = useState('select'); // 'select' or 'create'
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCredits, setNewSubjectCredits] = useState(3);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        const programData = await academicService.getProgramById(id);
        console.log('Program data:', programData);
        setProgram(programData.data);
        
        // Fetch subjects in this program
        await fetchProgramSubjects();
        
        // Fetch all available subjects for adding to program
        const subjectsResponse = await academicService.getAllSubjects();
        console.log('Available subjects response:', subjectsResponse);
        if (subjectsResponse.success) {
          setAvailableSubjects(subjectsResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching program details:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching program details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [id]);

  const fetchProgramSubjects = async () => {
    try {
      // Use the dedicated endpoint for program subjects
      const response = await academicService.getProgramSubjects(id);
      console.log('Program subjects response:', response);
      if (response.success) {
        // Map the data to include proper ID for DataGrid
        const formattedSubjects = (response.data || []).map(subject => ({
          ...subject,
          id: subject.SubjectID // Ensure each row has an id for DataGrid
        }));
        setSubjects(formattedSubjects);
        console.log('Formatted subjects:', formattedSubjects);
      } else {
        throw new Error(response.message || 'Failed to fetch program subjects');
      }
    } catch (error) {
      console.error('Error fetching program subjects:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching program subjects',
        severity: 'error'
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenSubjectDialog = () => {
    setOpenSubjectDialog(true);
  };

  const handleCloseSubjectDialog = () => {
    setOpenSubjectDialog(false);
    // Reset form
    setSelectedSubject('');
    setSubjectSemester(1);
    setIsRequired(true);
    setSubjectType('Core');
    setInputMode('select');
    setNewSubjectCode('');
    setNewSubjectName('');
    setNewSubjectCredits(3);
  };

  const handleAddSubject = async () => {
    if (inputMode === 'select' && !selectedSubject) {
      setSnackbar({
        open: true,
        message: 'Please select a subject',
        severity: 'error'
      });
      return;
    }
    
    if (inputMode === 'create' && (!newSubjectCode || !newSubjectName)) {
      setSnackbar({
        open: true,
        message: 'Please enter both subject code and name',
        severity: 'error'
      });
      return;
    }

    try {
      let subjectId = selectedSubject;
      
      // If we're creating a new subject, create it first
      if (inputMode === 'create') {
        const newSubjectData = {
          subjectCode: newSubjectCode,
          subjectName: newSubjectName,
          credits: newSubjectCredits,
          department: program.department || '',
          faculty: program.faculty || ''
        };
        
        const createResponse = await academicService.createSubject(newSubjectData);
        
        console.log('Create subject response:', createResponse);
        
        if (!createResponse || !createResponse.success) {
          throw new Error(createResponse?.message || 'Failed to create new subject');
        }
        
        subjectId = createResponse.subjectId || '';
        
        if (!subjectId) {
          throw new Error('Failed to get subject ID from response');
        }
      }
      
      const data = {
        semester: subjectSemester,
        isRequired: isRequired,
        subjectType: subjectType
      };

      const response = await academicService.addSubjectToProgram(id, subjectId, data);
      
      console.log('Add subject to program response:', response);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Subject added to program successfully',
          severity: 'success'
        });
        
        // Refresh program subjects list
        setTimeout(() => {
          fetchProgramSubjects();
        }, 500); // Add slight delay to ensure server has processed the addition
        
        handleCloseSubjectDialog();
      } else {
        throw new Error(response.message || 'Failed to add subject to program');
      }
    } catch (error) {
      console.error('Error adding subject to program:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error adding subject to program',
        severity: 'error'
      });
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to remove this subject from the program?')) {
      try {
        // We'll need to implement this API endpoint
        const response = await academicService.removeSubjectFromProgram(id, subjectId);
        
        if (response.success) {
          setSnackbar({
            open: true,
            message: 'Subject removed from program successfully',
            severity: 'success'
          });
          
          // Refresh program subjects list
          await fetchProgramSubjects();
        } else {
          throw new Error(response.message || 'Failed to remove subject from program');
        }
      } catch (error) {
        console.error('Error removing subject from program:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Error removing subject from program',
          severity: 'error'
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const subjectColumns = [
    { field: 'SubjectCode', headerName: 'Mã môn', minWidth: 100, flex: 0.5 },
    { field: 'SubjectName', headerName: 'Tên môn học', minWidth: 200, flex: 1.5 },
    { field: 'Credits', headerName: 'Số tín chỉ', minWidth: 100, flex: 0.5, type: 'number' },
    { field: 'Semester', headerName: 'Học kỳ', minWidth: 100, flex: 0.5, type: 'number' },
    { 
      field: 'isRequired', 
      headerName: 'Bắt buộc', 
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => (
        <Chip 
          label={params.value || params.row.IsRequired ? 'Bắt buộc' : 'Tự chọn'} 
          color={params.value || params.row.IsRequired ? 'primary' : 'default'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      minWidth: 100,
      flex: 0.5,
      renderCell: (params) => (
        <IconButton 
          color="error" 
          size="small" 
          onClick={() => handleRemoveSubject(params.row.SubjectID || params.row.id)}
        >
          <Delete fontSize="small" />
        </IconButton>
      )
    }
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
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

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
                    secondary={`${program.duration || 4} năm`} 
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
                {program.description || 'Chưa có mô tả chi tiết cho chương trình này.'}
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
                      <ListItemText primary="Tổng số tín chỉ" secondary={program.totalCredits || 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <School sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Số sinh viên đang theo học" secondary={program.students || 0} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Danh sách môn học thuộc chương trình
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleOpenSubjectDialog}
            >
              Thêm môn học
            </Button>
          </Box>
          <Box sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
            <DataGrid
              rows={subjects}
              columns={subjectColumns}
              getRowId={(row) => row.id || row.SubjectID}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 }
                }
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              autoHeight={false}
              density="standard"
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-main': { width: '100%' },
                '& .MuiDataGrid-cell': { px: 2 },
                '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' },
                boxShadow: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                '& .MuiDataGrid-virtualScroller': {
                  overflowY: 'auto'
                }
              }}
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

      {/* Dialog for adding a subject to the program */}
      <Dialog open={openSubjectDialog} onClose={handleCloseSubjectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm môn học vào chương trình</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="input-mode-label">Cách thêm môn học</InputLabel>
              <Select
                labelId="input-mode-label"
                id="input-mode"
                value={inputMode}
                label="Cách thêm môn học"
                onChange={(e) => setInputMode(e.target.value)}
              >
                <MenuItem value="select">Chọn từ danh sách</MenuItem>
                <MenuItem value="create">Tạo môn học mới</MenuItem>
              </Select>
            </FormControl>
            
            {inputMode === 'select' ? (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="subject-select-label">Môn học</InputLabel>
              <Select
                labelId="subject-select-label"
                id="subject-select"
                value={selectedSubject}
                label="Môn học"
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {availableSubjects.map((subject) => (
                  <MenuItem key={subject.SubjectID || subject.id} value={subject.SubjectID || subject.id}>
                    {subject.SubjectCode} - {subject.SubjectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Mã môn học"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Tên môn học"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Số tín chỉ"
                  type="number"
                  value={newSubjectCredits}
                  onChange={(e) => setNewSubjectCredits(parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <TextField
              fullWidth
              label="Học kỳ"
              type="number"
              value={subjectSemester}
              onChange={(e) => setSubjectSemester(parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 10 } }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="subject-type-label">Loại môn học</InputLabel>
              <Select
                labelId="subject-type-label"
                id="subject-type"
                value={subjectType}
                label="Loại môn học"
                onChange={(e) => setSubjectType(e.target.value)}
              >
                <MenuItem value="Core">Môn cơ sở</MenuItem>
                <MenuItem value="Specialized">Môn chuyên ngành</MenuItem>
                <MenuItem value="General">Môn đại cương</MenuItem>
                <MenuItem value="Elective">Môn tự chọn</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="required-label">Yêu cầu</InputLabel>
              <Select
                labelId="required-label"
                id="required"
                value={isRequired}
                label="Yêu cầu"
                onChange={(e) => setIsRequired(e.target.value)}
              >
                <MenuItem value={true}>Bắt buộc</MenuItem>
                <MenuItem value={false}>Tự chọn</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubjectDialog}>Hủy</Button>
          <Button onClick={handleAddSubject} variant="contained">Thêm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramDetail; 