import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem, Container, Tooltip,
  CircularProgress, Avatar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, 
  Search, 
  Edit, 
  Delete, 
  Visibility,
  MenuBook as SubjectIcon,
  BookOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { academicService } from '../../services/api';

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await academicService.getAllSubjects();
        console.log('Subjects response:', response);
        
        if (response.success) {
          // Format the data for the DataGrid
          const formattedData = (response.data || []).map(subject => ({
            id: subject.SubjectID,
            code: subject.SubjectCode,
            name: subject.SubjectName,
            credits: subject.Credits,
            department: subject.Department || 'N/A',
            faculty: subject.Faculty || 'N/A',
            status: subject.IsActive ? 'Active' : 'Inactive',
            description: subject.Description,
            prerequisites: subject.Prerequisites,
            isRequired: subject.IsRequired ? true : false,
            // Keep the original data for reference
            original: subject
          }));
          
          setSubjects(formattedData);
          
          // Extract unique departments for filtering
          const uniqueDepartments = [...new Set(formattedData
            .map(subject => subject.department)
            .filter(department => department && department !== 'N/A'))];
          
          setDepartments(uniqueDepartments);
          console.log('Formatted subjects:', formattedData);
        } else {
          throw new Error(response.message || 'Failed to fetch subjects');
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Không thể tải danh sách môn học. Vui lòng thử lại sau.');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDepartmentFilterChange = (event) => {
    setDepartmentFilter(event.target.value);
  };

  const filteredSubjects = subjects.filter(subject => {
    // Filter by search term
    const matchesSearch = 
      subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.faculty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by department if a department filter is selected
    const matchesDepartment = !departmentFilter || subject.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      try {
        const response = await academicService.deleteSubject(id);
        
        if (response.success) {
          // Remove the subject from the state
          setSubjects(subjects.filter(subject => subject.id !== id));
          setError('Xóa môn học thành công');
          setOpenSnackbar(true);
        } else {
          throw new Error(response.message || 'Failed to delete subject');
        }
      } catch (err) {
        console.error('Error deleting subject:', err);
        setError(err.message || 'Không thể xóa môn học');
        setOpenSnackbar(true);
      }
    }
  };

  const columns = [
    // Subject code column
    { 
      field: 'code', 
      headerName: 'Mã môn', 
      minWidth: 120, 
      flex: 0.6,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500 }}>
          {params.value}
        </Box>
      )
    },
    
    // Subject name column
    { 
      field: 'name', 
      headerName: 'Tên môn học', 
      minWidth: 250, 
      flex: 1.8,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center'
        }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.light', 
              width: 32, 
              height: 32,
              mr: 1.5,
              fontSize: '1rem'
            }}
          >
            {params.value.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.value}
            </Typography>
            {params.row.faculty && params.row.faculty !== 'N/A' && (
              <Typography variant="caption" color="text.secondary">
                {params.row.faculty}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    
    // Credits column
    { 
      field: 'credits', 
      headerName: 'Tín chỉ', 
      minWidth: 100, 
      flex: 0.4, 
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BookOutlined fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }}/>
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      )
    },
    
    // Department column
    { 
      field: 'department', 
      headerName: 'Khoa', 
      minWidth: 150, 
      flex: 1 
    },
    
    // Required column
    { 
      field: 'isRequired', 
      headerName: 'Loại môn', 
      minWidth: 130,
      flex: 0.7,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Bắt buộc' : 'Tự chọn'} 
          color={params.value ? 'primary' : 'default'} 
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500, borderRadius: 1 }}
        />
      )
    },
    
    // Status column
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      minWidth: 120,
      flex: 0.6,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'Active' ? 'success' : 'default'} 
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500, borderRadius: 1 }}
        />
      )
    },
    
    // Actions column
    {
      field: 'actions',
      headerName: 'Thao tác',
      minWidth: 130,
      flex: 0.6,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Xem chi tiết">
            <IconButton 
              size="small" 
              onClick={() => navigate(`/academic/subjects/${params.row.id}`)}
              sx={{ color: 'info.main' }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton 
              size="small" 
              onClick={() => navigate(`/academic/subjects/edit/${params.row.id}`)}
              sx={{ color: 'primary.main' }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteSubject(params.row.id)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
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
        
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SubjectIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" component="h1" fontWeight={600}>
                Quản lý môn học
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quản lý danh sách và thông tin môn học
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => navigate('/academic/subjects/add')}
            sx={{ 
              fontWeight: 500,
              borderRadius: 2,
              px: 2.5
            }}
          >
            Thêm môn học
          </Button>
        </Box>

        {/* Search Card */}
        <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Tìm kiếm theo mã, tên môn học..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                  size="medium"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="department-filter-label">Lọc theo Khoa</InputLabel>
                  <Select
                    labelId="department-filter-label"
                    id="department-filter"
                    value={departmentFilter}
                    onChange={handleDepartmentFilterChange}
                    label="Lọc theo Khoa"
                  >
                    <MenuItem value="">Tất cả các Khoa</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredSubjects.length} môn học
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : error && !error.includes('thành công') ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <Box sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
              <DataGrid
                rows={filteredSubjects}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 }
                  },
                  sorting: {
                    sortModel: [{ field: 'code', sort: 'asc' }]
                  }
                }}
                pageSizeOptions={[5, 10, 25, 50]}
                loading={loading}
                disableSelectionOnClick
                autoHeight={false}
                density="standard"
                sx={{
                  '& .MuiDataGrid-main': { width: '100%' },
                  '& .MuiDataGrid-cell': { px: 2 },
                  '& .MuiDataGrid-columnHeaders': { 
                    bgcolor: 'background.paper', 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    py: 1.5
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600
                  },
                  boxShadow: 0,
                  border: 0,
                  borderColor: 'divider',
                  '& .MuiDataGrid-virtualScroller': {
                    overflowY: 'auto'
                  },
                  '& .MuiDataGrid-row:hover': {
                    bgcolor: 'action.hover'
                  },
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none'
                  },
                  '& .MuiDataGrid-row': {
                    borderBottom: '1px solid #f0f0f0'
                  }
                }}
              />
            </Box>
          )}
        </Card>
      </Box>
    </Container>
  );
};

export default Subjects; 