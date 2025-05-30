import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2">Advanced settings interface coming soon...</Typography>
      </Paper>
    </Box>
  );
};

export default Settings;
