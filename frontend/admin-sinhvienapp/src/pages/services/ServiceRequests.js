/*-----------------------------------------------------------------
* File: ServiceRequests.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarMonth
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import viLocale from 'date-fns/locale/vi';
import { format } from 'date-fns';
import { studentServicesApi } from '../../services/api';
import PageContainer from '../../components/layout/PageContainer';

const ServiceRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [services, setServices] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  // Status counts
  const [statusCounts, setStatusCounts] = useState({
    Pending: 0,
    Processing: 0,
    Completed: 0,
    Rejected: 0,
    Cancelled: 0
  });

  // Fetch service requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Build filter parameters
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (serviceFilter) filters.serviceId = serviceFilter;
      if (fromDate) filters.fromDate = format(fromDate, 'yyyy-MM-dd');
      if (toDate) filters.toDate = format(toDate, 'yyyy-MM-dd');

      const response = await studentServicesApi.getAllRequests(filters);
      setRequests(response);
      setFilteredRequests(response);
      
      // Calculate status counts
      const counts = {
        Pending: 0,
        Processing: 0,
        Completed: 0,
        Rejected: 0,
        Cancelled: 0
      };
      
      response.forEach(req => {
        if (counts[req.Status] !== undefined) {
          counts[req.Status]++;
        }
      });
      
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch services for filter
  const fetchServices = async () => {
    try {
      const response = await studentServicesApi.getAllServices();
      setServices(response);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchServices();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    // Only apply search filter here, other filters are applied server-side
    if (searchTerm.trim() === '') {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(request => 
        (request.StudentName && request.StudentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.ServiceName && request.ServiceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.Email && request.Email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRequests(filtered);
    }
  }, [searchTerm, requests]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Set status filter based on tab
    let status = '';
    switch (newValue) {
      case 1: status = 'Pending'; break;
      case 2: status = 'Processing'; break;
      case 3: status = 'Completed'; break;
      case 4: status = 'Rejected'; break;
      case 5: status = 'Cancelled'; break;
      default: status = '';
    }
    
    setStatusFilter(status);
    
    // Apply filter
    fetchRequests();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Processing': return 'info';
      case 'Completed': return 'success';
      case 'Rejected': return 'error';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  // Get status label in Vietnamese
  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ xử lý';
      case 'Processing': return 'Đang xử lý';
      case 'Completed': return 'Hoàn thành';
      case 'Rejected': return 'Từ chối';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Apply filters
  const applyFilters = () => {
    fetchRequests();
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setServiceFilter('');
    setFromDate(null);
    setToDate(null);
    setTabValue(0);
    fetchRequests();
  };

  return (
    <PageContainer title="Quản lý yêu cầu dịch vụ">
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h1" gutterBottom>
              Yêu cầu dịch vụ sinh viên
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterOpen(!filterOpen)}
              sx={{ mr: 1 }}
            >
              Bộ lọc
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchRequests}
            >
              Làm mới
            </Button>
          </Grid>
        </Grid>

        {/* Tabs for quick filtering */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="Tất cả" 
            icon={<Badge badgeContent={requests.length} color="primary" showZero></Badge>}
            iconPosition="end"
          />
          <Tab 
            label="Chờ xử lý" 
            icon={<Badge badgeContent={statusCounts.Pending} color="warning" showZero></Badge>}
            iconPosition="end"
          />
          <Tab 
            label="Đang xử lý" 
            icon={<Badge badgeContent={statusCounts.Processing} color="info" showZero></Badge>}
            iconPosition="end"
          />
          <Tab 
            label="Hoàn thành" 
            icon={<Badge badgeContent={statusCounts.Completed} color="success" showZero></Badge>}
            iconPosition="end"
          />
          <Tab 
            label="Từ chối" 
            icon={<Badge badgeContent={statusCounts.Rejected} color="error" showZero></Badge>}
            iconPosition="end"
          />
          <Tab 
            label="Đã hủy" 
            icon={<Badge badgeContent={statusCounts.Cancelled} color="default" showZero></Badge>}
            iconPosition="end"
          />
        </Tabs>

        {/* Search and filters */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tìm kiếm yêu cầu"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                placeholder="Nhập tên sinh viên, email hoặc tên dịch vụ..."
              />
            </Grid>
            
            {filterOpen && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Dịch vụ</InputLabel>
                    <Select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      label="Dịch vụ"
                    >
                      <MenuItem value="">Tất cả dịch vụ</MenuItem>
                      {services.map((service) => (
                        <MenuItem key={service.ServiceID} value={service.ServiceID}>
                          {service.ServiceName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={viLocale}>
                    <DatePicker
                      label="Từ ngày"
                      value={fromDate}
                      onChange={setFromDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={viLocale}>
                    <DatePicker
                      label="Đến ngày"
                      value={toDate}
                      onChange={setToDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={resetFilters} sx={{ mr: 1 }}>
                    Đặt lại
                  </Button>
                  <Button variant="contained" onClick={applyFilters}>
                    Áp dụng bộ lọc
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sinh viên</TableCell>
                  <TableCell>Dịch vụ</TableCell>
                  <TableCell>Ngày yêu cầu</TableCell>
                  <TableCell>Số lượng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thanh toán</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={40} thickness={4} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Đang tải dữ liệu...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1">
                        Không tìm thấy yêu cầu dịch vụ nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.RegistrationID}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {request.StudentName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {request.Email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.ServiceName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarMonth fontSize="small" color="action" sx={{ mr: 1 }} />
                          {formatDate(request.RequestDate)}
                        </Box>
                      </TableCell>
                      <TableCell>{request.Quantity || 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(request.Status)}
                          color={getStatusColor(request.Status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.PaymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          color={request.PaymentStatus === 'Paid' ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/services/requests/${request.RegistrationID}`)}
                            color="primary"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ServiceRequests; 
