/*-----------------------------------------------------------------
* File: ProgramEdit.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Paper, TextField,
  MenuItem, FormControl, FormHelperText, InputLabel, Select,
  Divider, FormControlLabel, Switch, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { academicService } from '../../services/api';

// List of departments
const departments = [
  { id: 1, name: 'KHOA KINH TẾ' },
  { id: 2, name: 'KHOA TÀI CHÍNH' },
  { id: 3, name: 'KHOA QUẢN LÝ KINH DOANH' },
  { id: 4, name: 'KHOA KẾ TOÁN' },
  { id: 5, name: 'KHOA THƯƠNG MẠI' },
  { id: 6, name: 'KHOA NGÂN HÀNG' },
  { id: 7, name: 'KHOA LUẬT KINH TẾ' },
  { id: 8, name: 'KHOA QUẢN LÝ NHÀ NƯỚC' },
  { id: 9, name: 'KHOA TRIẾT HỌC VÀ KHOA HỌC XÃ HỘI' },
  { id: 10, name: 'KHOA GIAO DỤC THẾ CHẤT' },
  { id: 11, name: 'KHOA GIÁO DỤC QUỐC PHÒNG VÀ AN NINH' },
  { id: 12, name: 'KHOA MÔI TRƯỜNG' },
  { id: 13, name: 'KHOA DU LỊCH' },
  { id: 14, name: 'KHOA CNTT' },
  { id: 15, name: 'KHOA ĐIỆN - ĐIỆN TỬ' },
  { id: 16, name: 'KHOA CƠ ĐIỆN TỬ VÀ Ô TÔ' },
  { id: 17, name: 'KHOA TOÁN' },
  { id: 18, name: 'KHOA XÂY DỰNG' },
  { id: 19, name: 'KHOA MỸ THUẬT ỨNG DỤNG' },
  { id: 20, name: 'KHOA KIẾN TRÚC' },
  { id: 21, name: 'KHOA TRUNG - NHẬT' },
  { id: 22, name: 'KHOA TIẾNG ANH A' },
  { id: 23, name: 'KHOA NGÔN NGỮ NGA - HÀN' },
  { id: 24, name: 'KHOA TIẾNG ANH B' },
  { id: 25, name: 'KHOA TIẾNG VIỆT' },
  { id: 26, name: 'KHOA NGÔN NGỮ ANH' },
  { id: 27, name: 'KHOA ĐIỀU DƯỠNG' },
  { id: 28, name: 'KHOA Y' },
  { id: 29, name: 'KHOA DƯỢC' },
  { id: 30, name: 'KHOA RĂNG HÀM MẶT' }
];

const validationSchema = Yup.object({
  code: Yup.string().required('Mã chương trình là bắt buộc'),
  name: Yup.string().required('Tên chương trình là bắt buộc'),
  department: Yup.string().required('Khoa phụ trách là bắt buộc'),
  description: Yup.string().required('Mô tả là bắt buộc'),
  duration: Yup.number().required('Thời gian đào tạo là bắt buộc').min(1, 'Thời gian đào tạo tối thiểu là 1 năm'),
  totalCredits: Yup.number().required('Số tín chỉ là bắt buộc').min(30, 'Số tín chỉ tối thiểu là 30'),
  degree: Yup.string().required('Bằng cấp là bắt buộc')
});

const ProgramEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
// eslint-disable-next-line no-unused-vars
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Initial form values - will be updated once program data is loaded
  const [initialValues, setInitialValues] = useState({
    code: '',
    name: '',
    department: '',
    faculty: '',
    description: '',
    duration: 4,
    totalCredits: 150,
    degree: '',
    type: 'Standard',
    status: 'Active'
  });

  useEffect(() => {
    // Parse and validate the ID parameter
    const programId = parseInt(id, 10);
    if (isNaN(programId)) {
      // Invalid ID, redirect to the programs list
      navigate('/academic/programs', { replace: true });
      return;
    }

    const fetchProgramDetails = async () => {
      try {
        setLoading(true);
        const response = await academicService.getProgramById(programId);

        if (response.success) {
          const programData = response.data;
          setProgram(programData);

          // Set initial form values based on the fetched data
          setInitialValues({
            code: programData.ProgramCode || '',
            name: programData.ProgramName || '',
            department: programData.Department || '',
            faculty: programData.Faculty || '',
            description: programData.Description || '',
            duration: programData.ProgramDuration || 4,
            totalCredits: programData.TotalCredits || 150,
            degree: programData.DegreeName || '',
            type: programData.ProgramType || 'Standard',
            status: programData.IsActive ? 'Active' : 'Inactive'
          });
        } else {
          throw new Error(response.message || 'Failed to fetch program details');
        }
      } catch (error) {
        console.error('Error fetching program details:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Error fetching program details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [id, navigate]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        programCode: values.code,
        programName: values.name,
        department: values.department,
        faculty: values.faculty,
        description: values.description,
        totalCredits: values.totalCredits,
        programDuration: values.duration,
        degreeName: values.degree,
        programType: values.type,
        isActive: values.status === 'Active'
      };
      
      // Call API to update program
      const response = await academicService.updateProgram(id, payload);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Chương trình đào tạo đã được cập nhật thành công!',
          severity: 'success'
        });
        
        // Navigate after a delay to allow user to see success message
        setTimeout(() => {
          navigate(`/academic/programs/${id}`);
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to update program');
      }
    } catch (error) {
      console.error('Error updating program:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Có lỗi xảy ra khi cập nhật chương trình',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
            onClick={() => navigate(`/academic/programs/${id}`)}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" component="h1">
            Chỉnh sửa chương trình đào tạo
          </Typography>
        </Box>
      </Box>

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
          <Form>
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin cơ bản
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="code"
                      name="code"
                      label="Mã chương trình"
                      value={values.code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.code && Boolean(errors.code)}
                      helperText={touched.code && errors.code}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Tên chương trình"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      error={touched.department && Boolean(errors.department)}
                    >
                      <InputLabel id="department-label">Khoa phụ trách</InputLabel>
                      <Select
                        labelId="department-label"
                        id="department"
                        name="department"
                        value={values.department}
                        label="Khoa phụ trách"
                        onChange={handleChange}
                      >
                        {departments.map(dept => (
                          <MenuItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.department && errors.department && (
                        <FormHelperText>{errors.department}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="faculty"
                      name="faculty"
                      label="Khối ngành"
                      value={values.faculty}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="description"
                      name="description"
                      label="Mô tả chương trình"
                      multiline
                      rows={4}
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.description && Boolean(errors.description)}
                      helperText={touched.description && errors.description}
                    />
                  </Grid>
                </Grid>
              </Box>
              
              <Divider />
              
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin học tập
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="duration"
                      name="duration"
                      label="Thời gian đào tạo (năm)"
                      type="number"
                      InputProps={{ inputProps: { min: 1, max: 10 } }}
                      value={values.duration}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.duration && Boolean(errors.duration)}
                      helperText={touched.duration && errors.duration}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="totalCredits"
                      name="totalCredits"
                      label="Tổng số tín chỉ"
                      type="number"
                      InputProps={{ inputProps: { min: 30, max: 300 } }}
                      value={values.totalCredits}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.totalCredits && Boolean(errors.totalCredits)}
                      helperText={touched.totalCredits && errors.totalCredits}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      error={touched.degree && Boolean(errors.degree)}
                    >
                      <InputLabel id="degree-label">Bằng cấp</InputLabel>
                      <Select
                        labelId="degree-label"
                        id="degree"
                        name="degree"
                        value={values.degree}
                        label="Bằng cấp"
                        onChange={handleChange}
                      >
                        <MenuItem value="Cử nhân">Cử nhân</MenuItem>
                        <MenuItem value="Kỹ sư">Kỹ sư</MenuItem>
                        <MenuItem value="Thạc sĩ">Thạc sĩ</MenuItem>
                        <MenuItem value="Tiến sĩ">Tiến sĩ</MenuItem>
                      </Select>
                      {touched.degree && errors.degree && (
                        <FormHelperText>{errors.degree}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="type-label">Loại chương trình</InputLabel>
                      <Select
                        labelId="type-label"
                        id="type"
                        name="type"
                        value={values.type}
                        label="Loại chương trình"
                        onChange={handleChange}
                      >
                        <MenuItem value="Standard">Chuẩn</MenuItem>
                        <MenuItem value="HighQuality">Chất lượng cao</MenuItem>
                        <MenuItem value="International">Quốc tế</MenuItem>
                        <MenuItem value="DistanceLearning">Từ xa</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          id="status"
                          name="status"
                          checked={values.status === 'Active'}
                          onChange={(e) => {
                            handleChange({
                              target: {
                                name: 'status',
                                value: e.target.checked ? 'Active' : 'Inactive'
                              }
                            });
                          }}
                          color="primary"
                        />
                      }
                      label="Kích hoạt chương trình"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/academic/programs/${id}`)}
                sx={{ mr: 2 }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={isSubmitting}
              >
                Lưu thay đổi
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default ProgramEdit; 
