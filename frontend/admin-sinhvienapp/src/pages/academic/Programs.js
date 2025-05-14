import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Search, Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Placeholder for the actual service
const academicService = {
  getPrograms: () => Promise.resolve([
    { id: 1, code: 'CS', name: 'Computer Science', department: 'Engineering', status: 'Active', students: 120 },
    { id: 2, code: 'BA', name: 'Business Administration', department: 'Business', status: 'Active', students: 150 },
    { id: 3, code: 'EE', name: 'Electrical Engineering', department: 'Engineering', status: 'Inactive', students: 80 },
  ])
};

const Programs = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const data = await academicService.getPrograms();
        setPrograms(data);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredPrograms = programs.filter(program => 
    program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: 'code', headerName: 'Mã', width: 100 },
    { field: 'name', headerName: 'Tên chương trình', width: 250 },
    { field: 'department', headerName: 'Khoa', width: 200 },
    { field: 'students', headerName: 'Số sinh viên', width: 130, type: 'number' },
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
          <IconButton size="small" onClick={() => navigate(`/academic/programs/${params.row.id}`)}>
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/academic/programs/${params.row.id}`)}>
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
          Quản lý chương trình đào tạo
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => navigate('/academic/programs/add')}
        >
          Thêm chương trình
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Tìm kiếm chương trình đào tạo..."
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
            rows={filteredPrograms}
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

export default Programs; 