/*-----------------------------------------------------------------
* File: reports.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { FlagOutlined, DashboardOutlined } from '@mui/icons-material';

// ==============================|| MENU ITEMS - REPORTS ||============================== //

const reports = {
  id: 'reports',
  title: 'Quản lý báo cáo',
  type: 'group',
  children: [
    {
      id: 'report-dashboard',
      title: 'Tổng quan báo cáo',
      type: 'item',
      url: '/reports/dashboard',
      icon: DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'report-list',
      title: 'Danh sách báo cáo',
      type: 'item',
      url: '/reports/list',
      icon: FlagOutlined,
      breadcrumbs: false
    }
  ]
};

export default reports; 
