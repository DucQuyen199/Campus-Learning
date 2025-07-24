/*-----------------------------------------------------------------
* File: ReportManagement.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { Box, Typography } from '@mui/material';
import ReportList from './ReportList';

/**
 * Report Management Page
 * This component provides a centralized interface for managing all user reports
 */
const ReportManagement = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Quản lý báo cáo
      </Typography>
      
      <ReportList />
    </Box>
  );
};

export default ReportManagement; 
