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