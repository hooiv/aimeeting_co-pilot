export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth' | 'oidc' | 'ldap';
  enabled: boolean;
  config: {
    clientId?: string;
    clientSecret?: string;
    issuer?: string;
    authUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    redirectUri?: string;
    scopes?: string[];
    // SAML specific
    entryPoint?: string;
    cert?: string;
    // LDAP specific
    url?: string;
    bindDN?: string;
    bindCredentials?: string;
    searchBase?: string;
    searchFilter?: string;
  };
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    groups?: string;
    department?: string;
    title?: string;
  };
}

export interface SSOSession {
  provider: string;
  userId: string;
  email: string;
  name: string;
  groups: string[];
  permissions: string[];
  expiresAt: string;
  refreshToken?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'meeting' | 'recording' | 'admin' | 'analytics' | 'integration';
  level: 'read' | 'write' | 'admin';
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  isSystemRole: boolean;
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  directPermissions: string[];
  effectivePermissions: string[];
  groups: string[];
}

class SSOService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // SSO Provider Management
  async getSSOProviders(): Promise<SSOProvider[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/sso/providers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SSO providers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching SSO providers:', error);
      return [];
    }
  }

  async createSSOProvider(provider: Omit<SSOProvider, 'id'>): Promise<SSOProvider | null> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/sso/providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(provider),
      });

      if (!response.ok) {
        throw new Error('Failed to create SSO provider');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating SSO provider:', error);
      return null;
    }
  }

  async updateSSOProvider(id: string, updates: Partial<SSOProvider>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/sso/providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating SSO provider:', error);
      return false;
    }
  }

  async deleteSSOProvider(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/sso/providers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting SSO provider:', error);
      return false;
    }
  }

  async testSSOProvider(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/sso/providers/${id}/test`, {
        method: 'POST',
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

  // SSO Authentication
  async initiateSSOLogin(providerId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/sso/${providerId}/login`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initiate SSO login');
      }

      const data = await response.json();
      return data.redirectUrl;
    } catch (error) {
      console.error('Error initiating SSO login:', error);
      throw error;
    }
  }

  async completeSSOLogin(providerId: string, code: string, state?: string): Promise<SSOSession | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/sso/${providerId}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error('SSO login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing SSO login:', error);
      return null;
    }
  }

  // Permission Management
  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  }

  async getRoles(): Promise<Role[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  async createRole(role: Omit<Role, 'id'>): Promise<Role | null> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(role),
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating role:', error);
      return false;
    }
  }

  async deleteRole(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/roles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    }
  }

  // User Permission Management
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return null;
    }
  }

  async updateUserPermissions(userId: string, permissions: Partial<UserPermissions>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(permissions),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      return false;
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/roles/${roleId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error assigning role to user:', error);
      return false;
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing role from user:', error);
      return false;
    }
  }

  // Permission Checking
  hasPermission(permission: string, userPermissions: string[]): boolean {
    return userPermissions.includes(permission) || userPermissions.includes('admin:all');
  }

  hasAnyPermission(permissions: string[], userPermissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission, userPermissions));
  }

  hasAllPermissions(permissions: string[], userPermissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission, userPermissions));
  }

  // Group Management
  async getGroups(): Promise<Array<{ id: string; name: string; description: string; members: string[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async createGroup(group: { name: string; description: string; members?: string[] }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(group),
      });

      return response.ok;
    } catch (error) {
      console.error('Error creating group:', error);
      return false;
    }
  }

  async addUserToGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/groups/${groupId}/members/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding user to group:', error);
      return false;
    }
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing user from group:', error);
      return false;
    }
  }
}

export const ssoService = new SSOService();
export default ssoService;
