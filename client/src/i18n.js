import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      'common.update': 'Update',

      // Auth
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.register': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.displayName': 'Display Name',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.loginSuccess': 'Login successful',
      'auth.loginError': 'Login failed',

      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.meetings': 'Meetings',
      'nav.analytics': 'Analytics',
      'nav.settings': 'Settings',
      'nav.profile': 'Profile',

      // Meetings
      'meeting.title': 'Meeting Title',
      'meeting.description': 'Description',
      'meeting.startTime': 'Start Time',
      'meeting.endTime': 'End Time',
      'meeting.participants': 'Participants',
      'meeting.join': 'Join Meeting',
      'meeting.leave': 'Leave Meeting',
      'meeting.mute': 'Mute',
      'meeting.unmute': 'Unmute',
      'meeting.video': 'Video',
      'meeting.screenShare': 'Screen Share',
      'meeting.record': 'Record',
      'meeting.whiteboard': 'Whiteboard',
      'meeting.chat': 'Chat',
      'meeting.transcript': 'Transcript',
      'meeting.insights': 'AI Insights',

      // Dashboard
      'dashboard.welcome': 'Welcome to AI Meeting Co-Pilot',
      'dashboard.upcomingMeetings': 'Upcoming Meetings',
      'dashboard.recentMeetings': 'Recent Meetings',
      'dashboard.quickActions': 'Quick Actions',
      'dashboard.createMeeting': 'Create Meeting',
      'dashboard.joinMeeting': 'Join Meeting',

      // Error messages
      'error.networkError': 'Network error occurred',
      'error.serverError': 'Server error occurred',
      'error.notFound': 'Page not found',
      'error.unauthorized': 'Unauthorized access',
      'error.forbidden': 'Access forbidden',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
