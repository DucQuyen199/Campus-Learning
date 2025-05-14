import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Search, Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Placeholder for the actual service
const studentsService = {
  getStudents: () => Promise.resolve([
    { id: 1, studentId: 'SV001', fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', program: 'Computer Science', status: 'Active' },
    { id: 2, studentId: 'SV002', fullName: 'Trần Thị B', email: 'tranthib@example.com', program: 'Business Administration', status: 'Active' },
    { id: 3, studentId: 'SV003', fullName: 'Lê Văn C', email: 'levanc@example.com', program: 'Electrical Engineering', status: 'Inactive' }
  ])
};

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentsService.getStudents();
        setStudents(data);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredStudents = students.filter(student => 
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: 'studentId', headerName: 'Mã SV', width: 120 },
    { field: 'fullName', headerName: 'Họ và tên', width: 200 },
    { field: 'email', headerName: 'Email', width: 230 },
    { field: 'program', headerName: 'Chương trình', width: 200 },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      width: 130,
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
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => navigate(`/students/${params.row.id}`)}>
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/students/${params.row.id}`)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
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
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Tìm kiếm sinh viên..."
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
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ height: 500 }}>
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            loading={loading}
            disableSelectionOnClick
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Students; 