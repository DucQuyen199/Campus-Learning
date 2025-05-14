import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, Paper, TextField,
  MenuItem, FormControl, FormHelperText, InputLabel, Select,
  Divider, FormControlLabel, Switch
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

// Placeholder for the actual service
const departmentsService = {
  getDepartments: () => Promise.resolve([
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'Business' },
    { id: 3, name: 'Arts and Sciences' }
  ])
};

const validationSchema = Yup.object({
  code: Yup.string().required('Mã chương trình là bắt buộc'),
  name: Yup.string().required('Tên chương trình là bắt buộc'),
  departmentId: Yup.number().required('Khoa phụ trách là bắt buộc'),
  description: Yup.string().required('Mô tả là bắt buộc'),
  duration: Yup.number().required('Thời gian đào tạo là bắt buộc').min(1, 'Thời gian đào tạo tối thiểu là 1 năm'),
  credits: Yup.number().required('Số tín chỉ là bắt buộc').min(30, 'Số tín chỉ tối thiểu là 30'),
  degree: Yup.string().required('Bằng cấp là bắt buộc')
});

const AddProgram = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'Business' },
    { id: 3, name: 'Arts and Sciences' }
  ]);

  const initialValues = {
    code: '',
    name: '',
    departmentId: '',
    description: '',
    duration: 4,
    credits: 150,
    degree: '',
    isActive: true
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log('Form values:', values);
      // Here you would normally call an API to save the program
      alert('Chương trình đào tạo đã được thêm thành công!');
      navigate('/academic/programs');
    } catch (error) {
      console.error('Error adding program:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/academic/programs')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Thêm chương trình đào tạo mới
          </Typography>
        </Box>
      </Box>

      <Formik
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
                      error={touched.departmentId && Boolean(errors.departmentId)}
                    >
                      <InputLabel id="department-label">Khoa phụ trách</InputLabel>
                      <Select
                        labelId="department-label"
                        id="departmentId"
                        name="departmentId"
                        value={values.departmentId}
                        label="Khoa phụ trách"
                        onChange={handleChange}
                      >
                        {departments.map(dept => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.departmentId && errors.departmentId && (
                        <FormHelperText>{errors.departmentId}</FormHelperText>
                      )}
                    </FormControl>
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
                      id="credits"
                      name="credits"
                      label="Tổng số tín chỉ"
                      type="number"
                      InputProps={{ inputProps: { min: 30, max: 300 } }}
                      value={values.credits}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.credits && Boolean(errors.credits)}
                      helperText={touched.credits && errors.credits}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          id="isActive"
                          name="isActive"
                          checked={values.isActive}
                          onChange={handleChange}
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
                onClick={() => navigate('/academic/programs')}
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
                Lưu
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default AddProgram; 