/*-----------------------------------------------------------------
* File: ServiceForm.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  InputAdornment,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { studentServicesApi } from '../../services/api';
import PageContainer from '../../components/layout/PageContainer';

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    price: '',
    processingTime: '',
    requiredDocuments: '',
    department: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch service details if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchServiceDetails();
    }
  }, [id]);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      const response = await studentServicesApi.getServiceById(id);
      setFormData({
        serviceName: response.ServiceName || '',
        description: response.Description || '',
        price: response.Price || '',
        processingTime: response.ProcessingTime || '',
        requiredDocuments: response.RequiredDocuments || '',
        department: response.Department || '',
        isActive: response.IsActive !== undefined ? response.IsActive : true
      });
    } catch (error) {
      console.error('Error fetching service details:', error);
      setError('Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.serviceName) {
        throw new Error('Vui lòng nhập tên dịch vụ');
      }

      if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
        throw new Error('Vui lòng nhập giá dịch vụ hợp lệ');
      }

      const serviceData = {
        serviceName: formData.serviceName,
        description: formData.description,
        price: parseFloat(formData.price),
        processingTime: formData.processingTime,
        requiredDocuments: formData.requiredDocuments,
        department: formData.department,
        isActive: formData.isActive
      };

      if (isEditMode) {
        await studentServicesApi.updateService(id, serviceData);
        setSnackbar({
          open: true,
          message: 'Cập nhật dịch vụ thành công',
          severity: 'success'
        });
        // Redirect back to services list after update
        navigate('/services');
      } else {
        await studentServicesApi.createService(serviceData);
        setSnackbar({
          open: true,
          message: 'Thêm dịch vụ mới thành công',
          severity: 'success'
        });
        // Reset form after successful creation
        setFormData({
          serviceName: '',
          description: '',
          price: '',
          processingTime: '',
          requiredDocuments: '',
          department: '',
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error saving service:', error);
      setError(error.message || 'Không thể lưu dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <PageContainer title={isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}>
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/services')}
          sx={{ mb: 2 }}
        >
          Quay lại danh sách
        </Button>

        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ p: 3, mt: 2 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  name="serviceName"
                  label="Tên dịch vụ"
                  fullWidth
                  required
                  value={formData.serviceName}
                  onChange={handleChange}
                  disabled={submitting}
                  helperText="Nhập tên dịch vụ sinh viên"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  name="price"
                  label="Giá dịch vụ"
                  fullWidth
                  required
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={submitting}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    step: 1000
                  }}
                  helperText="Nhập giá dịch vụ (VNĐ)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Mô tả dịch vụ"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={submitting}
                  helperText="Mô tả chi tiết về dịch vụ"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="processingTime"
                  label="Thời gian xử lý"
                  fullWidth
                  value={formData.processingTime}
                  onChange={handleChange}
                  disabled={submitting}
                  helperText="Ví dụ: 1-2 ngày làm việc, 3-5 ngày làm việc"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="department"
                  label="Phòng ban phụ trách"
                  fullWidth
                  value={formData.department}
                  onChange={handleChange}
                  disabled={submitting}
                  helperText="Phòng ban xử lý yêu cầu dịch vụ"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="requiredDocuments"
                  label="Giấy tờ cần thiết"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.requiredDocuments}
                  onChange={handleChange}
                  disabled={submitting}
                  helperText="Giấy tờ sinh viên cần cung cấp"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      disabled={submitting}
                      color="primary"
                    />
                  }
                  label="Dịch vụ đang hoạt động"
                />
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/services')}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu dịch vụ'
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default ServiceForm; 
