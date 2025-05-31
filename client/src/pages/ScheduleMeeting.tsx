import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Schedule,
  VideoCall,
  People,
  Settings,
  Add,
  Delete,
  CalendarToday,
  AccessTime,
  LocationOn,
  Link,
  Security,
  Notifications,
  Integration,
  Save,
  Send,
  Preview,
  Check,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface MeetingFormData {
  title: string;
  description: string;
  startTime: Date | null;
  duration: number;
  agenda: string[];
  participants: string[];
  tags: string[];
  isRecurring: boolean;
  recurringPattern: string;
  isPrivate: boolean;
  requiresPassword: boolean;
  password: string;
  enableWaitingRoom: boolean;
  allowRecording: boolean;
  enableTranscription: boolean;
  enableAIInsights: boolean;
  integrations: {
    calendar: boolean;
    slack: boolean;
    teams: boolean;
    zoom: boolean;
  };
}

const ScheduleMeeting: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    startTime: new Date(Date.now() + 3600000), // 1 hour from now
    duration: 60,
    agenda: [''],
    participants: [],
    tags: [],
    isRecurring: false,
    recurringPattern: 'weekly',
    isPrivate: false,
    requiresPassword: false,
    password: '',
    enableWaitingRoom: true,
    allowRecording: true,
    enableTranscription: true,
    enableAIInsights: true,
    integrations: {
      calendar: true,
      slack: false,
      teams: false,
      zoom: false,
    },
  });

  const steps = [
    {
      label: 'Basic Information',
      description: 'Meeting title, description, and timing',
    },
    {
      label: 'Participants & Agenda',
      description: 'Add participants and agenda items',
    },
    {
      label: 'Settings & Security',
      description: 'Configure meeting settings and security',
    },
    {
      label: 'Integrations',
      description: 'Connect with external services',
    },
  ];

  const handleInputChange = (field: keyof MeetingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAgendaChange = (index: number, value: string) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index] = value;
    setFormData(prev => ({
      ...prev,
      agenda: newAgenda,
    }));
  };

  const addAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      agenda: [...prev.agenda, ''],
    }));
  };

  const removeAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to meeting room or success page
      navigate('/meetings');
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBasicInformation = () => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Meeting Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter meeting title"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the purpose and goals of this meeting"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Time"
              value={formData.startTime}
              onChange={(newValue) => handleInputChange('startTime', newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Duration</InputLabel>
            <Select
              value={formData.duration}
              label="Duration"
              onChange={(e) => handleInputChange('duration', e.target.value)}
            >
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>1 hour</MenuItem>
              <MenuItem value={90}>1.5 hours</MenuItem>
              <MenuItem value={120}>2 hours</MenuItem>
              <MenuItem value={180}>3 hours</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isRecurring}
                onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
              />
            }
            label="Recurring Meeting"
          />
          {formData.isRecurring && (
            <FormControl sx={{ ml: 2, minWidth: 120 }}>
              <InputLabel>Pattern</InputLabel>
              <Select
                value={formData.recurringPattern}
                label="Pattern"
                onChange={(e) => handleInputChange('recurringPattern', e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderParticipantsAndAgenda = () => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Participants
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formData.participants}
            onChange={(_, newValue) => handleInputChange('participants', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add participants by email"
                placeholder="Enter email addresses"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={index}
                />
              ))
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Agenda
          </Typography>
          {formData.agenda.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                label={`Agenda Item ${index + 1}`}
                value={item}
                onChange={(e) => handleAgendaChange(index, e.target.value)}
                placeholder="Enter agenda item"
              />
              {formData.agenda.length > 1 && (
                <IconButton
                  onClick={() => removeAgendaItem(index)}
                  sx={{ ml: 1 }}
                  color="error"
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            startIcon={<Add />}
            onClick={addAgendaItem}
            variant="outlined"
            size="small"
          >
            Add Agenda Item
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Tags
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={['standup', 'review', 'planning', 'retrospective', 'demo']}
            value={formData.tags}
            onChange={(_, newValue) => handleInputChange('tags', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add tags"
                placeholder="Enter tags to categorize this meeting"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={index}
                />
              ))
            }
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Schedule New Meeting
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and configure your meeting with advanced settings and integrations
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Stepper */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel>{step.label}</StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="textSecondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>

          {/* Form Content */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader
                title={steps[activeStep].label}
                subheader={steps[activeStep].description}
              />
              <CardContent>
                {activeStep === 0 && renderBasicInformation()}
                {activeStep === 1 && renderParticipantsAndAgenda()}
                {activeStep === 2 && renderSettingsAndSecurity()}
                {activeStep === 3 && renderIntegrations()}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Preview />}
                      onClick={() => setPreviewDialogOpen(true)}
                    >
                      Preview
                    </Button>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isLoading || !formData.title}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
                      >
                        {isLoading ? 'Creating...' : 'Create Meeting'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!formData.title}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Meeting Preview</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>{formData.title}</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {formData.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Start Time:</Typography>
                  <Typography variant="body2">
                    {formData.startTime?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Duration:</Typography>
                  <Typography variant="body2">{formData.duration} minutes</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Participants:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {formData.participants.map((participant, index) => (
                      <Chip key={index} label={participant} size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Agenda:</Typography>
                  <List dense>
                    {formData.agenda.filter(item => item.trim()).map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`${index + 1}. ${item}`} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
              Create Meeting
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );

  function renderSettingsAndSecurity() {
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPrivate}
                  onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                />
              }
              label="Private Meeting"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.requiresPassword}
                  onChange={(e) => handleInputChange('requiresPassword', e.target.checked)}
                />
              }
              label="Require Password"
            />
            {formData.requiresPassword && (
              <TextField
                fullWidth
                label="Meeting Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                sx={{ mt: 2 }}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableWaitingRoom}
                  onChange={(e) => handleInputChange('enableWaitingRoom', e.target.checked)}
                />
              }
              label="Enable Waiting Room"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Meeting Features
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.allowRecording}
                  onChange={(e) => handleInputChange('allowRecording', e.target.checked)}
                />
              }
              label="Allow Recording"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableTranscription}
                  onChange={(e) => handleInputChange('enableTranscription', e.target.checked)}
                />
              }
              label="Enable Live Transcription"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableAIInsights}
                  onChange={(e) => handleInputChange('enableAIInsights', e.target.checked)}
                />
              }
              label="Enable AI Insights"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  function renderIntegrations() {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          External Integrations
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1">Calendar</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Add to calendar
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={formData.integrations.calendar}
                    onChange={(e) => handleInputChange('integrations', {
                      ...formData.integrations,
                      calendar: e.target.checked
                    })}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Integration sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1">Slack</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Send notifications
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={formData.integrations.slack}
                    onChange={(e) => handleInputChange('integrations', {
                      ...formData.integrations,
                      slack: e.target.checked
                    })}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }
};

export default ScheduleMeeting;
