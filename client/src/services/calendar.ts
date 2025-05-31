import { apiSlice } from '../store/api/apiSlice';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  meetingUrl?: string;
  provider: 'google' | 'outlook' | 'apple';
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple';
  isConnected: boolean;
  email: string;
  lastSync?: string;
  permissions: string[];
}

class CalendarService {
  private googleAuth: any = null;
  private outlookAuth: any = null;

  // Google Calendar Integration
  async initializeGoogleCalendar(): Promise<boolean> {
    try {
      // Load Google API
      await this.loadGoogleAPI();
      
      const gapi = (window as any).gapi;
      await gapi.load('auth2', () => {
        this.googleAuth = gapi.auth2.init({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar.events',
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error);
      return false;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async connectGoogleCalendar(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.googleAuth) {
        await this.initializeGoogleCalendar();
      }

      const authResult = await this.googleAuth.signIn();
      const accessToken = authResult.getAuthResponse().access_token;

      // Store the connection in backend
      const response = await fetch('/api/integrations/google/calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ accessToken }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to connect to Google Calendar' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async createGoogleCalendarEvent(event: Omit<CalendarEvent, 'id' | 'provider'>): Promise<CalendarEvent | null> {
    try {
      const gapi = (window as any).gapi;
      await gapi.client.load('calendar', 'v3');

      const calendarEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: event.location,
        attendees: event.attendees.map(email => ({ email })),
        conferenceData: event.meetingUrl ? {
          createRequest: {
            requestId: `meeting-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        } : undefined,
      };

      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
        conferenceDataVersion: 1,
      });

      return {
        id: response.result.id,
        title: response.result.summary,
        description: response.result.description,
        startTime: response.result.start.dateTime,
        endTime: response.result.end.dateTime,
        location: response.result.location,
        attendees: response.result.attendees?.map((a: any) => a.email) || [],
        meetingUrl: response.result.hangoutLink,
        provider: 'google',
      };
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      return null;
    }
  }

  // Microsoft Outlook Integration
  async initializeOutlookCalendar(): Promise<boolean> {
    try {
      // Load Microsoft Graph SDK
      await this.loadMicrosoftGraphAPI();
      return true;
    } catch (error) {
      console.error('Failed to initialize Outlook Calendar:', error);
      return false;
    }
  }

  private loadMicrosoftGraphAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Msal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://alcdn.msauth.net/browser/2.14.2/js/msal-browser.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Microsoft Graph API'));
      document.head.appendChild(script);
    });
  }

  async connectOutlookCalendar(): Promise<{ success: boolean; error?: string }> {
    try {
      const msalConfig = {
        auth: {
          clientId: process.env.REACT_APP_OUTLOOK_CLIENT_ID!,
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: window.location.origin,
        },
      };

      const Msal = (window as any).Msal;
      const msalInstance = new Msal.PublicClientApplication(msalConfig);

      const loginRequest = {
        scopes: ['https://graph.microsoft.com/Calendars.ReadWrite'],
      };

      const response = await msalInstance.loginPopup(loginRequest);
      
      // Store the connection in backend
      const backendResponse = await fetch('/api/integrations/outlook/calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ accessToken: response.accessToken }),
      });

      if (backendResponse.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to connect to Outlook Calendar' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async createOutlookCalendarEvent(event: Omit<CalendarEvent, 'id' | 'provider'>): Promise<CalendarEvent | null> {
    try {
      const outlookEvent = {
        subject: event.title,
        body: {
          contentType: 'HTML',
          content: event.description || '',
        },
        start: {
          dateTime: event.startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: {
          displayName: event.location || '',
        },
        attendees: event.attendees.map(email => ({
          emailAddress: { address: email, name: email },
        })),
        isOnlineMeeting: !!event.meetingUrl,
        onlineMeetingUrl: event.meetingUrl,
      };

      const response = await fetch('/api/integrations/outlook/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(outlookEvent),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          id: result.id,
          title: result.subject,
          description: result.body?.content,
          startTime: result.start.dateTime,
          endTime: result.end.dateTime,
          location: result.location?.displayName,
          attendees: result.attendees?.map((a: any) => a.emailAddress.address) || [],
          meetingUrl: result.onlineMeetingUrl,
          provider: 'outlook',
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to create Outlook Calendar event:', error);
      return null;
    }
  }

  // Apple Calendar Integration (via CalDAV)
  async connectAppleCalendar(credentials: { username: string; password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/integrations/apple/calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Generic methods
  async getCalendarIntegrations(): Promise<CalendarIntegration[]> {
    try {
      const response = await fetch('/api/integrations/calendar', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to get calendar integrations:', error);
      return [];
    }
  }

  async syncCalendars(): Promise<boolean> {
    try {
      const response = await fetch('/api/integrations/calendar/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to sync calendars:', error);
      return false;
    }
  }

  async disconnectCalendar(provider: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/integrations/${provider}/calendar/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to disconnect ${provider} calendar:`, error);
      return false;
    }
  }
}

export const calendarService = new CalendarService();
export default calendarService;
