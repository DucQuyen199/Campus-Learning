/*-----------------------------------------------------------------
* File: TuitionList.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
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
  Breadcrumbs,
  Link,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
// eslint-disable-next-line no-unused-vars
  Edit as EditIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
// eslint-disable-next-line no-unused-vars
  CreditCard as CreditCardIcon,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { tuitionService, academicService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const TuitionList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // State to control fetching and displaying all records
  const [showAllList, setShowAllList] = useState(false);

  // If navigated back from generation with showAll flag, set showAllList
  useEffect(() => {
    if (location.state && location.state.showAll) {
      setShowAllList(true);
    }
  }, [location.state]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tuitionList, setTuitionList] = useState([]);
  const [totalTuition, setTotalTuition] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [semester, setSemester] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [semestersLoading, setSemestersLoading] = useState(true);

  // Reset filters and enable show-all when navigated from generation
  useEffect(() => {
    if (location.state && location.state.showAll) {
      setSearch('');
      setStatus('');
      setSemester('');
      setPage(0);
      setShowAllList(true);
      // Clear navigation state so this runs only once
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Fetch semesters for filter dropdown
  useEffect(() => {
    const fetchSemesters = async () => {
      setSemestersLoading(true);
      try {
        const data = await academicService.getAllSemesters();
        setSemesters(data.semesters || []);
      } catch (error) {
        console.error('Failed to fetch semesters:', error);
      } finally {
        setSemestersLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  // Fetch tuition list with filters
  const fetchTuition = async () => {
    setLoading(true);
    setError(null);
    try {
      // Determine pagination or fetch-all mode
      const fetchPage = showAllList ? 1 : page + 1;
      const fetchLimit = showAllList ? -1 : rowsPerPage;
      // Fetch tuition data from API
      const response = await tuitionService.getAllTuition(
        fetchPage,
        fetchLimit,
        search,
        semester,
        status
      );
      if (response.success) {
        // Map API fields to UI fields
        const list = (response.data || []).map(item => ({
          id: item.TuitionID,
          studentCode: item.UserID,
          studentName: item.FullName,
          semesterName: item.SemesterName,
          totalAmount: item.FinalAmount,
          paidAmount: item.PaidAmount || 0,
          remainingAmount: (item.FinalAmount || 0) - (item.PaidAmount || 0),
          dueDate: item.DueDate,
          status: item.Status
        }));
        setTuitionList(list);
        setTotalTuition(response.pagination?.total || list.length);
        // If in showAll mode, clear it after first load
        if (showAllList) {
          setShowAllList(false);
        }
      } else {
        setError(response.message || 'Không thể tải dữ liệu học phí. Vui lòng thử lại sau.');
        setTuitionList([]);
        setTotalTuition(0);
      }
    } catch (error) {
      setError('Không thể tải dữ liệu học phí. Vui lòng thử lại sau.');
      console.error('Failed to fetch tuition data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchTuition();
  }, [/* eslint-disable-next-line react-hooks/exhaustive-deps */page, rowsPerPage, search, status, semester, showAllList]);

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

  // Format status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'unpaid':
        return <Chip label="Chưa thanh toán" color="error" size="small" />;
      case 'partial':
        return <Chip label="Đóng một phần" color="warning" size="small" />;
      case 'paid':
        return <Chip label="Đã thanh toán" color="success" size="small" />;
      case 'overdue':
        return <Chip label="Quá hạn" color="error" size="small" variant="outlined" />;
      case 'waived':
        return <Chip label="Miễn giảm" color="info" size="small" />;
      default:
        return <Chip label="Không xác định" color="default" size="small" />;
    }
  };

  // Navigate to details
  const handleViewTuition = (id) => {
    navigate(`/finance/tuition/${id}`);
  };

  // Navigate to payment processing
  const handleProcessPayment = (id, event) => {
    event.stopPropagation();
    navigate(`/finance/tuition/${id}/payment`);
  };

  // Navigate to generate tuition page
  const handleGenerateTuition = () => {
    navigate('/finance/tuition/generate');
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
            Dashboard
          </Link>
          <Typography color="text.primary">Quản lý học phí</Typography>
        </Breadcrumbs>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoney sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" component="h1" fontWeight={600}>
                Quản lý học phí
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quản lý học phí và thanh toán học phí sinh viên
              </Typography>
            </Box>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleGenerateTuition}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 500,
              }}
            >
              Tạo hoá đơn học phí
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => setShowAllList(true)}
              sx={{
                borderRadius: 2,
                ml: 2,
                px: 2.5,
                py: 1,
                fontWeight: 500,
              }}
            >
              Hiển thị tất cả
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
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
                <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                  value={status}
                  onChange={handleStatusChange}
                  label="Trạng thái thanh toán"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
                  <MenuItem value="partial">Đóng một phần</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="overdue">Quá hạn</MenuItem>
                  <MenuItem value="waived">Miễn giảm</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined" disabled={semestersLoading}>
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
                sx={{ py: 1.75, borderRadius: 2 }}
              >
                Đặt lại
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Results */}
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
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
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã sinh viên</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Họ tên</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Học kỳ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tổng học phí</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Đã thanh toán</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Còn lại</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Hạn đóng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : tuitionList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1">Không tìm thấy thông tin học phí nào</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tuitionList.map((tuition) => (
                    <TableRow 
                      key={tuition.id} 
                      hover 
                      onClick={() => handleViewTuition(tuition.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{tuition.studentCode}</TableCell>
                      <TableCell>{tuition.studentName}</TableCell>
                      <TableCell>{tuition.semesterName}</TableCell>
                      <TableCell>{formatCurrency(tuition.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(tuition.paidAmount)}</TableCell>
                      <TableCell>{formatCurrency(tuition.remainingAmount)}</TableCell>
                      <TableCell>
                        {tuition.dueDate ? new Date(tuition.dueDate).toLocaleDateString('vi-VN') : '--'}
                      </TableCell>
                      <TableCell>{getStatusChip(tuition.status)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTuition(tuition.id);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {(tuition.status === 'unpaid' || tuition.status === 'partial' || tuition.status === 'overdue') && (
                            <Tooltip title="Xử lý thanh toán">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={(e) => handleProcessPayment(tuition.id, e)}
                              >
                                <PaymentIcon fontSize="small" />
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

          {!showAllList && (
          <TablePagination
            component="div"
            count={totalTuition}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          />
          )}
        </Card>
      </Box>
    </Container>
  );
};

export default TuitionList; 
