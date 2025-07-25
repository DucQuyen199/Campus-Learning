/*-----------------------------------------------------------------
* File: index.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
// project import
import dashboard from './dashboard';
import pages from './pages';
import utilities from './utilities';
import support from './support';
import reports from './reports'; // Thêm menu reports

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [dashboard, pages, utilities, support, reports] // Thêm reports vào danh sách
};

export default menuItems; 
