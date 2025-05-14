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
        const data = await academicService.getAllSemesters();
        setSemesters(data.semesters || []);
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
      setWarnings(data.warnings || []);
      setTotalWarnings(data.total || 0);
    } catch (error) {
      setError('Không thể tải dữ liệu cảnh báo học tập. Vui lòng thử lại sau.');
      console.error('Failed to fetch academic warnings:', error);
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
      case 'active':
        return <Chip label="Đang cảnh báo" color="error" size="small" icon={<WarningIcon />} />;
      case 'resolved':
        return <Chip label="Đã giải quyết" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'expired':
        return <Chip label="Hết hạn" color="default" size="small" />;
      default:
        return <Chip label="Không xác định" color="default" size="small" />;
    }
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
              label="Tìm kiếm theo mã SV hoặc tên"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
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
                <MenuItem value="active">Đang cảnh báo</MenuItem>
                <MenuItem value="resolved">Đã giải quyết</MenuItem>
                <MenuItem value="expired">Hết hạn</MenuItem>
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
                    {sem.name}
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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Mã sinh viên</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Họ tên</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Loại cảnh báo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lý do</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Học kỳ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày tạo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : warnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1">Không tìm thấy cảnh báo học tập nào</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                warnings.map((warning) => (
                  <TableRow key={warning.id} hover>
                    <TableCell>{warning.studentCode}</TableCell>
                    <TableCell>{warning.studentName}</TableCell>
                    <TableCell>{warning.warningType}</TableCell>
                    <TableCell>{warning.reason}</TableCell>
                    <TableCell>{warning.semesterName}</TableCell>
                    <TableCell>{new Date(warning.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{getStatusChip(warning.status)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewWarning(warning.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {warning.status === 'active' && (
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              color="secondary"
                              size="small"
                              onClick={() => navigate(`/academic/warnings/${warning.id}/edit`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
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
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
        />
      </Card>
    </Box>
  );
};

export default AcademicWarnings; 