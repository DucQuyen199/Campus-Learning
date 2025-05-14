import React, { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Divider, TextField, Grid, Avatar
} from '@mui/material';
import { Save, CameraAlt } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { currentUser } = useAuth();
  
  // Mock user data since we don't have actual data
  const [userData, setUserData] = useState({
    id: '1',
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'Administrator',
    phone: '0123456789',
    avatar: null
  });
  
  const [formData, setFormData] = useState({
    fullName: userData.fullName,
    email: userData.email,
    phone: userData.phone,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Here you would handle the profile update with an API call
    console.log('Profile update:', formData);
    alert('Profile updated successfully!');
  };
  
  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    // Here you would handle the password update with an API call
    console.log('Password update:', {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
    
    // Reset password fields
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    
    alert('Password updated successfully!');
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Thông tin cá nhân
      </Typography>
      
      <Paper sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mr: 3 }}>
            <Avatar 
              sx={{ width: 100, height: 100 }}
              src={userData.avatar || '/placeholder-avatar.png'}
              alt={userData.fullName}
            />
            <Button
              variant="contained"
              component="label"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                minWidth: 'auto',
                width: 36,
                height: 36,
                borderRadius: '50%'
              }}
            >
              <CameraAlt fontSize="small" />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => console.log(e.target.files[0])}
              />
            </Button>
          </Box>
          <Box>
            <Typography variant="h6">{userData.fullName}</Typography>
            <Typography color="textSecondary">{userData.role}</Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleProfileUpdate}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Họ và tên"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
            >
              Lưu thay đổi
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Typography variant="h5" gutterBottom>
        Đổi mật khẩu
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handlePasswordUpdate}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mật khẩu hiện tại"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mật khẩu mới"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ''}
                helperText={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== '' ? 'Mật khẩu không khớp' : ''}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={!formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
            >
              Cập nhật mật khẩu
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Profile; 