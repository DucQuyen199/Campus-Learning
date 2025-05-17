import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip, Alert, Snackbar,
  Divider, Paper, List, ListItem, ListItemText, Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Search, Edit, Delete, Visibility, Person, FilterAlt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAllEnabled, setShowAllEnabled] = useState(true);
  const [allStudentsLoaded, setAllStudentsLoaded] = useState(false); // Track if all students are loaded

  const fetchStudents = async (page = 0, size = 100, search = '', prioritizeId = false) => {
    setLoading(true);
    if (search.trim() === '') {
      // Don't reset selected student if we're just doing a page change
      setSelectedStudent(null);
    }
    
    try {
      let params = {};
      
      // If we're doing a specific search by ID, use that approach
      if (/^\d+$/.test(search.trim())) {
        params = {
          exactUserId: search.trim(),
          role: 'STUDENT' // Ensure we only get students
        };
      } 
      // If doing a text search, use search params
      else if (search.trim() !== '') {
        params = {
          search: search,
          searchFields: 'UserID,FullName,Email',
          role: 'STUDENT' // Ensure we only get students
        };
      } 
      // If we haven't loaded all students yet, get all
      else if (!allStudentsLoaded) {
        params = {
          all: true,
          role: 'STUDENT', // Ensure we only get students
          noLimit: true // Request all records without pagination
        };
      }
      // If we're just changing pages and already have all students, don't reload
      else {
        // This is a page change with all students already loaded
        // Just return without making an API call
        setLoading(false);
        return;
      }
      
      console.log('Fetching with params:', params); 
      
      const response = await axios.get(`${API_URL}/students`, {
        params: params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 30000 // Increase timeout to 30 seconds for large datasets
      });
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Check if the data field is an array
        const studentsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data.students || []);
        
        console.log('Students data:', studentsData);
        
        // Map data to match our component needs
        const formattedData = studentsData.map(student => ({
          id: student.UserID,
          studentId: student.UserID, // UserID is the student ID
          fullName: student.FullName,
          email: student.Email,
          program: student.ProgramName || 'N/A', // Add program if available
          school: student.School || 'N/A',
          status: student.AccountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
          fullDetails: student
        }));
        
        console.log('Formatted data:', formattedData);
        
        // If we're searching for an exact UserID, filter to ensure only exact matches are included
        if (params.exactUserId) {
          const exactId = parseInt(params.exactUserId);
          let exactMatches = formattedData;
          
          // Only filter if needed
          if (formattedData.length > 1) {
            exactMatches = formattedData.filter(student => student.id === exactId);
          }
          
          console.log('Exact matches:', exactMatches);
          
          setStudents(exactMatches);
          setTotalCount(exactMatches.length);
          
          // If we found any students, set the first one as selected
          if (exactMatches.length > 0) {
            setSelectedStudent(exactMatches[0].fullDetails);
          }
        } else {
        setStudents(formattedData);
          setTotalCount(formattedData.length);
          
          // If we're loading all students, mark them as loaded
          if (params.all) {
            setAllStudentsLoaded(true);
          }
        }
      } else {
        // Handle the case where success is false but we got a response
        console.error('API returned success: false', response.data);
        setStudents([]);
        setTotalCount(0);
        setError(response.data.message || 'Error fetching students');
        setOpenSnackbar(true);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
      setTotalCount(0);
      setError(err.message || 'Failed to load students data');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    const loadAllStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/students`, {
          params: {
            all: true,
            role: 'STUDENT', // Ensure we only get students
            noLimit: true // Request all records without pagination
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000 // Increase timeout to 30 seconds for large datasets
        });
        
        if (response.data.success) {
          const studentsData = Array.isArray(response.data.data) 
            ? response.data.data 
            : (response.data.data.students || []);
          
          console.log(`Loaded ${studentsData.length} students from database`);
          
          // Map data to match our component needs
          const formattedData = studentsData.map(student => ({
            id: student.UserID,
            studentId: student.UserID, // UserID is the student ID
            fullName: student.FullName,
            email: student.Email,
            program: student.ProgramName || 'N/A', 
            school: student.School || 'N/A',
            status: student.AccountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
            fullDetails: student
          }));
          
          setStudents(formattedData);
          setTotalCount(formattedData.length);
          setAllStudentsLoaded(true);
        } else {
          console.error('API returned success: false', response.data);
          setError(response.data.message || 'Không thể tải danh sách sinh viên');
          setOpenSnackbar(true);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
        setError(err.message || 'Lỗi khi tải dữ liệu sinh viên');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    loadAllStudents();
  }, []); // Only run once on component mount

  const handlePageChange = (newPage) => {
    console.log('Page changed to:', newPage);
    setPage(newPage);
    // We don't need to fetch data again since we have all data loaded and use client-side pagination
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log('Page size changed to:', newPageSize);
    setPageSize(newPageSize);
    setPage(0); // Reset to first page when changing page size
    // We don't need to fetch data again since we have all data loaded
  };

  // Add debounce function
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      if (/^\d+$/.test(value.trim())) {
        fetchStudents(0, pageSize, value, true);
        setPage(0);
      }
    }, 500),
    [pageSize]
  );

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // If the search term is numeric, trigger search automatically
    if (/^\d+$/.test(value.trim())) {
      debouncedSearch(value);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // When submitting a search, prioritize ID searches
    fetchStudents(0, pageSize, searchTerm, true);
    setPage(0); // Reset to first page when searching
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      try {
        const response = await axios.delete(`${API_URL}/students/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          // Refresh the list
          fetchStudents(page, pageSize, searchTerm);
          setError("Xóa sinh viên thành công");
          setOpenSnackbar(true);
        } else {
          throw new Error(response.data.message || 'Failed to delete student');
        }
      } catch (err) {
        console.error('Error deleting student:', err);
        setError(err.message || 'Failed to delete student');
        setOpenSnackbar(true);
      }
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student.fullDetails);
  };

  const columns = [
    { 
      field: 'studentId', 
      headerName: 'Mã SV (UserID)', 
      minWidth: 120, 
      flex: 0.5,
      renderHeader: (params) => (
        <Tooltip title="UserID là mã số sinh viên trong hệ thống">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span>Mã SV (UserID)</span>
          </Box>
        </Tooltip>
      )
    },
    { field: 'fullName', headerName: 'Họ và tên', minWidth: 180, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 200, flex: 1.2 },
    { field: 'school', headerName: 'Trường học', minWidth: 180, flex: 1 },
    { field: 'program', headerName: 'Chương trình', minWidth: 180, flex: 1 },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'Active' ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      minWidth: 150,
      flex: 0.7,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ ml: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => handleViewStudent(params.row)}
            title="Xem chi tiết"
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => navigate(`/students/edit/${params.row.id}`)}
            title="Chỉnh sửa"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleDeleteStudent(params.row.id)}
            title="Xóa"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  // Component to display student details
  const StudentDetailView = ({ student }) => {
    if (!student) return null;
    
    return (
      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="div">
              Chi tiết sinh viên (Mã SV: {student.UserID})
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <List disablePadding>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary="Họ và tên" 
                    secondary={student.FullName} 
                    primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary="UserID (Mã Sinh Viên)" 
                    secondary={student.UserID} 
                    primaryTypographyProps={{ variant: 'subtitle2', component: 'span', fontWeight: 'bold' }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary="Email" 
                    secondary={student.Email} 
                    primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List disablePadding>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary="Trường học" 
                    secondary={student.School || 'Chưa cập nhật'} 
                    primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary="Trạng thái tài khoản" 
                    secondary={student.AccountStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'} 
                    primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary="Ngày sinh" 
                    secondary={student.DateOfBirth ? new Date(student.DateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} 
                    primaryTypographyProps={{ variant: 'subtitle2', component: 'span' }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              startIcon={<Edit />} 
              onClick={() => navigate(`/students/edit/${student.UserID}`)}
              sx={{ mr: 1 }}
            >
              Chỉnh sửa
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Visibility />} 
              onClick={() => navigate(`/students/${student.UserID}`)}
            >
              Xem chi tiết
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={error && error.includes('thành công') ? "success" : "error"} 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Show loading alert when data is being fetched */}
      {loading && students.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Đang tải toàn bộ dữ liệu sinh viên từ cơ sở dữ liệu, vui lòng đợi...
        </Alert>
      )}

      {/* Show success message when students are loaded */}
      {!loading && students.length > 0 && !error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Đã tải {students.length} sinh viên từ cơ sở dữ liệu
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="div">
          Quản lý sinh viên
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => navigate('/students/add')}
        >
          Thêm sinh viên
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={9}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Nhập Mã SV (UserID) hoặc tên sinh viên..."
                  value={searchTerm}
                  onChange={handleSearch}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      height: '48px'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth
                  sx={{ 
                    height: '48px',
                    borderRadius: '4px'
                  }}
                >
                  Tìm kiếm
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Display student details if we have a selected student */}
      <StudentDetailView student={selectedStudent} />

      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterAlt sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">
                Danh sách sinh viên (UserID là mã số sinh viên)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {students.length} sinh viên ({loading ? 'đang tải...' : 'đã tải xong'})
            </Typography>
          </Box>
          <Box sx={{ height: 'calc(100vh - 320px)' }}>
            <DataGrid
              rows={students}
              columns={columns}
              pagination
              page={page}
              pageSize={pageSize}
              rowCount={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              rowsPerPageOptions={[10, 25, 50, 100, 500]}
              loading={loading}
              paginationMode="client"
              disableSelectionOnClick
              onRowClick={(params) => handleViewStudent(params.row)}
              initialState={{
                pagination: {
                  pageSize: 100,
                },
              }}
              autoHeight={false}
              density="standard"
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
                },
                // Add hover effect to rows
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  cursor: 'pointer'
                }
              }}
              componentsProps={{
                pagination: {
                  labelRowsPerPage: 'Số hàng mỗi trang:',
                  labelDisplayedRows: ({ from, to, count }) => 
                    `${from}–${to} của ${count !== -1 ? count : `hơn ${to}`}`
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Students; 