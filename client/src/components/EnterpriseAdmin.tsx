import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Security,
  Group,
  VpnKey,
  Settings,
  TestTube,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { ssoService, SSOProvider, Role, Permission, UserPermissions } from '../services/sso';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnterpriseAdmin: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [ssoProviders, setSSOProviders] = useState<SSOProvider[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [ssoDialogOpen, setSSODialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingSSO, setEditingSSO] = useState<SSOProvider | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form states
  const [ssoForm, setSSOForm] = useState<Partial<SSOProvider>>({
    name: '',
    type: 'oauth',
    enabled: true,
    config: {},
    attributeMapping: {
      email: 'email',
      firstName: 'given_name',
      lastName: 'family_name',
    },
  });

  const [roleForm, setRoleForm] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: [],
    isDefault: false,
    isSystemRole: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ssoData, rolesData, permissionsData] = await Promise.all([
        ssoService.getSSOProviders(),
        ssoService.getRoles(),
        ssoService.getPermissions(),
      ]);
      setSSOProviders(ssoData);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // SSO Provider Management
  const handleCreateSSO = async () => {
    try {
      const result = await ssoService.createSSOProvider(ssoForm as Omit<SSOProvider, 'id'>);
      if (result) {
        setSuccess('SSO provider created successfully');
        setSSODialogOpen(false);
        resetSSOForm();
        loadData();
      } else {
        setError('Failed to create SSO provider');
      }
    } catch (error) {
      setError('Failed to create SSO provider');
    }
  };

  const handleUpdateSSO = async () => {
    if (!editingSSO) return;
    
    try {
      const success = await ssoService.updateSSOProvider(editingSSO.id, ssoForm);
      if (success) {
        setSuccess('SSO provider updated successfully');
        setSSODialogOpen(false);
        resetSSOForm();
        loadData();
      } else {
        setError('Failed to update SSO provider');
      }
    } catch (error) {
      setError('Failed to update SSO provider');
    }
  };

  const handleDeleteSSO = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this SSO provider?')) return;
    
    try {
      const success = await ssoService.deleteSSOProvider(id);
      if (success) {
        setSuccess('SSO provider deleted successfully');
        loadData();
      } else {
        setError('Failed to delete SSO provider');
      }
    } catch (error) {
      setError('Failed to delete SSO provider');
    }
  };

  const handleTestSSO = async (id: string) => {
    try {
      const result = await ssoService.testSSOProvider(id);
      if (result.success) {
        setSuccess('SSO provider test successful');
      } else {
        setError(result.error || 'SSO provider test failed');
      }
    } catch (error) {
      setError('SSO provider test failed');
    }
  };

  const resetSSOForm = () => {
    setSSOForm({
      name: '',
      type: 'oauth',
      enabled: true,
      config: {},
      attributeMapping: {
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
      },
    });
    setEditingSSO(null);
  };

  // Role Management
  const handleCreateRole = async () => {
    try {
      const result = await ssoService.createRole(roleForm as Omit<Role, 'id'>);
      if (result) {
        setSuccess('Role created successfully');
        setRoleDialogOpen(false);
        resetRoleForm();
        loadData();
      } else {
        setError('Failed to create role');
      }
    } catch (error) {
      setError('Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    try {
      const success = await ssoService.updateRole(editingRole.id, roleForm);
      if (success) {
        setSuccess('Role updated successfully');
        setRoleDialogOpen(false);
        resetRoleForm();
        loadData();
      } else {
        setError('Failed to update role');
      }
    } catch (error) {
      setError('Failed to update role');
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const success = await ssoService.deleteRole(id);
      if (success) {
        setSuccess('Role deleted successfully');
        loadData();
      } else {
        setError('Failed to delete role');
      }
    } catch (error) {
      setError('Failed to delete role');
    }
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: [],
      isDefault: false,
      isSystemRole: false,
    });
    setEditingRole(null);
  };

  const openEditSSO = (provider: SSOProvider) => {
    setEditingSSO(provider);
    setSSOForm(provider);
    setSSODialogOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm(role);
    setRoleDialogOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Enterprise Administration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab icon={<Security />} label="SSO Providers" />
          <Tab icon={<VpnKey />} label="Roles & Permissions" />
          <Tab icon={<Group />} label="User Management" />
          <Tab icon={<Settings />} label="System Settings" />
        </Tabs>

        {/* SSO Providers Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">SSO Providers</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setSSODialogOpen(true)}
            >
              Add SSO Provider
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ssoProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>{provider.name}</TableCell>
                    <TableCell>
                      <Chip label={provider.type.toUpperCase()} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={provider.enabled ? 'Enabled' : 'Disabled'}
                        color={provider.enabled ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleTestSSO(provider.id)} title="Test">
                        <TestTube />
                      </IconButton>
                      <IconButton onClick={() => openEditSSO(provider)} title="Edit">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteSSO(provider.id)} title="Delete">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Roles & Permissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Roles & Permissions</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setRoleDialogOpen(true)}
            >
              Create Role
            </Button>
          </Box>

          <Grid container spacing={3}>
            {roles.map((role) => (
              <Grid item xs={12} md={6} lg={4} key={role.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{role.name}</Typography>
                      <Box>
                        {role.isDefault && <Chip label="Default" size="small" color="primary" />}
                        {role.isSystemRole && <Chip label="System" size="small" color="secondary" />}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {role.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {role.permissions.length} permissions
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => openEditRole(role)}>
                      Edit
                    </Button>
                    {!role.isSystemRole && (
                      <Button size="small" color="error" onClick={() => handleDeleteRole(role.id)}>
                        Delete
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* User Management Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            User management features will be implemented here.
          </Typography>
        </TabPanel>

        {/* System Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            System Settings
          </Typography>
          <Typography variant="body2" color="textSecondary">
            System configuration options will be available here.
          </Typography>
        </TabPanel>
      </Paper>

      {/* SSO Provider Dialog */}
      <Dialog open={ssoDialogOpen} onClose={() => setSSODialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSSO ? 'Edit SSO Provider' : 'Add SSO Provider'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Provider Name"
                value={ssoForm.name}
                onChange={(e) => setSSOForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={ssoForm.type}
                  onChange={(e) => setSSOForm(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="oauth">OAuth 2.0</MenuItem>
                  <MenuItem value="oidc">OpenID Connect</MenuItem>
                  <MenuItem value="saml">SAML 2.0</MenuItem>
                  <MenuItem value="ldap">LDAP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ssoForm.enabled}
                    onChange={(e) => setSSOForm(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                }
                label="Enabled"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
            </Grid>
            {ssoForm.type === 'oauth' || ssoForm.type === 'oidc' ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={ssoForm.config?.clientId || ''}
                    onChange={(e) => setSSOForm(prev => ({
                      ...prev,
                      config: { ...prev.config, clientId: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Client Secret"
                    type="password"
                    value={ssoForm.config?.clientSecret || ''}
                    onChange={(e) => setSSOForm(prev => ({
                      ...prev,
                      config: { ...prev.config, clientSecret: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Authorization URL"
                    value={ssoForm.config?.authUrl || ''}
                    onChange={(e) => setSSOForm(prev => ({
                      ...prev,
                      config: { ...prev.config, authUrl: e.target.value }
                    }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Token URL"
                    value={ssoForm.config?.tokenUrl || ''}
                    onChange={(e) => setSSOForm(prev => ({
                      ...prev,
                      config: { ...prev.config, tokenUrl: e.target.value }
                    }))}
                  />
                </Grid>
              </>
            ) : null}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSSODialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={editingSSO ? handleUpdateSSO : handleCreateSSO}
          >
            {editingSSO ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Create Role'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role Name"
                value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={roleForm.isDefault}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                }
                label="Default Role"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              <List>
                {permissions.map((permission) => (
                  <ListItem key={permission.id}>
                    <ListItemText
                      primary={permission.name}
                      secondary={permission.description}
                    />
                    <ListItemSecondaryAction>
                      <Checkbox
                        checked={roleForm.permissions?.includes(permission.id) || false}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...(roleForm.permissions || []), permission.id]
                            : (roleForm.permissions || []).filter(p => p !== permission.id);
                          setRoleForm(prev => ({ ...prev, permissions: newPermissions }));
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={editingRole ? handleUpdateRole : handleCreateRole}
          >
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnterpriseAdmin;
