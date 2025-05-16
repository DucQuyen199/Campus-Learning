import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  Button,
  TextField,
  IconButton,
  Chip,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { academicService } from '../../../services/api';

const AcademicWarnings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [totalWarnings, setTotalWarnings] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [semester, setSemester] = useState('');
  const [semesters, setSemesters] = useState([]);

  // Fetch semesters for filter dropdown
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await academicService.getAllSemesters();
        if (response && response.success) {
          setSemesters(response.data || []);
        } else {
          console.error('Failed to fetch semesters:', response?.message);
        }
      } catch (error) {
        console.error('Failed to fetch semesters:', error);
      }
    };

    fetchSemesters();
  }, []);

  // Fetch warnings with filters
  const fetchWarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await academicService.getAcademicWarnings(
        page + 1,
        rowsPerPage,
        search,
        status,
        semester
      );
      
      if (data && data.success) {
        setWarnings(data.warnings || []);
        setTotalWarnings(data.total || 0);
      } else {
        setError('Không thể tải dữ liệu cảnh báo học tập: ' + (data?.message || 'Lỗi không xác định'));
        setWarnings([]);
        setTotalWarnings(0);
      }
    } catch (error) {
      setError('Không thể tải dữ liệu cảnh báo học tập. Vui lòng thử lại sau.');
      console.error('Failed to fetch academic warnings:', error);
      setWarnings([]);
      setTotalWarnings(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWarnings();
  }, [page, rowsPerPage, search, status, semester]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filters
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(0);
  };

  const handleSemesterChange = (event) => {
    setSemester(event.target.value);
    setPage(0);
  };

  // Format status
  const getStatusChip = (status) => {
    switch (status) {
      case 'Active':
        return <Chip label="Đang cảnh báo" color="error" size="small" icon={<WarningIcon />} />;
      case 'Resolved':
        return <Chip label="Đã giải quyết" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'Expired':
        return <Chip label="Hết hạn" color="default" size="small" />;
      default:
        return <Chip label="Không xác định" color="default" size="small" />;
    }
  };

  // Format warning type
  const getWarningTypeText = (type) => {
    switch (type) {
      case 'Level1':
        return 'Cảnh báo mức 1';
      case 'Level2':
        return 'Cảnh báo mức 2';
      case 'Level3':
        return 'Cảnh báo mức 3';
      case 'Suspension':
        return 'Đình chỉ học tập';
      default:
        return type;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // Navigate to details
  const handleViewWarning = (id) => {
    navigate(`/academic/warnings/${id}`);
  };

  // Navigate to add warning
  const handleAddWarning = () => {
    navigate('/academic/warnings/add');
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Cảnh báo học tập
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddWarning}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 600,
            boxShadow: (theme) => theme.shadows[2],
          }}
        >
          Thêm cảnh báo
        </Button>
      </Box>

      {/* Filters */}
      <Card 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tìm kiếm theo mã SV, tên hoặc ID"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              placeholder="Nhập mã SV, tên hoặc UserID..."
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
                label="Trạng thái"
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="Active">Đang cảnh báo</MenuItem>
                <MenuItem value="Resolved">Đã giải quyết</MenuItem>
                <MenuItem value="Expired">Hết hạn</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={semester}
                onChange={handleSemesterChange}
                label="Học kỳ"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {semesters.map((sem) => (
                  <MenuItem key={sem.id} value={sem.id}>
                    {sem.name} - {sem.AcademicYear || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearch('');
                setStatus('');
                setSemester('');
              }}
              sx={{ py: 1.75 }}
            >
              Đặt lại
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Results */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                <TableCell>Mã SV</TableCell>
                <TableCell>Họ tên sinh viên</TableCell>
                <TableCell>UserID</TableCell>
                <TableCell>Học kỳ</TableCell>
                <TableCell>Loại cảnh báo</TableCell>
                <TableCell>Ngày cảnh báo</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Đang tải dữ liệu...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : warnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1">
                      Không tìm thấy dữ liệu cảnh báo học tập
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                warnings.map((warning) => (
                  <TableRow key={warning.WarningID} hover>
                    <TableCell>{warning.StudentID}</TableCell>
                    <TableCell>{warning.StudentName}</TableCell>
                    <TableCell>{warning.UserID}</TableCell>
                    <TableCell>
                      {warning.SemesterName}
                      {warning.AcademicYear && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Năm học: {warning.AcademicYear}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getWarningTypeText(warning.WarningType)}</TableCell>
                    <TableCell>{formatDate(warning.WarningDate)}</TableCell>
                    <TableCell>{getStatusChip(warning.Status)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton 
                          onClick={() => handleViewWarning(warning.WarningID)}
                          size="small"
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          onClick={() => navigate(`/academic/warnings/edit/${warning.WarningID}`)}
                          size="small"
                          color="secondary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalWarnings}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Hiển thị:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
        />
      </Card>
    </Box>
  );
};

export default AcademicWarnings; 