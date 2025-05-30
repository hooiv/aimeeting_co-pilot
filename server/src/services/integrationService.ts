import axios from 'axios';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { Integration } from '@/types';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  meetingUrl?: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  attachments?: any[];
  blocks?: any[];
}

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  customFields?: Record<string, any>;
}

export class IntegrationService {
  // Google Calendar Integration
  async createGoogleCalendarEvent(
    accessToken: string,
    event: Omit<CalendarEvent, 'id'>
  ): Promise<CalendarEvent> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth });

      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meeting-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
        conferenceDataVersion: 1,
      });

      return {
        id: response.data.id!,
        title: response.data.summary!,
        description: response.data.description,
        startTime: new Date(response.data.start!.dateTime!),
        endTime: new Date(response.data.end!.dateTime!),
        attendees: response.data.attendees?.map(a => a.email!) || [],
        meetingUrl: response.data.conferenceData?.entryPoints?.[0]?.uri,
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error('Failed to create Google Calendar event');
    }
  }

  async getGoogleCalendarEvents(
    accessToken: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<CalendarEvent[]> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items?.map(event => ({
        id: event.id!,
        title: event.summary!,
        description: event.description,
        startTime: new Date(event.start!.dateTime!),
        endTime: new Date(event.end!.dateTime!),
        attendees: event.attendees?.map(a => a.email!) || [],
        meetingUrl: event.conferenceData?.entryPoints?.[0]?.uri,
      })) || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw new Error('Failed to fetch Google Calendar events');
    }
  }

  // Microsoft Outlook Integration
  async createOutlookEvent(
    accessToken: string,
    event: Omit<CalendarEvent, 'id'>
  ): Promise<CalendarEvent> {
    try {
      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const outlookEvent = {
        subject: event.title,
        body: {
          contentType: 'HTML',
          content: event.description || '',
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees.map(email => ({
          emailAddress: {
            address: email,
            name: email,
          },
        })),
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
      };

      const response = await graphClient.api('/me/events').post(outlookEvent);

      return {
        id: response.id,
        title: response.subject,
        description: response.body?.content,
        startTime: new Date(response.start.dateTime),
        endTime: new Date(response.end.dateTime),
        attendees: response.attendees?.map((a: any) => a.emailAddress.address) || [],
        meetingUrl: response.onlineMeeting?.joinUrl,
      };
    } catch (error) {
      console.error('Error creating Outlook event:', error);
      throw new Error('Failed to create Outlook event');
    }
  }

  // Slack Integration
  async sendSlackMessage(
    accessToken: string,
    message: SlackMessage
  ): Promise<{ ok: boolean; ts?: string; error?: string }> {
    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: message.channel,
          text: message.text,
          attachments: message.attachments,
          blocks: message.blocks,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw new Error('Failed to send Slack message');
    }
  }

  async createSlackChannel(
    accessToken: string,
    name: string,
    isPrivate: boolean = false
  ): Promise<{ ok: boolean; channel?: any; error?: string }> {
    try {
      const response = await axios.post(
        'https://slack.com/api/conversations.create',
        {
          name,
          is_private: isPrivate,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Slack channel:', error);
      throw new Error('Failed to create Slack channel');
    }
  }

  async inviteToSlackChannel(
    accessToken: string,
    channelId: string,
    userIds: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await axios.post(
        'https://slack.com/api/conversations.invite',
        {
          channel: channelId,
          users: userIds.join(','),
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error inviting to Slack channel:', error);
      throw new Error('Failed to invite to Slack channel');
    }
  }

  // Salesforce Integration
  async createSalesforceContact(
    accessToken: string,
    instanceUrl: string,
    contact: Omit<CRMContact, 'id'>
  ): Promise<CRMContact> {
    try {
      const response = await axios.post(
        `${instanceUrl}/services/data/v52.0/sobjects/Contact/`,
        {
          FirstName: contact.name.split(' ')[0],
          LastName: contact.name.split(' ').slice(1).join(' '),
          Email: contact.email,
          Phone: contact.phone,
          Account: contact.company ? { Name: contact.company } : undefined,
          ...contact.customFields,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        phone: contact.phone,
        customFields: contact.customFields,
      };
    } catch (error) {
      console.error('Error creating Salesforce contact:', error);
      throw new Error('Failed to create Salesforce contact');
    }
  }

  async updateSalesforceContact(
    accessToken: string,
    instanceUrl: string,
    contactId: string,
    updates: Partial<CRMContact>
  ): Promise<void> {
    try {
      await axios.patch(
        `${instanceUrl}/services/data/v52.0/sobjects/Contact/${contactId}`,
        {
          FirstName: updates.name?.split(' ')[0],
          LastName: updates.name?.split(' ').slice(1).join(' '),
          Email: updates.email,
          Phone: updates.phone,
          ...updates.customFields,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error updating Salesforce contact:', error);
      throw new Error('Failed to update Salesforce contact');
    }
  }

  // HubSpot Integration
  async createHubSpotContact(
    apiKey: string,
    contact: Omit<CRMContact, 'id'>
  ): Promise<CRMContact> {
    try {
      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          properties: {
            firstname: contact.name.split(' ')[0],
            lastname: contact.name.split(' ').slice(1).join(' '),
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            ...contact.customFields,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        phone: contact.phone,
        customFields: contact.customFields,
      };
    } catch (error) {
      console.error('Error creating HubSpot contact:', error);
      throw new Error('Failed to create HubSpot contact');
    }
  }

  async createHubSpotDeal(
    apiKey: string,
    deal: {
      name: string;
      amount: number;
      stage: string;
      contactId?: string;
      companyId?: string;
    }
  ): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/deals',
        {
          properties: {
            dealname: deal.name,
            amount: deal.amount.toString(),
            dealstage: deal.stage,
          },
          associations: [
            ...(deal.contactId ? [{
              to: { id: deal.contactId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
            }] : []),
            ...(deal.companyId ? [{
              to: { id: deal.companyId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }],
            }] : []),
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { id: response.data.id };
    } catch (error) {
      console.error('Error creating HubSpot deal:', error);
      throw new Error('Failed to create HubSpot deal');
    }
  }

  // Zoom Integration
  async createZoomMeeting(
    accessToken: string,
    meeting: {
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      agenda?: string;
      settings?: any;
    }
  ): Promise<{
    id: string;
    join_url: string;
    start_url: string;
    password?: string;
  }> {
    try {
      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        meeting,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id.toString(),
        join_url: response.data.join_url,
        start_url: response.data.start_url,
        password: response.data.password,
      };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  // Generic webhook sender
  async sendWebhook(
    url: string,
    data: any,
    headers: Record<string, string> = {}
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 10000,
      });

      return {
        success: true,
        response: response.data,
      };
    } catch (error) {
      console.error('Error sending webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Integration health check
  async checkIntegrationHealth(integration: Integration): Promise<{
    isHealthy: boolean;
    error?: string;
    lastChecked: Date;
  }> {
    const lastChecked = new Date();

    try {
      switch (integration.provider) {
        case 'google':
          await this.testGoogleConnection(integration.config.accessToken);
          break;
        case 'microsoft':
          await this.testMicrosoftConnection(integration.config.accessToken);
          break;
        case 'slack':
          await this.testSlackConnection(integration.config.accessToken);
          break;
        case 'salesforce':
          await this.testSalesforceConnection(
            integration.config.accessToken,
            integration.config.instanceUrl
          );
          break;
        case 'hubspot':
          await this.testHubSpotConnection(integration.config.apiKey);
          break;
        default:
          throw new Error(`Unknown integration provider: ${integration.provider}`);
      }

      return { isHealthy: true, lastChecked };
    } catch (error) {
      return {
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked,
      };
    }
  }

  private async testGoogleConnection(accessToken: string): Promise<void> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.calendarList.list();
  }

  private async testMicrosoftConnection(accessToken: string): Promise<void> {
    const graphClient = Client.init({
      authProvider: (done) => done(null, accessToken),
    });
    await graphClient.api('/me').get();
  }

  private async testSlackConnection(accessToken: string): Promise<void> {
    await axios.get('https://slack.com/api/auth.test', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
  }

  private async testSalesforceConnection(accessToken: string, instanceUrl: string): Promise<void> {
    await axios.get(`${instanceUrl}/services/data/v52.0/sobjects/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
  }

  private async testHubSpotConnection(apiKey: string): Promise<void> {
    await axios.get('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
  }
}

export const integrationService = new IntegrationService();
