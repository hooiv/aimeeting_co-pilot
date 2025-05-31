export interface MeetingPlatform {
  id: string;
  name: string;
  type: 'zoom' | 'teams' | 'webex' | 'googlemeet' | 'gotomeeting';
  isConnected: boolean;
  config: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    webhookUrl?: string;
    redirectUri?: string;
    scopes?: string[];
  };
  features: {
    createMeeting: boolean;
    joinMeeting: boolean;
    recording: boolean;
    transcription: boolean;
    breakoutRooms: boolean;
    waitingRoom: boolean;
    polling: boolean;
    chat: boolean;
  };
  limits: {
    maxParticipants: number;
    maxDuration: number; // in minutes
    recordingStorage: number; // in GB
  };
}

export interface ExternalMeeting {
  id: string;
  platformId: string;
  platformMeetingId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  joinUrl: string;
  hostUrl?: string;
  password?: string;
  waitingRoom: boolean;
  recording: {
    enabled: boolean;
    autoStart: boolean;
    cloudStorage: boolean;
  };
  participants: Array<{
    email: string;
    name?: string;
    role: 'host' | 'co-host' | 'participant';
  }>;
  settings: {
    muteOnEntry: boolean;
    videoOnEntry: boolean;
    allowScreenShare: boolean;
    allowChat: boolean;
    allowBreakoutRooms: boolean;
  };
}

export interface MeetingRecording {
  id: string;
  meetingId: string;
  platformId: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  fileSize: number;
  downloadUrl: string;
  playbackUrl: string;
  transcriptUrl?: string;
  chatUrl?: string;
  status: 'processing' | 'completed' | 'failed';
}

class MeetingPlatformsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Platform Management
  async getPlatforms(): Promise<MeetingPlatform[]> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/meeting-platforms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meeting platforms');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching meeting platforms:', error);
      return [];
    }
  }

  async connectPlatform(platformType: string, config: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/meeting-platforms/${platformType}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async disconnectPlatform(platformId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/meeting-platforms/${platformId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      return false;
    }
  }

  // Zoom Integration
  async connectZoom(authCode: string): Promise<{ success: boolean; error?: string }> {
    return this.connectPlatform('zoom', { authCode });
  }

  async createZoomMeeting(meetingData: Partial<ExternalMeeting>): Promise<ExternalMeeting | null> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/zoom/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create Zoom meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      return null;
    }
  }

  async getZoomRecordings(meetingId?: string): Promise<MeetingRecording[]> {
    try {
      const url = meetingId 
        ? `${this.baseUrl}/integrations/zoom/recordings/${meetingId}`
        : `${this.baseUrl}/integrations/zoom/recordings`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Zoom recordings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Zoom recordings:', error);
      return [];
    }
  }

  // Microsoft Teams Integration
  async connectTeams(): Promise<{ success: boolean; error?: string }> {
    try {
      // Initiate Microsoft Graph OAuth flow
      const response = await fetch(`${this.baseUrl}/integrations/teams/auth-url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Teams auth URL');
      }

      const { authUrl } = await response.json();
      
      // Open popup for authentication
      const popup = window.open(authUrl, 'teams-auth', 'width=500,height=600');
      
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            this.verifyTeamsConnection().then(resolve);
          }
        }, 1000);
      });
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async verifyTeamsConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/teams/verify`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async createTeamsMeeting(meetingData: Partial<ExternalMeeting>): Promise<ExternalMeeting | null> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/teams/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create Teams meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Teams meeting:', error);
      return null;
    }
  }

  async getTeamsRecordings(meetingId?: string): Promise<MeetingRecording[]> {
    try {
      const url = meetingId 
        ? `${this.baseUrl}/integrations/teams/recordings/${meetingId}`
        : `${this.baseUrl}/integrations/teams/recordings`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Teams recordings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Teams recordings:', error);
      return [];
    }
  }

  // Google Meet Integration
  async connectGoogleMeet(): Promise<{ success: boolean; error?: string }> {
    try {
      // Load Google API
      await this.loadGoogleAPI();
      
      const gapi = (window as any).gapi;
      await gapi.load('auth2', () => {
        gapi.auth2.init({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar.events',
        });
      });

      const authInstance = gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      const accessToken = user.getAuthResponse().access_token;

      const response = await fetch(`${this.baseUrl}/integrations/googlemeet/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ accessToken }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
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

  async createGoogleMeetMeeting(meetingData: Partial<ExternalMeeting>): Promise<ExternalMeeting | null> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/googlemeet/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create Google Meet meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Google Meet meeting:', error);
      return null;
    }
  }

  // WebEx Integration
  async connectWebEx(config: { clientId: string; clientSecret: string }): Promise<{ success: boolean; error?: string }> {
    return this.connectPlatform('webex', config);
  }

  async createWebExMeeting(meetingData: Partial<ExternalMeeting>): Promise<ExternalMeeting | null> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/webex/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create WebEx meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating WebEx meeting:', error);
      return null;
    }
  }

  // Generic Methods
  async createMeeting(platformId: string, meetingData: Partial<ExternalMeeting>): Promise<ExternalMeeting | null> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/meeting-platforms/${platformId}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating meeting:', error);
      return null;
    }
  }

  async updateMeeting(platformId: string, meetingId: string, updates: Partial<ExternalMeeting>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/meeting-platforms/${platformId}/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating meeting:', error);
      return false;
    }
  }

  async deleteMeeting(platformId: string, meetingId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/meeting-platforms/${platformId}/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  }

  async getMeetings(platformId?: string): Promise<ExternalMeeting[]> {
    try {
      const url = platformId 
        ? `${this.baseUrl}/integrations/meeting-platforms/${platformId}/meetings`
        : `${this.baseUrl}/integrations/meeting-platforms/meetings`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

  async getRecordings(platformId?: string): Promise<MeetingRecording[]> {
    try {
      const url = platformId 
        ? `${this.baseUrl}/integrations/meeting-platforms/${platformId}/recordings`
        : `${this.baseUrl}/integrations/meeting-platforms/recordings`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  }

  async syncMeetings(platformId?: string): Promise<boolean> {
    try {
      const url = platformId 
        ? `${this.baseUrl}/integrations/meeting-platforms/${platformId}/sync`
        : `${this.baseUrl}/integrations/meeting-platforms/sync`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error syncing meetings:', error);
      return false;
    }
  }
}

export const meetingPlatformsService = new MeetingPlatformsService();
export default meetingPlatformsService;
