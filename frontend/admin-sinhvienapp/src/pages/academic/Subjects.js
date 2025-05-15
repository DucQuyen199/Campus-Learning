import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Search, Edit, Delete, Visibility } from '@mui/icons-material';
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
    { field: 'code', headerName: 'Mã môn', minWidth: 100, flex: 0.5 },
    { field: 'name', headerName: 'Tên môn học', minWidth: 200, flex: 1.5 },
    { field: 'credits', headerName: 'Số tín chỉ', minWidth: 100, flex: 0.4, type: 'number' },
    { field: 'department', headerName: 'Khoa', minWidth: 120, flex: 0.8 },
    { field: 'faculty', headerName: 'Ngành', minWidth: 150, flex: 0.8 },
    { 
      field: 'isRequired', 
      headerName: 'Bắt buộc', 
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Bắt buộc' : 'Tự chọn'} 
          color={params.value ? 'primary' : 'default'} 
          size="small" 
        />
      )
    },
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
      flex: 0.6,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => navigate(`/academic/subjects/${params.row.id}`)}
            title="Xem chi tiết"
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => navigate(`/academic/subjects/edit/${params.row.id}`)}
            title="Chỉnh sửa"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error"
            onClick={() => handleDeleteSubject(params.row.id)}
            title="Xóa"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Quản lý môn học
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => navigate('/academic/subjects/add')}
        >
          Thêm môn học
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
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
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ height: 'calc(100vh - 280px)' }}>
          <DataGrid
            rows={filteredSubjects}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 }
              },
              sorting: {
                sortModel: [{ field: 'code', sort: 'asc' }],
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            loading={loading}
            disableSelectionOnClick
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
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Subjects; 