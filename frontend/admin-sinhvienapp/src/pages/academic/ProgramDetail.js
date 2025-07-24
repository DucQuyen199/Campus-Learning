/*-----------------------------------------------------------------
* File: ProgramDetail.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, Grid, Paper, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Snackbar, Alert, IconButton, Accordion, AccordionSummary,
  AccordionDetails, Tooltip, Autocomplete, TableContainer, Table, TableHead, 
  TableBody, TableRow, TableCell, Checkbox, TablePagination
} from '@mui/material';
import { 
  School, Edit, ArrowBack, BusinessCenter, BarChart, Add, Delete,
  ExpandMore, Person, PersonAdd, FilterList, Search, CheckBox, CheckBoxOutlineBlank
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { academicService, studentsService } from '../../services/api';

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
  const [students, setStudents] = useState([]);
  const [studentsByYear, setStudentsByYear] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(true);
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
  
  // State for existing student addition
  const [openAddStudentDialog, setOpenAddStudentDialog] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearchText, setStudentSearchText] = useState('');
  const [studentEntryYear, setStudentEntryYear] = useState(new Date().getFullYear());
  const [studentLoading, setStudentLoading] = useState(false);
  
  // State for multiple student selection in the table
  const [addStudentTabValue, setAddStudentTabValue] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [studentNameFilter, setStudentNameFilter] = useState('');
  const [studentCodeFilter, setStudentCodeFilter] = useState('');
  const [bulkAddLoading, setBulkAddLoading] = useState(false);
  
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

  // Fetch students in this program when tab changes to students tab
  useEffect(() => {
    if (tabValue === 2) { // If the students tab is selected
      fetchProgramStudents();
    }
  }, [tabValue, id]);

  const fetchProgramStudents = async () => {
    try {
      setStudentsLoading(true);
      // Fetch all students in this program using the new endpoint
      const response = await academicService.getProgramStudents(id);
      console.log('Program students response:', response);
      
      if (response.success) {
        const studentsList = response.data || [];
        setStudents(studentsList);
        
        // Group students by entry year
        const groupedStudents = {};
        studentsList.forEach(student => {
          // Get entry year from StudentPrograms if available, otherwise fallback to created year
          let entryYear;
          if (student.EntryYear) {
            entryYear = student.EntryYear;
          } else {
            // Fallback to created year if entry year is not available
            const createdDate = new Date(student.CreatedAt);
            entryYear = createdDate.getFullYear();
          }
          
          if (!groupedStudents[entryYear]) {
            groupedStudents[entryYear] = [];
          }
          
          groupedStudents[entryYear].push(student);
        });
        
        // Sort years in descending order (newest first)
        setStudentsByYear(groupedStudents);
      } else {
        throw new Error(response.message || 'Failed to fetch program students');
      }
    } catch (error) {
      console.error('Error fetching program students:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching program students',
        severity: 'error'
      });
    } finally {
      setStudentsLoading(false);
    }
  };

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

  // Function to handle adding a student to the program
  const handleAddStudent = () => {
    navigate(`/students?action=new&programId=${id}`);
  };
  
  // Functions for adding existing students to the program
  const handleOpenAddStudentDialog = async () => {
    setOpenAddStudentDialog(true);
    setAddStudentTabValue(0);
    setSelectedStudent(null);
    setSelectedStudents([]);
    setPage(0);
    setStudentNameFilter('');
    setStudentCodeFilter('');
    await fetchAvailableStudents();
  };
  
  const handleCloseAddStudentDialog = () => {
    setOpenAddStudentDialog(false);
    setAddStudentTabValue(0);
    setSelectedStudent(null);
    setSelectedStudents([]);
    setStudentSearchText('');
    setStudentNameFilter('');
    setStudentCodeFilter('');
    setStudentEntryYear(new Date().getFullYear());
  };
  
  const fetchAvailableStudents = async () => {
    try {
      setStudentLoading(true);
      const response = await studentsService.getAllStudentsDirect();
      
      if (response.success) {
        // Filter out students who are already in this program
        const existingStudentIds = students.map(s => s.UserID);
        const filteredStudents = response.data.filter(student => 
          !existingStudentIds.includes(student.UserID)
        );
        
        setAvailableStudents(filteredStudents);
      } else {
        throw new Error(response.message || 'Failed to fetch available students');
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching available students',
        severity: 'error'
      });
    } finally {
      setStudentLoading(false);
    }
  };
  
  const handleAddExistingStudent = async () => {
    if (!selectedStudent) {
      setSnackbar({
        open: true,
        message: 'Please select a student',
        severity: 'error'
      });
      return;
    }
    
    try {
      const response = await academicService.addStudentToProgram(
        id, 
        selectedStudent.UserID, 
        studentEntryYear
      );
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Student added to program successfully',
          severity: 'success'
        });
        
        // Refresh program students list
        setTimeout(() => {
          fetchProgramStudents();
        }, 500);
        
        handleCloseAddStudentDialog();
      } else {
        throw new Error(response.message || 'Failed to add student to program');
      }
    } catch (error) {
      console.error('Error adding student to program:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error adding student to program',
        severity: 'error'
      });
    }
  };

  // Handle selection of multiple students
  const handleSelectAllStudents = (event) => {
    if (event.target.checked) {
      // Get filtered students based on current filters
      const filteredStudents = getFilteredStudents();
      const visibleStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      const visibleIds = visibleStudents.map(s => s.UserID);
      
      // Only select visible students on the current page
      setSelectedStudents(prev => {
        const newSelection = [...prev];
        visibleIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      // Deselect only visible students on the current page
      const filteredStudents = getFilteredStudents();
      const visibleStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      const visibleIds = visibleStudents.map(s => s.UserID);
      
      setSelectedStudents(prev => prev.filter(id => !visibleIds.includes(id)));
    }
  };
  
  const handleSelectStudent = (studentId) => {
    const selectedIndex = selectedStudents.indexOf(studentId);
    
    if (selectedIndex === -1) {
      // Add to selection
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      // Remove from selection
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };
  
  // Filter students based on name and code filters
  const getFilteredStudents = () => {
    return availableStudents.filter(student => {
      const nameMatch = !studentNameFilter || 
        (student.FullName && student.FullName.toLowerCase().includes(studentNameFilter.toLowerCase()));
      
      const codeMatch = !studentCodeFilter || 
        (student.StudentCode && student.StudentCode.toLowerCase().includes(studentCodeFilter.toLowerCase()));
      
      return nameMatch && codeMatch;
    });
  };
  
  // Function to add multiple students at once
  const handleAddMultipleStudents = async () => {
    if (selectedStudents.length === 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn ít nhất một sinh viên',
        severity: 'error'
      });
      return;
    }
    
    try {
      setBulkAddLoading(true);
      
      // Create an array of promises for adding each student
      const addPromises = selectedStudents.map(studentId => 
        academicService.addStudentToProgram(id, studentId, studentEntryYear)
      );
      
      // Execute all promises
      const results = await Promise.all(addPromises);
      
      // Count successful additions
      const successCount = results.filter(result => result.success).length;
      
      setSnackbar({
        open: true,
        message: `Đã thêm thành công ${successCount}/${selectedStudents.length} sinh viên vào chương trình`,
        severity: successCount > 0 ? 'success' : 'warning'
      });
      
      // Refresh program students list
      setTimeout(() => {
        fetchProgramStudents();
      }, 500);
      
      handleCloseAddStudentDialog();
    } catch (error) {
      console.error('Error adding multiple students to program:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Lỗi khi thêm sinh viên vào chương trình',
        severity: 'error'
      });
    } finally {
      setBulkAddLoading(false);
    }
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle tab change in the add student dialog
  const handleAddStudentTabChange = (event, newValue) => {
    setAddStudentTabValue(newValue);
  };

  // Function to view student details
  const handleViewStudent = (studentId) => {
    navigate(`/students/view/${studentId}`);
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

  const studentColumns = [
    { field: 'StudentCode', headerName: 'Mã SV', minWidth: 120, flex: 0.7 },
    { field: 'FullName', headerName: 'Họ và tên', minWidth: 200, flex: 1.5 },
    { field: 'Email', headerName: 'Email', minWidth: 220, flex: 1.5 },
    { field: 'Class', headerName: 'Lớp', minWidth: 100, flex: 0.7 },
    { field: 'AcademicStatus', headerName: 'Trạng thái', minWidth: 150, flex: 0.8,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Đang học'} 
          color={
            params.value === 'Suspended' ? 'error' :
            params.value === 'On Leave' ? 'warning' :
            params.value === 'Graduated' ? 'success' : 'primary'
          } 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      minWidth: 120,
      flex: 0.6,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Xem chi tiết">
            <IconButton 
              color="primary" 
              size="small" 
              onClick={() => handleViewStudent(params.row.UserID)}
            >
              <Person fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
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
          onClick={() => navigate(`/academic/programs/edit/${id}`)}
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
                  <Typography variant="h4">{program.ProgramName}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Mã: {program.ProgramCode}
                  </Typography>
                  <Chip 
                    label={program.IsActive ? 'Active' : 'Inactive'} 
                    color={program.IsActive ? 'success' : 'default'} 
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
                    secondary={program.Department} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Thời gian đào tạo" 
                    secondary={`${program.ProgramDuration || 0} năm`} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Bằng cấp" 
                    secondary={program.DegreeName} 
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
            <Tab label="Danh sách sinh viên" />
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
                {program.Description || 'Chưa có mô tả chi tiết cho chương trình này.'}
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
                      <ListItemText primary="Tổng số tín chỉ" secondary={program.TotalCredits || 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <School sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Số sinh viên đang theo học" secondary={program.StudentCount || 0} />
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Danh sách sinh viên thuộc chương trình
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<FilterList />} 
                sx={{ mr: 1 }}
                onClick={() => console.log('Filter students')}
              >
                Lọc
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<PersonAdd />} 
                onClick={handleOpenAddStudentDialog}
                sx={{ mr: 1 }}
              >
                Thêm sinh viên có sẵn
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={handleAddStudent}
              >
                Tạo sinh viên mới
              </Button>
            </Box>
          </Box>

          {studentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {Object.keys(studentsByYear).length > 0 ? (
                Object.keys(studentsByYear)
                  .sort((a, b) => b - a) // Sort years in descending order
                  .map(year => (
                    <Accordion key={year} defaultExpanded={true} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Khóa {year} - {parseInt(year) + parseInt(program.ProgramDuration || 4)}
                          <Chip 
                            label={`${studentsByYear[year].length} sinh viên`} 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 2 }} 
                          />
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <DataGrid
                          rows={studentsByYear[year].map(s => ({...s, id: s.UserID}))}
                          columns={studentColumns}
                          autoHeight
                          density="standard"
                          initialState={{
                            pagination: {
                              paginationModel: { pageSize: 10 }
                            }
                          }}
                          pageSizeOptions={[5, 10, 25]}
                          disableSelectionOnClick
                          sx={{
                            border: 0,
                            '& .MuiDataGrid-cell': { px: 2 },
                            '& .MuiDataGrid-columnHeaders': { 
                              bgcolor: 'action.hover', 
                              borderRadius: 1
                            }
                          }}
                        />
                      </AccordionDetails>
                    </Accordion>
                  ))
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Chưa có sinh viên nào được thêm vào chương trình này.
                </Alert>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
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

      {/* Dialog for adding existing student to the program */}
      <Dialog open={openAddStudentDialog} onClose={handleCloseAddStudentDialog} maxWidth="md" fullWidth>
        <DialogTitle>Thêm sinh viên vào chương trình</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Chương trình: {program.ProgramName} ({program.ProgramCode})
            </Typography>
            
            <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
              <Tabs 
                value={addStudentTabValue} 
                onChange={handleAddStudentTabChange}
                variant="fullWidth"
              >
                <Tab label="Thêm một sinh viên" />
                <Tab label="Thêm nhiều sinh viên" />
              </Tabs>
            </Box>
            
            {/* Common field for both tabs */}
            <TextField
              fullWidth
              label="Năm nhập học"
              type="number"
              value={studentEntryYear}
              onChange={(e) => setStudentEntryYear(parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 2000, max: 2050 } }}
              sx={{ mb: 3 }}
              helperText={`Dự kiến tốt nghiệp: ${studentEntryYear + (program.ProgramDuration || 4)}`}
            />
            
            {/* Tab 1: Add a single student */}
            {addStudentTabValue === 0 && (
              <>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <Autocomplete
                    id="student-select"
                    options={availableStudents}
                    loading={studentLoading}
                    value={selectedStudent}
                    onChange={(event, newValue) => {
                      setSelectedStudent(newValue);
                    }}
                    getOptionLabel={(option) => 
                      `${option.StudentCode || option.UserID} - ${option.FullName} (${option.Email})`
                    }
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Tìm kiếm sinh viên" 
                        variant="outlined"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {studentLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                          startAdornment: (
                            <Search color="action" sx={{ ml: 1, mr: 0.5 }} />
                          )
                        }}
                      />
                    )}
                  />
                </FormControl>
                
                {selectedStudent && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Thông tin sinh viên
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="Họ tên" secondary={selectedStudent.FullName} />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="Email" secondary={selectedStudent.Email} />
                          </ListItem>
                        </List>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="Mã sinh viên" secondary={selectedStudent.StudentCode || 'Chưa có'} />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="Số điện thoại" secondary={selectedStudent.PhoneNumber || 'Chưa có'} />
                          </ListItem>
                        </List>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </>
            )}
            
            {/* Tab 2: Add multiple students */}
            {addStudentTabValue === 1 && (
              <>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                  {selectedStudents.length} sinh viên được chọn
                </Typography>
                
                {selectedStudents.length > 0 && (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1, 
                      mb: 2, 
                      maxHeight: '100px', 
                      overflowY: 'auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5
                    }}
                  >
                    {selectedStudents.map(id => {
                      const student = availableStudents.find(s => s.UserID === id);
                      if (!student) return null;
                      return (
                        <Chip
                          key={id}
                          label={`${student.StudentCode || student.UserID} - ${student.FullName}`}
                          size="small"
                          onDelete={() => handleSelectStudent(id)}
                        />
                      );
                    })}
                  </Paper>
                )}
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    label="Tìm theo tên"
                    variant="outlined"
                    value={studentNameFilter}
                    onChange={(e) => setStudentNameFilter(e.target.value)}
                    sx={{ mr: 2, flex: 1 }}
                  />
                  <TextField
                    label="Tìm theo mã SV"
                    variant="outlined"
                    value={studentCodeFilter}
                    onChange={(e) => setStudentCodeFilter(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const filteredStudents = getFilteredStudents();
                        setSelectedStudents(filteredStudents.map(s => s.UserID));
                      }}
                      sx={{ mr: 1 }}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      variant="outlined" 
                      onClick={() => setSelectedStudents([])}
                      disabled={selectedStudents.length === 0}
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setStudentNameFilter('');
                        setStudentCodeFilter('');
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </Box>
                </Box>
                
                <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={
                              (() => {
                                const filteredStudents = getFilteredStudents();
                                const visibleStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
                                const visibleIds = visibleStudents.map(s => s.UserID);
                                const selectedVisible = selectedStudents.filter(id => visibleIds.includes(id));
                                return selectedVisible.length > 0 && selectedVisible.length < visibleIds.length;
                              })()
                            }
                            checked={
                              (() => {
                                const filteredStudents = getFilteredStudents();
                                const visibleStudents = filteredStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
                                const visibleIds = visibleStudents.map(s => s.UserID);
                                return visibleIds.length > 0 && 
                                  visibleIds.every(id => selectedStudents.includes(id));
                              })()
                            }
                            onChange={handleSelectAllStudents}
                          />
                        </TableCell>
                        <TableCell>Mã SV</TableCell>
                        <TableCell>Họ và tên</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Lớp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <CircularProgress size={30} />
                          </TableCell>
                        </TableRow>
                      ) : getFilteredStudents().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            Không tìm thấy sinh viên nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredStudents()
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((student) => {
                            const isSelected = selectedStudents.indexOf(student.UserID) !== -1;
                            return (
                              <TableRow
                                hover
                                onClick={() => handleSelectStudent(student.UserID)}
                                role="checkbox"
                                aria-checked={isSelected}
                                tabIndex={-1}
                                key={student.UserID}
                                selected={isSelected}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={isSelected}
                                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                                    checkedIcon={<CheckBox fontSize="small" />}
                                  />
                                </TableCell>
                                <TableCell>{student.StudentCode || student.UserID}</TableCell>
                                <TableCell>{student.FullName}</TableCell>
                                <TableCell>{student.Email}</TableCell>
                                <TableCell>{student.Class || '-'}</TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={getFilteredStudents().length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Hiển thị:"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddStudentDialog}>Hủy</Button>
          {addStudentTabValue === 0 ? (
            <Button 
              onClick={handleAddExistingStudent} 
              variant="contained" 
              disabled={!selectedStudent}
            >
              Thêm vào chương trình
            </Button>
          ) : (
            <Button 
              onClick={handleAddMultipleStudents} 
              variant="contained" 
              disabled={selectedStudents.length === 0 || bulkAddLoading}
              startIcon={bulkAddLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {bulkAddLoading 
                ? 'Đang xử lý...' 
                : `Thêm ${selectedStudents.length} sinh viên vào chương trình`
              }
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramDetail; 
