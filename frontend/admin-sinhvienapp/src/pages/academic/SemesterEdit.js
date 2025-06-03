import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { academicService } from '../../services/api';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { vi } from 'date-fns/locale';

const SemesterEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    semesterCode: '',
    semesterName: '',
    academicYear: '',
    startDate: null,
    endDate: null,
    registrationStartDate: null,
    registrationEndDate: null,
    status: 'Upcoming',
    isCurrent: false
  });
  
  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [errors, setErrors] = useState({});
  
  // Status options - match database constraints in datasinhvien.sql
  const statusOptions = [
    { value: 'Upcoming', label: 'Sắp tới' },
    { value: 'Ongoing', label: 'Đang diễn ra' },
    { value: 'Completed', label: 'Đã kết thúc' },
    { value: 'Cancelled', label: 'Đã hủy' }
  ];
  
  // Academic years (generate 10 years from current year - 5 to current year + 5)
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - 5 + i;
    return `${year}-${year + 1}`;
  });
  
  useEffect(() => {
    // If we're in edit mode, fetch the semester data
    if (isEditMode) {
      fetchSemesterData();
    }
  }, [/* eslint-disable-next-line react-hooks/exhaustive-deps */id]);
  
  const fetchSemesterData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch the semester data and handle potential errors
      let response;
      try {
        response = await academicService.getSemesterById(id);
      } catch (error) {
        console.error('API call error:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải dữ liệu học kỳ. Học kỳ có thể không tồn tại.',
          severity: 'error'
        });
        setTimeout(() => {
          navigate('/academic/semesters');
        }, 1500);
        return;
      }
      
      if (response && response.success) {
        const semesterData = response.data;
        
        setFormData({
          semesterCode: semesterData.SemesterCode,
          semesterName: semesterData.SemesterName,
          academicYear: semesterData.AcademicYear,
          startDate: semesterData.StartDate ? new Date(semesterData.StartDate) : null,
          endDate: semesterData.EndDate ? new Date(semesterData.EndDate) : null,
          registrationStartDate: semesterData.RegistrationStartDate ? 
            new Date(semesterData.RegistrationStartDate) : null,
          registrationEndDate: semesterData.RegistrationEndDate ? 
            new Date(semesterData.RegistrationEndDate) : null,
          status: semesterData.Status || 'Upcoming',
          isCurrent: semesterData.IsCurrent === true || semesterData.IsCurrent === 1
        });
      } else {
        setSnackbar({
          open: true,
          message: response?.message || 'Không thể tải dữ liệu học kỳ',
          severity: 'error'
        });
        setTimeout(() => {
          navigate('/academic/semesters');
        }, 1500);
      }
    } catch (error) {
      console.error('Error fetching semester data:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Không thể tải dữ liệu học kỳ. Vui lòng thử lại sau.',
        severity: 'error'
      });
      setTimeout(() => {
        navigate('/academic/semesters');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    
    // Clear error for this field when edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.semesterCode) {
      newErrors.semesterCode = 'Mã học kỳ không được để trống';
    }
    
    if (!formData.semesterName) {
      newErrors.semesterName = 'Tên học kỳ không được để trống';
    }
    
    if (!formData.academicYear) {
      newErrors.academicYear = 'Năm học không được để trống';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu không được để trống';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    } else if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.dateRange = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    if (formData.registrationStartDate && formData.registrationEndDate && 
        formData.registrationStartDate > formData.registrationEndDate) {
      newErrors.registrationDateRange = 'Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký';
    }
    
    if (formData.registrationStartDate && formData.startDate && 
        formData.registrationStartDate > formData.startDate) {
      newErrors.registrationStartDate = 'Ngày bắt đầu đăng ký phải trước ngày bắt đầu học kỳ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const payload = {
        semesterCode: formData.semesterCode,
        semesterName: formData.semesterName,
        academicYear: formData.academicYear,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0],
        registrationStartDate: formData.registrationStartDate ? 
          formData.registrationStartDate.toISOString().split('T')[0] : null,
        registrationEndDate: formData.registrationEndDate ? 
          formData.registrationEndDate.toISOString().split('T')[0] : null,
        status: formData.status,
        isCurrent: formData.isCurrent
      };
      
      let response;
      
      if (isEditMode) {
        response = await academicService.updateSemester(id, payload);
      } else {
        response = await academicService.createSemester(payload);
      }
      
      if (response && response.success) {
        setSnackbar({
          open: true,
          message: isEditMode 
            ? 'Cập nhật học kỳ thành công' 
            : 'Thêm học kỳ mới thành công',
          severity: 'success'
        });
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/academic/semesters');
        }, 1500);
      } else {
        throw new Error(response?.message || 'Không thể lưu thông tin học kỳ');
      }
    } catch (error) {
      console.error('Error saving semester:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Không thể lưu thông tin học kỳ. Vui lòng thử lại sau.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/academic/semesters');
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}
          </Typography>
          
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleCancel}
          >
            Quay lại
          </Button>
        </Box>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mã học kỳ"
                  name="semesterCode"
                  value={formData.semesterCode}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={Boolean(errors.semesterCode)}
                  helperText={errors.semesterCode}
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tên học kỳ"
                  name="semesterName"
                  value={formData.semesterName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={Boolean(errors.semesterName)}
                  helperText={errors.semesterName}
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Năm học"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={Boolean(errors.academicYear)}
                  helperText={errors.academicYear}
                  disabled={submitting}
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Trạng thái"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  disabled={submitting}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Thời gian học kỳ
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                  <DatePicker
                    label="Ngày bắt đầu *"
                    value={formData.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        error: Boolean(errors.startDate || errors.dateRange),
                        helperText: errors.startDate || (errors.dateRange && 'Ngày kết thúc phải sau ngày bắt đầu')
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                  <DatePicker
                    label="Ngày kết thúc *"
                    value={formData.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        error: Boolean(errors.endDate || errors.dateRange),
                        helperText: errors.endDate || (errors.dateRange && 'Ngày kết thúc phải sau ngày bắt đầu')
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Thời gian đăng ký môn học
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                  <DatePicker
                    label="Ngày bắt đầu đăng ký"
                    value={formData.registrationStartDate}
                    onChange={(date) => handleDateChange('registrationStartDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        error: Boolean(errors.registrationStartDate || errors.registrationDateRange),
                        helperText: errors.registrationStartDate || (errors.registrationDateRange && 'Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký')
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
                  <DatePicker
                    label="Ngày kết thúc đăng ký"
                    value={formData.registrationEndDate}
                    onChange={(date) => handleDateChange('registrationEndDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        error: Boolean(errors.registrationEndDate || errors.registrationDateRange),
                        helperText: errors.registrationEndDate || (errors.registrationDateRange && 'Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký')
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isCurrent}
                      onChange={handleInputChange}
                      name="isCurrent"
                      color="primary"
                      disabled={submitting}
                    />
                  }
                  label="Đánh dấu là học kỳ hiện tại"
                />
                {formData.isCurrent && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Lưu ý: Khi đánh dấu học kỳ này là hiện tại, học kỳ hiện tại trước đó sẽ không còn là học kỳ hiện tại nữa.
                  </Alert>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancel}
                    sx={{ mr: 2 }}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <CircularProgress size={24} />
                    ) : isEditMode ? (
                      'Cập nhật'
                    ) : (
                      'Lưu'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default SemesterEdit; 