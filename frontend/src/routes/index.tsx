import { createBrowserRouter, Navigate } from 'react-router-dom';
import BaseLayout from '../layouts/BaseLayout';

// Lazy load pages for modular chunk separation and fast first load
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';

import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Organization from '../pages/Organization';
import WorkforceScheduling from '../pages/WorkforceScheduling';
import WorkforceSchedulingSettings from '../pages/WorkforceSchedulingSettings';
import WorkforceSchedulingStatuses from '../pages/WorkforceSchedulingStatuses';
import Reports from '../pages/Reports';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';
import CommanderDashboard from '../pages/CommanderDashboard';
import Transfers from '../pages/Transfers';
import EmployeeHistory from '../pages/EmployeeHistory';
import WorkforceCalendar from '../pages/WorkforceCalendar';

// Admin pages
import AdminSettings from '../pages/admin/AdminSettings';
import AuditCenter from '../pages/admin/AuditCenter';
import BusinessRules from '../pages/admin/BusinessRules';
import Automation from '../pages/admin/Automation';
import NotificationTemplates from '../pages/admin/NotificationTemplates';
import SystemHealth from '../pages/admin/SystemHealth';

export const router = createBrowserRouter([
  // Public Routes (Authentication pages)
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },

  // Secure App Workspace Routes
  {
    path: '/',
    element: <BaseLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'employees',
        element: <Employees />,
      },
      {
        path: 'organization',
        element: <Organization />,
      },
      {
        path: 'workforce/dashboard',
        element: <CommanderDashboard />,
      },
      {
        path: 'workforce/scheduling',
        element: <WorkforceScheduling />,
      },
      {
        path: 'workforce/scheduling/settings',
        element: <WorkforceSchedulingSettings />,
      },
      {
        path: 'workforce/scheduling/statuses',
        element: <WorkforceSchedulingStatuses />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'transfers',
        element: <Transfers />,
      },
      {
        path: 'employees/:id/history',
        element: <EmployeeHistory />,
      },
      {
        path: 'workforce/calendar',
        element: <WorkforceCalendar />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      // Admin routes
      {
        path: 'admin/settings',
        element: <AdminSettings />,
      },
      {
        path: 'admin/audit',
        element: <AuditCenter />,
      },
      {
        path: 'admin/business-rules',
        element: <BusinessRules />,
      },
      {
        path: 'admin/automation',
        element: <Automation />,
      },
      {
        path: 'admin/notification-templates',
        element: <NotificationTemplates />,
      },
      {
        path: 'admin/system-health',
        element: <SystemHealth />,
      },
    ],
  },

  // Fallback 404 handler
  {
    path: '*',
    element: <NotFound />,
  },
]);
