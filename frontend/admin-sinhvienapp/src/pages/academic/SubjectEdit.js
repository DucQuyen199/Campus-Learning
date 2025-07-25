/*-----------------------------------------------------------------
* File: SubjectEdit.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, Paper, 
  FormControlLabel, Switch, Divider, CircularProgress,
  Snackbar, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Save, ArrowBack, Cancel } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { academicService } from '../../services/api';

const SubjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  // Form state
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: 3,
    theoryCredits: 2,
    practiceCredits: 1,
    prerequisites: '',
    description: '',
    department: '',
    faculty: '',
    isRequired: true,
    isActive: true
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
  
  // Department and faculty options
// eslint-disable-next-line no-unused-vars
  const [departments, setDepartments] = useState([
    'KHOA KINH TẾ',
    'KHOA TÀI CHÍNH',
    'KHOA QUẢN LÝ KINH DOANH',
    'KHOA KẾ TOÁN',
    'KHOA THƯƠNG MẠI',
    'KHOA NGÂN HÀNG',
    'KHOA LUẬT KINH TẾ',
    'KHOA QUẢN LÝ NHÀ NƯỚC',
    'KHOA TRIẾT HỌC VÀ KHOA HỌC XÃ HỘI',
    'KHOA GIAO DỤC THẾ CHẤT',
    'KHOA GIÁO DỤC QUỐC PHÒNG VÀ AN NINH',
    'KHOA MÔI TRƯỜNG',
    'KHOA DU LỊCH',
    'KHOA CNTT',
    'KHOA ĐIỆN - ĐIỆN TỬ',
    'KHOA CƠ ĐIỆN TỬ VÀ Ô TÔ',
    'KHOA TOÁN',
    'KHOA XÂY DỰNG',
    'KHOA MỸ THUẬT ỨNG DỤNG',
    'KHOA KIẾN TRÚC',
    'KHOA TRUNG - NHẬT',
    'KHOA TIẾNG ANH A',
    'KHOA NGÔN NGỮ NGA - HÀN',
    'KHOA TIẾNG ANH B',
    'KHOA TIẾNG VIỆT',
    'KHOA NGÔN NGỮ ANH',
    'KHOA ĐIỀU DƯỠNG',
    'KHOA Y',
    'KHOA DƯỢC',
    'KHOA RĂNG HÀM MẶT'
  ]);
  
  const [faculties, setFaculties] = useState([]);
  const [loadingFaculties, setLoadingFaculties] = useState(true);
  
  // Fetch programs for faculty dropdown
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingFaculties(true);
        const response = await academicService.getAllPrograms();
        
        if (response && response.data) {
          // Extract program names for the faculty dropdown
          const programNames = response.data.map(program => program.name);
          // Remove duplicates
          const uniquePrograms = [...new Set(programNames)].filter(Boolean).sort();
          setFaculties(uniquePrograms);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải danh sách chương trình đào tạo',
          severity: 'error'
        });
      } finally {
        setLoadingFaculties(false);
      }
    };
    
    fetchPrograms();
  }, []);
  
  useEffect(() => {
    // If we're in edit mode, fetch the subject data
    if (isEditMode) {
      fetchSubjectData();
    }
  }, [/* eslint-disable-next-line react-hooks/exhaustive-deps */id]);
  
  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      const response = await academicService.getSubjectById(id);
      
      if (response.success) {
        const subjectData = response.data;
        setFormData({
          subjectCode: subjectData.SubjectCode || '',
          subjectName: subjectData.SubjectName || '',
          credits: subjectData.Credits || 3,
          theoryCredits: subjectData.TheoryCredits || 0,
          practiceCredits: subjectData.PracticeCredits || 0,
          prerequisites: subjectData.Prerequisites || '',
          description: subjectData.Description || '',
          department: subjectData.Department || '',
          faculty: subjectData.Faculty || '',
          isRequired: subjectData.IsRequired === true || subjectData.IsRequired === 1,
          isActive: subjectData.IsActive === true || subjectData.IsActive === 1
        });
      } else {
        throw new Error(response.message || 'Failed to fetch subject data');
      }
    } catch (error) {
      console.error('Error fetching subject data:', error);
      setSnackbar({
        open: true,
        message: 'Không thể tải dữ liệu môn học. Vui lòng thử lại sau.',
        severity: 'error'
      });
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
  
  const handleNumberChange = (event) => {
    const { name, value } = event.target;
    // Convert to number and validate
    const numValue = value === '' ? '' : Number(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
    
    // Clear error for this field when edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subjectCode) {
      newErrors.subjectCode = 'Mã môn học không được để trống';
    }
    
    if (!formData.subjectName) {
      newErrors.subjectName = 'Tên môn học không được để trống';
    }
    
    if (formData.credits === '' || formData.credits <= 0) {
      newErrors.credits = 'Số tín chỉ phải lớn hơn 0';
    }
    
    if (formData.theoryCredits === '' || formData.practiceCredits === '') {
      newErrors.creditDistribution = 'Vui lòng điền đầy đủ thông tin số tín chỉ lý thuyết và thực hành';
    } else if (Number(formData.theoryCredits) + Number(formData.practiceCredits) !== Number(formData.credits)) {
      newErrors.creditDistribution = 'Tổng số tín chỉ lý thuyết và thực hành phải bằng tổng số tín chỉ';
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
        subjectCode: formData.subjectCode,
        subjectName: formData.subjectName,
        credits: Number(formData.credits),
        theoryCredits: Number(formData.theoryCredits),
        practiceCredits: Number(formData.practiceCredits),
        prerequisites: formData.prerequisites,
        description: formData.description,
        department: formData.department,
        faculty: formData.faculty,
        isRequired: formData.isRequired,
        isActive: formData.isActive
      };
      
      let response;
      if (isEditMode) {
        response = await academicService.updateSubject(id, payload);
      } else {
        response = await academicService.createSubject(payload);
      }
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: isEditMode 
            ? 'Cập nhật môn học thành công' 
            : 'Thêm môn học mới thành công',
          severity: 'success'
        });
        
        // Navigate back after a short delay
        setTimeout(() => {
          if (isEditMode) {
            navigate(`/academic/subjects/${id}`);
          } else {
            navigate('/academic/subjects');
          }
        }, 1500);
      } else {
        throw new Error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Đã xảy ra lỗi khi lưu dữ liệu. Vui lòng thử lại.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/academic/subjects/${id}`);
    } else {
      navigate('/academic/subjects');
    }
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
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
          </Typography>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mã môn học"
                name="subjectCode"
                value={formData.subjectCode}
                onChange={handleInputChange}
                error={Boolean(errors.subjectCode)}
                helperText={errors.subjectCode}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tên môn học"
                name="subjectName"
                value={formData.subjectName}
                onChange={handleInputChange}
                error={Boolean(errors.subjectName)}
                helperText={errors.subjectName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tổng số tín chỉ"
                name="credits"
                type="number"
                value={formData.credits}
                onChange={handleNumberChange}
                error={Boolean(errors.credits)}
                helperText={errors.credits}
                required
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tín chỉ lý thuyết"
                name="theoryCredits"
                type="number"
                value={formData.theoryCredits}
                onChange={handleNumberChange}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tín chỉ thực hành"
                name="practiceCredits"
                type="number"
                value={formData.practiceCredits}
                onChange={handleNumberChange}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            
            {errors.creditDistribution && (
              <Grid item xs={12}>
                <Alert severity="error">{errors.creditDistribution}</Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Thông tin phân loại
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="department-label">Khoa</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  name="department"
                  value={formData.department}
                  label="Khoa"
                  onChange={handleInputChange}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="faculty-label">Ngành</InputLabel>
                <Select
                  labelId="faculty-label"
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  label="Ngành"
                  onChange={handleInputChange}
                  disabled={loadingFaculties}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {faculties.map(fac => (
                    <MenuItem key={fac} value={fac}>{fac}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Môn học tiên quyết"
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleInputChange}
                placeholder="Nhập các môn tiên quyết, phân cách bằng dấu phẩy"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả môn học"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Cài đặt bổ sung
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="isRequired"
                    checked={formData.isRequired}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Môn học bắt buộc"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    color="success"
                  />
                }
                label="Môn học đang hoạt động"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Thêm môn học')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default SubjectEdit; 
