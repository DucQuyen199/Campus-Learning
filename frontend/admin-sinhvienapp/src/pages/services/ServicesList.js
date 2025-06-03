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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentServicesApi } from '../../services/api';
import PageContainer from '../../components/layout/PageContainer';

const ServicesList = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await studentServicesApi.getAllServices();
      setServices(response);
      setFilteredServices(response);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service => 
        service.ServiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.Department && service.Department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  // Handle edit
  const handleEdit = (serviceId) => {
    navigate(`/services/edit/${serviceId}`);
  };

  // Handle delete
  const handleDeleteClick = (service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    // Note: Delete functionality would be implemented here
    // For now, just close dialog and refresh
    setDeleteDialogOpen(false);
    fetchServices();
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedService(null);
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <PageContainer title="Quản lý dịch vụ sinh viên">
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h1" gutterBottom>
              Danh sách dịch vụ sinh viên
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/services/add')}
              sx={{ mr: 1 }}
            >
              Thêm dịch vụ mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchServices}
            >
              Làm mới
            </Button>
          </Grid>
        </Grid>

        <Card sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Tìm kiếm dịch vụ"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
              placeholder="Nhập tên dịch vụ hoặc phòng ban..."
              sx={{ mr: 2 }}
            />
          </Box>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên dịch vụ</TableCell>
                  <TableCell>Giá</TableCell>
                  <TableCell>Thời gian xử lý</TableCell>
                  <TableCell>Phòng ban</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={40} thickness={4} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Đang tải dữ liệu...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1">
                        Không tìm thấy dịch vụ nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.ServiceID}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {service.ServiceName}
                        </Typography>
                        {service.Description && (
                          <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                            {service.Description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(service.Price)}</TableCell>
                      <TableCell>{service.ProcessingTime || 'N/A'}</TableCell>
                      <TableCell>{service.Department || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={service.IsActive ? "Đang hoạt động" : "Tạm ngưng"}
                          color={service.IsActive ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Chỉnh sửa">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit(service.ServiceID)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(service)} 
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Xác nhận xóa dịch vụ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa dịch vụ "{selectedService?.ServiceName}"? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ServicesList; 