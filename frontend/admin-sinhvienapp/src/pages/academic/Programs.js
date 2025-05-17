import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, IconButton, Chip, Avatar, Tooltip,
  Container, CircularProgress, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, Search, Edit, Delete, Visibility, School,
  BookOutlined, AccessTime, HowToReg
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { academicService } from '../../services/api';

const Programs = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await academicService.getAllPrograms();
        
        if (response && response.success) {
          // Map the academic programs to the correct field names for display
          const formattedPrograms = (response.data || []).map(program => ({
            id: program.ProgramID,
            code: program.ProgramCode,
            name: program.ProgramName,
            department: program.Department,
            faculty: program.Faculty,
            description: program.Description,
            totalCredits: program.TotalCredits,
            programDuration: program.ProgramDuration,
            degreeName: program.DegreeName,
            programType: program.ProgramType,
            isActive: program.IsActive,
            students: program.StudentCount || 0, // Field might be included in API response
            status: program.IsActive ? 'Active' : 'Inactive'
          }));
          
          setPrograms(formattedPrograms);
        } else {
          throw new Error(response?.message || 'Failed to fetch programs');
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu chương trình đào tạo');
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
    program.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.faculty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.degreeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgramTypeLabel = (type) => {
    const types = {
      'regular': 'Chính quy',
      'transfer': 'Liên thông',
      'second': 'Văn bằng 2',
      'international': 'Quốc tế',
      'specialized': 'Chuyên ngành'
    };
    return types[type] || type || 'Chính quy';
  };

  const columns = [
    // Program code column
    { 
      field: 'code', 
      headerName: 'Mã', 
      minWidth: 120, 
      flex: 0.6, 
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500 }}>
          {params.value}
        </Box>
      )
    },
    
    // Program name column
    { 
      field: 'name', 
      headerName: 'Tên chương trình', 
      minWidth: 280, 
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
            {params.row.degreeName && (
              <Typography variant="caption" color="text.secondary">
                {params.row.degreeName}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    
    // Department/Faculty column
    { 
      field: 'department', 
      headerName: 'Khoa', 
      minWidth: 180, 
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">
            {params.value || '—'}
          </Typography>
          {params.row.faculty && (
            <Typography variant="caption" color="text.secondary">
              {params.row.faculty}
            </Typography>
          )}
        </Box>
      )
    },
    
    // Credits & Duration column
    { 
      field: 'totalCredits', 
      headerName: 'Tín chỉ/Kỳ học', 
      minWidth: 140,
      flex: 0.7,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Tổng số tín chỉ">
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
              <BookOutlined fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }}/>
              <Typography variant="body2">
                {params.value || '—'}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Số học kỳ">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime fontSize="small" sx={{ mr: 0.5, color: 'secondary.main' }}/>
              <Typography variant="body2">
                {params.row.programDuration || '—'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      )
    },
    
    // Students count column
    { 
      field: 'students', 
      headerName: 'Sinh viên', 
      minWidth: 110,
      flex: 0.6,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HowToReg fontSize="small" sx={{ mr: 0.5, color: 'success.main' }}/>
          <Typography variant="body2">
            {params.value}
          </Typography>
        </Box>
      )
    },
    
    // Program type column
    { 
      field: 'programType', 
      headerName: 'Loại hình', 
      minWidth: 140,
      flex: 0.7,
      renderCell: (params) => (
        <Typography variant="body2">
          {getProgramTypeLabel(params.value)}
        </Typography>
      )
    },
    
    // Status column
    { 
      field: 'status', 
      headerName: 'Trạng thái', 
      minWidth: 130,
      flex: 0.6,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Active'} 
          color={params.value !== 'Inactive' ? 'success' : 'default'} 
          size="small" 
          variant="outlined"
          sx={{ 
            fontWeight: 500,
            borderRadius: 1
          }}
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
              onClick={() => navigate(`/academic/programs/${params.row.id}`)}
              sx={{ color: 'info.main' }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton 
              size="small" 
              onClick={() => navigate(`/academic/programs/edit/${params.row.id}`)}
              sx={{ color: 'primary.main' }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton 
              size="small" 
              color="error"
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
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <School sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" component="h1" fontWeight={600}>
                Quản lý chương trình đào tạo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quản lý các chương trình học và ngành đào tạo
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => navigate('/academic/programs/add')}
            sx={{ 
              fontWeight: 500,
              borderRadius: 2,
              px: 2.5
            }}
          >
            Thêm chương trình
          </Button>
        </Box>

        {/* Search Card */}
        <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Tìm kiếm theo mã, tên, khoa..."
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
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredPrograms.length} chương trình
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
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <Box sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
              <DataGrid
                rows={filteredPrograms}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 }
                  },
                  sorting: {
                    sortModel: [{ field: 'name', sort: 'asc' }]
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

export default Programs; 