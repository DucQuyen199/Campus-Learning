import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import MainLayout from 'layout/MainLayout';

// render - dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard')));

// render - utilities
const UtilsTypography = Loadable(lazy(() => import('pages/components-overview/Typography')));
const UtilsColor = Loadable(lazy(() => import('pages/components-overview/Color')));
const UtilsShadow = Loadable(lazy(() => import('pages/components-overview/Shadow')));
const UtilsMaterialIcons = Loadable(lazy(() => import('pages/components-overview/MaterialIcons')));
const UtilsTablerIcons = Loadable(lazy(() => import('pages/components-overview/TablerIcons')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/SamplePage')));

// render - authentication
const AuthLogin = Loadable(lazy(() => import('pages/authentication/Login')));
const AuthRegister = Loadable(lazy(() => import('pages/authentication/Register')));

// render - reports
const ReportList = Loadable(lazy(() => import('pages/Reports/ReportList')));
const ReportDashboard = Loadable(lazy(() => import('pages/Reports/ReportDashboard')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'utils',
      children: [
        {
          path: 'util-typography',
          element: <UtilsTypography />
        }
      ]
    },
    {
      path: 'utils',
      children: [
        {
          path: 'util-color',
          element: <UtilsColor />
        }
      ]
    },
    {
      path: 'utils',
      children: [
        {
          path: 'util-shadow',
          element: <UtilsShadow />
        }
      ]
    },
    {
      path: 'icons',
      children: [
        {
          path: 'tabler-icons',
          element: <UtilsTablerIcons />
        }
      ]
    },
    {
      path: 'icons',
      children: [
        {
          path: 'material-icons',
          element: <UtilsMaterialIcons />
        }
      ]
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'reports',
      children: [
        {
          path: 'list',
          element: <ReportList />
        },
        {
          path: 'dashboard',
          element: <ReportDashboard />
        }
      ]
    }
  ]
};

export default MainRoutes; 