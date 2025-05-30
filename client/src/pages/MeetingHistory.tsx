import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const MeetingHistory: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Meeting History
        </Typography>
        <Typography variant="body2">Advanced meeting history interface coming soon...</Typography>
      </Paper>
    </Box>
  );
};

export default MeetingHistory;
