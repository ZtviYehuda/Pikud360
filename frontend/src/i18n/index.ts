import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './he/common.json';
import dashboard from './he/dashboard.json';
import employees from './he/employees.json';
import organization from './he/organization.json';
import scheduling from './he/scheduling.json';
import analytics from './he/analytics.json';
import reports from './he/reports.json';
import notifications from './he/notifications.json';
import validation from './he/validation.json';
import buttons from './he/buttons.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      he: {
        common,
        dashboard,
        employees,
        organization,
        scheduling,
        analytics,
        reports,
        notifications,
        validation,
        buttons
      }
    },
    lng: 'he',
    fallbackLng: 'he',
    ns: [
      'common',
      'dashboard',
      'employees',
      'organization',
      'scheduling',
      'analytics',
      'reports',
      'notifications',
      'validation',
      'buttons'
    ],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
