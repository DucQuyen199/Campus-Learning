import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, Paper, TextField,
  MenuItem, FormControl, FormHelperText, InputLabel, Select,
  Card, CardContent, Divider, FormControlLabel, Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Placeholder for the actual service
const programsService = {
  getPrograms: () => Promise.resolve([
    { id: 1, name: 'Computer Science' },
    { id: 2, name: 'Business Administration' },
    { id: 3, name: 'Electrical Engineering' }
  ])
};

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  dateOfBirth: Yup.date().required('Date of birth is required'),
  gender: Yup.string().required('Gender is required'),
  address: Yup.string().required('Address is required'),
  programId: Yup.number().required('Program is required'),
});

const AddStudent = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([
    { id: 1, name: 'Computer Science' },
    { id: 2, name: 'Business Administration' },
    { id: 3, name: 'Electrical Engineering' }
  ]);

  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: null,
    gender: '',
    address: '',
    programId: '',
    isActive: true
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log('Form values:', values);
      // Here you would normally call an API to save the student
      alert('Student added successfully!');
      navigate('/students');
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student. Please try again.');
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
            onClick={() => navigate('/students')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Thêm sinh viên mới
          </Typography>
        </Box>
      </Box>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
          <Form>
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin cá nhân
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="firstName"
                      name="firstName"
                      label="Họ"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.firstName && Boolean(errors.firstName)}
                      helperText={touched.firstName && errors.firstName}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="lastName"
                      name="lastName"
                      label="Tên"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.lastName && Boolean(errors.lastName)}
                      helperText={touched.lastName && errors.lastName}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Ngày sinh"
                      value={values.dateOfBirth}
                      onChange={(date) => setFieldValue('dateOfBirth', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          id="dateOfBirth"
                          name="dateOfBirth"
                          error={touched.dateOfBirth && Boolean(errors.dateOfBirth)}
                          helperText={touched.dateOfBirth && errors.dateOfBirth}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      error={touched.gender && Boolean(errors.gender)}
                    >
                      <InputLabel id="gender-label">Giới tính</InputLabel>
                      <Select
                        labelId="gender-label"
                        id="gender"
                        name="gender"
                        value={values.gender}
                        label="Giới tính"
                        onChange={handleChange}
                      >
                        <MenuItem value="Nam">Nam</MenuItem>
                        <MenuItem value="Nữ">Nữ</MenuItem>
                        <MenuItem value="Khác">Khác</MenuItem>
                      </Select>
                      {touched.gender && errors.gender && (
                        <FormHelperText>{errors.gender}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
              
              <Divider />
              
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin liên hệ
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="phone"
                      name="phone"
                      label="Số điện thoại"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.phone && Boolean(errors.phone)}
                      helperText={touched.phone && errors.phone}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="address"
                      name="address"
                      label="Địa chỉ"
                      multiline
                      rows={3}
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
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
                    <FormControl 
                      fullWidth
                      error={touched.programId && Boolean(errors.programId)}
                    >
                      <InputLabel id="program-label">Chương trình học</InputLabel>
                      <Select
                        labelId="program-label"
                        id="programId"
                        name="programId"
                        value={values.programId}
                        label="Chương trình học"
                        onChange={handleChange}
                      >
                        {programs.map(program => (
                          <MenuItem key={program.id} value={program.id}>
                            {program.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.programId && errors.programId && (
                        <FormHelperText>{errors.programId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                      label="Kích hoạt tài khoản"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/students')}
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

export default AddStudent; 