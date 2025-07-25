/*-----------------------------------------------------------------
* File: StudentEdit.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Paper, TextField, 
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  CircularProgress, Alert, Snackbar
} from '@mui/material';
import { Save, ArrowBack, Cancel } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// API URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

const StudentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    FullName: '',
    Email: '',
    PhoneNumber: '',
    Address: '',
    City: '',
    School: '',
    DateOfBirth: '',
    AccountStatus: 'ACTIVE'
  });

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        // Fetch the student by ID
        const response = await axios.get(`${API_URL}/students/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data && response.data.success && response.data.data) {
          const studentData = response.data.data;
          setStudent(studentData);
          
          // Format date for input field (yyyy-MM-dd)
          let formattedDob = '';
          if (studentData && studentData.DateOfBirth) {
            const date = new Date(studentData.DateOfBirth);
            formattedDob = date.toISOString().split('T')[0];
          }

          // Set form data
          setFormData({
            FullName: studentData?.FullName || '',
            Email: studentData?.Email || '',
            PhoneNumber: studentData?.PhoneNumber || '',
            Address: studentData?.Address || '',
            City: studentData?.City || '',
            School: studentData?.School || '',
            DateOfBirth: formattedDob,
            AccountStatus: studentData?.AccountStatus || 'ACTIVE'
          });
        } else {
          throw new Error(response.data?.message || 'Failed to fetch student details');
        }
      } catch (error) {
        console.error('Error fetching student details:', error);
        setError(error.message || 'Error loading student data');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStudentDetails();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Validate required fields before submission
    if (!formData.Email || formData.Email.trim() === '') {
      setError('Email không được để trống');
      setOpenSnackbar(true);
      setSuccess(false);
      setSaving(false);
      return;
    }
    
    if (!formData.FullName || formData.FullName.trim() === '') {
      setError('Họ tên không được để trống');
      setOpenSnackbar(true);
      setSuccess(false);
      setSaving(false);
      return;
    }
    
    try {
      // Create a sanitized payload that doesn't include null or empty string values for required fields
      const payload = {
        ...formData,
        // Ensure Email is never empty, fallback to original value
        Email: formData.Email.trim() || student.Email,
        // Ensure FullName is never empty, fallback to original value
        FullName: formData.FullName.trim() || student.FullName
      };
      
      const response = await axios.put(`${API_URL}/students/${id}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setSuccess(true);
        setError('Cập nhật thông tin sinh viên thành công');
        setOpenSnackbar(true);
        
        // Navigate back to details page after short delay
        setTimeout(() => {
          navigate(`/students/${id}`);
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setError(error.message || 'Error updating student data');
      setOpenSnackbar(true);
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Không tìm thấy sinh viên</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/students')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={success ? "success" : "error"} 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/students/${id}`)}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" component="div">
            Chỉnh sửa thông tin sinh viên
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Họ và tên"
                name="FullName"
                value={formData.FullName}
                onChange={handleInputChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                name="Email"
                type="email"
                value={formData.Email}
                onChange={handleInputChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Số điện thoại"
                name="PhoneNumber"
                value={formData.PhoneNumber}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Ngày sinh"
                name="DateOfBirth"
                type="date"
                value={formData.DateOfBirth}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Địa chỉ"
                name="Address"
                value={formData.Address}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Thành phố"
                name="City"
                value={formData.City}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Trường học"
                name="School"
                value={formData.School}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControl component="fieldset" margin="normal">
                <FormLabel component="legend">Trạng thái tài khoản</FormLabel>
                <RadioGroup 
                  row 
                  name="AccountStatus" 
                  value={formData.AccountStatus} 
                  onChange={handleInputChange}
                >
                  <FormControlLabel value="ACTIVE" control={<Radio />} label="Hoạt động" />
                  <FormControlLabel value="SUSPENDED" control={<Radio />} label="Tạm ngưng" />
                  <FormControlLabel value="LOCKED" control={<Radio />} label="Khóa" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => navigate(`/students/${id}`)}
                sx={{ mr: 2 }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default StudentEdit; 
