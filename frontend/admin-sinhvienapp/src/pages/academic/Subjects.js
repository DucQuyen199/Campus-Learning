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
  getSubjects: () => Promise.resolve([
    { id: 1, code: 'CS101', name: 'Nhập môn lập trình', credits: 4, department: 'Engineering', program: 'Computer Science', status: 'Active' },
    { id: 2, code: 'CS201', name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, department: 'Engineering', program: 'Computer Science', status: 'Active' },
    { id: 3, code: 'BA101', name: 'Kinh tế vĩ mô', credits: 3, department: 'Business', program: 'Business Administration', status: 'Active' },
    { id: 4, code: 'EE101', name: 'Mạch điện', credits: 3, department: 'Engineering', program: 'Electrical Engineering', status: 'Inactive' },
  ])
};

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await academicService.getSubjects();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredSubjects = subjects.filter(subject => 
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: 'code', headerName: 'Mã', width: 120 },
    { field: 'name', headerName: 'Tên môn học', width: 300 },
    { field: 'credits', headerName: 'Số tín chỉ', width: 100, type: 'number' },
    { field: 'department', headerName: 'Khoa', width: 150 },
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
          <IconButton size="small" onClick={() => navigate(`/academic/subjects/${params.row.id}`)}>
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/academic/subjects/${params.row.id}`)}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Tìm kiếm môn học..."
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
            rows={filteredSubjects}
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

export default Subjects; 