import React from 'react';
import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  variant?: 'circular' | 'linear' | 'dots';
}

const LoadingDots = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -10 },
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * 0.2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
            }}
          />
        </motion.div>
      ))}
    </Box>
  );
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  progress,
  variant = 'circular',
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        padding: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Logo or Brand */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            >
              AI
            </Box>
          </motion.div>

          {/* Loading Indicator */}
          {variant === 'circular' && (
            <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
          )}

          {variant === 'linear' && (
            <Box sx={{ width: 200 }}>
              <LinearProgress
                variant={progress !== undefined ? 'determinate' : 'indeterminate'}
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                  },
                }}
              />
              {progress !== undefined && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', marginTop: 1 }}
                >
                  {Math.round(progress)}%
                </Typography>
              )}
            </Box>
          )}

          {variant === 'dots' && <LoadingDots />}

          {/* Loading Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Typography
              variant="h6"
              color="text.primary"
              sx={{ textAlign: 'center', fontWeight: 500 }}
            >
              {message}
            </Typography>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', maxWidth: 300 }}
            >
              AI Meeting Co-Pilot is preparing your intelligent meeting experience
            </Typography>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default LoadingScreen;
