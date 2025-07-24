/*-----------------------------------------------------------------
* File: Settings.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Switch, FormControlLabel, Divider,
  List, ListItem, ListItemText, Button, FormControl, InputLabel,
  Select, MenuItem, TextField
} from '@mui/material';
import { Save } from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    language: 'vi',
    itemsPerPage: 10,
    autoLogout: 30,
    timeFormat: '24h'
  });
  
  const handleSettingChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleToggleChange = (event) => {
    handleSettingChange(event.target.name, event.target.checked);
  };
  
  const handleSelectChange = (event) => {
    handleSettingChange(event.target.name, event.target.value);
  };
  
  const handleNumberChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      handleSettingChange(event.target.name, value);
    }
  };
  
  const handleSaveSettings = () => {
    // Here you would save settings to API/local storage
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Cài đặt hệ thống
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Giao diện" 
              secondary="Cài đặt giao diện người dùng"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleToggleChange}
                  name="darkMode"
                  color="primary"
                />
              }
              label="Chế độ tối"
            />
          </ListItem>
          <ListItem>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="language-label">Ngôn ngữ</InputLabel>
              <Select
                labelId="language-label"
                id="language"
                name="language"
                value={settings.language}
                onChange={handleSelectChange}
                label="Ngôn ngữ"
              >
                <MenuItem value="vi">Tiếng Việt</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
          <ListItem>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="time-format-label">Định dạng thời gian</InputLabel>
              <Select
                labelId="time-format-label"
                id="timeFormat"
                name="timeFormat"
                value={settings.timeFormat}
                onChange={handleSelectChange}
                label="Định dạng thời gian"
              >
                <MenuItem value="12h">12 giờ (AM/PM)</MenuItem>
                <MenuItem value="24h">24 giờ</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Thông báo" 
              secondary="Cài đặt thông báo hệ thống"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={handleToggleChange}
                  name="emailNotifications"
                  color="primary"
                />
              }
              label="Nhận thông báo qua email"
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Hiển thị dữ liệu" 
              secondary="Cài đặt hiển thị dữ liệu trong bảng"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Số mục mỗi trang:
              </Typography>
              <TextField
                type="number"
                name="itemsPerPage"
                value={settings.itemsPerPage}
                onChange={handleNumberChange}
                inputProps={{ min: 5, max: 100 }}
                size="small"
                sx={{ width: 80 }}
              />
            </Box>
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemText 
              primary="Bảo mật" 
              secondary="Cài đặt bảo mật tài khoản"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Tự động đăng xuất sau:
              </Typography>
              <TextField
                type="number"
                name="autoLogout"
                value={settings.autoLogout}
                onChange={handleNumberChange}
                inputProps={{ min: 5, max: 120 }}
                size="small"
                sx={{ width: 80 }}
              />
              <Typography variant="body1" sx={{ ml: 1 }}>
                phút
              </Typography>
            </Box>
          </ListItem>
        </List>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveSettings}
        >
          Lưu cài đặt
        </Button>
      </Box>
    </Box>
  );
};

export default Settings; 
