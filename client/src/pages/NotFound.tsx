import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        backgroundColor: 'background.default',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            maxWidth: 500,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: '6rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              404
            </Typography>
          </motion.div>

          <Typography variant="h4" gutterBottom color="text.primary">
            Page Not Found
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or
            you entered the wrong URL.
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              color="primary"
            >
              Go Home
            </Button>

            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              color="secondary"
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default NotFound;
