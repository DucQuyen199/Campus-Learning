import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Search, Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { academicService } from '../../services/api';

const Programs = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await academicService.getAllPrograms();
        setPrograms(response.data || []);
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
    program.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: 'code', headerName: 'Mã', minWidth: 100, flex: 0.5 },
    { field: 'name', headerName: 'Tên chương trình', minWidth: 250, flex: 1.5 },
    { field: 'department', headerName: 'Khoa', minWidth: 200, flex: 1 },
    { 
      field: 'students', 
      headerName: 'Số sinh viên', 
      minWidth: 130,
      flex: 0.6,
      type: 'number',
      valueGetter: (params) => params.row.students || 0
    },
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      minWidth: 130,
      flex: 0.6,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Active'} 
          color={params.value === 'Inactive' ? 'default' : 'success'} 
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
        <CardContent sx={{ height: 'calc(100vh - 280px)' }}>
          <DataGrid
            rows={filteredPrograms}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 }
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

export default Programs; 