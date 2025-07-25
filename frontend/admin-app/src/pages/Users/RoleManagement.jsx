/*-----------------------------------------------------------------
* File: RoleManagement.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  Divider,
  Switch,
  FormControlLabel,
  Stack,
  Tooltip,
  Avatar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  School as TeacherIcon,
  Person as StudentIcon,
  Star as FeatureIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleData, setRoleData] = useState({
    name: '',
    description: '',
    permissions: ''
  });
  
  const { showNotification } = useNotification();
  
  useEffect(() => {
    fetchRoles();
  }, []);
  
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/roles');
      setRoles(response.data);
    } catch (err) {
      setError('Failed to fetch roles');
      showNotification('Error loading roles', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoleData(prev => ({ ...prev, [name]: value }));
  };
  
  const openDialog = (role = null) => {
    if (role) {
      setRoleData({
        name: role.Name,
        description: role.Description,
        permissions: role.Permissions || ''
      });
      setSelectedRole(role);
    } else {
      setRoleData({
        name: '',
        description: '',
        permissions: ''
      });
      setSelectedRole(null);
    }
    setDialogOpen(true);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
  };
  
  const openDeleteDialog = (role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleSubmit = async () => {
    try {
      if (selectedRole) {
        // Update
        await api.put(`/users/roles/${selectedRole.RoleID}`, roleData);
        
        // Update local state
        const updatedRoles = roles.map(role => {
          if (role.RoleID === selectedRole.RoleID) {
            return {
              ...role,
              Name: roleData.name,
              Description: roleData.description,
              Permissions: roleData.permissions
            };
          }
          return role;
        });
        
        setRoles(updatedRoles);
        showNotification('Role updated successfully', 'success');
      } else {
        // Create
        const response = await api.post('/users/roles', roleData);
        
        // Add to local state
        setRoles([...roles, response.data]);
        showNotification('Role created successfully', 'success');
      }
      
      closeDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving role');
      showNotification('Failed to save role', 'error');
    }
  };
  
  const handleDelete = async () => {
    try {
      await api.delete(`/users/roles/${selectedRole.RoleID}`);
      
      // Update local state
      setRoles(roles.filter(role => role.RoleID !== selectedRole.RoleID));
      showNotification('Role deleted successfully', 'success');
      closeDeleteDialog();
    } catch (err) {
      showNotification('Failed to delete role', 'error');
    }
  };
  
  const isSystemRole = (roleName) => {
    return ['ADMIN', 'TEACHER', 'STUDENT'].includes(roleName);
  };
  
  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return <AdminIcon sx={{ color: '#f44336' }} />;
      case 'TEACHER':
        return <TeacherIcon sx={{ color: '#3f51b5' }} />;
      case 'STUDENT':
        return <StudentIcon sx={{ color: '#757575' }} />;
      default:
        return <SecurityIcon sx={{ color: '#4caf50' }} />;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 4,
          background: 'linear-gradient(120deg, #4a148c 0%, #7b1fa2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '-20px', 
          right: '-20px', 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)'
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Quản lý vai trò
          </Typography>
          <Typography variant="subtitle1">
            Tạo và cấu hình vai trò người dùng với các quyền cụ thể trên hệ thống
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
            sx={{ 
              mt: 3,
              borderRadius: 8, 
              px: 3, 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(8px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            Thêm vai trò mới
          </Button>
        </Box>
      </Paper>
      
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      
      {/* Roles Grid */}
      <Grid container spacing={3}>
        {roles.map((role) => (
          <Grid item xs={12} sm={6} md={4} key={role.RoleID}>
            <Card 
              sx={{ 
                borderRadius: 3, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderTop: '5px solid',
                borderColor: 
                  role.Name === 'ADMIN' ? 'error.main' :
                  role.Name === 'TEACHER' ? 'primary.main' :
                  role.Name === 'STUDENT' ? 'grey.500' : 'success.main',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.09)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: 
                        role.Name === 'ADMIN' ? 'rgba(244, 67, 54, 0.1)' :
                        role.Name === 'TEACHER' ? 'rgba(63, 81, 181, 0.1)' :
                        role.Name === 'STUDENT' ? 'rgba(117, 117, 117, 0.1)' : 
                        'rgba(76, 175, 80, 0.1)',
                      color: 
                        role.Name === 'ADMIN' ? 'error.main' :
                        role.Name === 'TEACHER' ? 'primary.main' :
                        role.Name === 'STUDENT' ? 'grey.700' : 'success.main',
                      mr: 2
                    }}
                  >
                    {getRoleIcon(role.Name)}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {role.Name}
                  </Typography>
                  {isSystemRole(role.Name) && (
                    <Chip 
                      label="Hệ thống" 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1, height: 24 }}
                    />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {role.Description || 'Không có mô tả'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Quyền:
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  {role.Permissions ? (
                    role.Permissions.split(',').map((permission, index) => (
                      <Chip 
                        key={index}
                        label={permission.trim()}
                        size="small"
                        sx={{ mr: 1, mb: 1, backgroundColor: 'rgba(76, 175, 80, 0.1)', color: 'success.main' }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chưa có quyền nào được cấp
                    </Typography>
                  )}
                </Box>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                <Tooltip title={isSystemRole(role.Name) ? "Không thể chỉnh sửa vai trò hệ thống" : "Chỉnh sửa vai trò"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => openDialog(role)}
                      disabled={isSystemRole(role.Name)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title={isSystemRole(role.Name) ? "Không thể xóa vai trò hệ thống" : "Xóa vai trò"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => openDeleteDialog(role)}
                      disabled={isSystemRole(role.Name)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? `Chỉnh sửa vai trò: ${selectedRole.Name}` : 'Tạo vai trò mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên vai trò"
                name="name"
                value={roleData.name}
                onChange={handleChange}
                disabled={selectedRole && isSystemRole(selectedRole.Name)}
                required
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                value={roleData.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quyền (phân cách bởi dấu phẩy)"
                name="permissions"
                value={roleData.permissions}
                onChange={handleChange}
                multiline
                rows={4}
                helperText="Ví dụ: create_course, edit_course, delete_course"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeDialog}
            variant="outlined"
            sx={{ borderRadius: 8 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ borderRadius: 8 }}
          >
            {selectedRole ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Role Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Xác nhận xóa vai trò</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Bạn có chắc chắn muốn xóa vai trò <strong>{selectedRole?.Name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Hành động này không thể hoàn tác và có thể ảnh hưởng đến người dùng hiện tại.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeDeleteDialog}
            variant="outlined"
            sx={{ borderRadius: 8 }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            sx={{ borderRadius: 8 }}
          >
            Xóa vai trò
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement; 
