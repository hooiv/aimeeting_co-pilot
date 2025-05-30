import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Analytics: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body2">Advanced analytics interface coming soon...</Typography>
      </Paper>
    </Box>
  );
};

export default Analytics;
