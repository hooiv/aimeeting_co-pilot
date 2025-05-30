import React, { useState, useEffect } from 'react';
import {
  Box,
  Tooltip,
  IconButton,
  Popover,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  SignalWifi4Bar,
  SignalWifi3Bar,
  SignalWifi2Bar,
  SignalWifi1Bar,
  SignalWifiOff,
  NetworkCheck,
  Speed,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface NetworkStats {
  bandwidth: number;
  latency: number;
  packetLoss: number;
  jitter: number;
  resolution: string;
  frameRate: number;
  bitrate: number;
  codec: string;
}

interface NetworkQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  stats?: NetworkStats;
  onRefresh?: () => void;
  showDetails?: boolean;
}

const NetworkQualityIndicator: React.FC<NetworkQualityIndicatorProps> = ({
  quality,
  stats,
  onRefresh,
  showDetails = true,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [previousQuality, setPreviousQuality] = useState(quality);

  // Track quality trends
  useEffect(() => {
    const qualityLevels = {
      disconnected: 0,
      poor: 1,
      fair: 2,
      good: 3,
      excellent: 4,
    };

    const currentLevel = qualityLevels[quality];
    const previousLevel = qualityLevels[previousQuality];

    if (currentLevel > previousLevel) {
      setTrend('up');
    } else if (currentLevel < previousLevel) {
      setTrend('down');
    } else {
      setTrend('stable');
    }

    setPreviousQuality(quality);
  }, [quality, previousQuality]);

  const getQualityIcon = () => {
    switch (quality) {
      case 'excellent':
        return <SignalWifi4Bar color="success" />;
      case 'good':
        return <SignalWifi3Bar color="primary" />;
      case 'fair':
        return <SignalWifi2Bar color="warning" />;
      case 'poor':
        return <SignalWifi1Bar color="error" />;
      case 'disconnected':
        return <SignalWifiOff color="disabled" />;
      default:
        return <SignalWifiOff color="disabled" />;
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'primary';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      case 'disconnected':
        return 'disabled';
      default:
        return 'disabled';
    }
  };

  const getQualityText = () => {
    switch (quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getQualityDescription = () => {
    switch (quality) {
      case 'excellent':
        return 'Perfect connection quality. All features working optimally.';
      case 'good':
        return 'Good connection quality. Minor issues may occur occasionally.';
      case 'fair':
        return 'Fair connection quality. Some features may be limited.';
      case 'poor':
        return 'Poor connection quality. Significant issues expected.';
      case 'disconnected':
        return 'No connection detected. Please check your internet.';
      default:
        return 'Connection quality unknown.';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" fontSize="small" />;
      case 'down':
        return <TrendingDown color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return 'success';
    if (latency < 100) return 'warning';
    return 'error';
  };

  const getPacketLossColor = (loss: number) => {
    if (loss < 1) return 'success';
    if (loss < 3) return 'warning';
    return 'error';
  };

  const getBandwidthColor = (bandwidth: number) => {
    if (bandwidth > 5) return 'success';
    if (bandwidth > 2) return 'warning';
    return 'error';
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (showDetails) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const formatBandwidth = (bandwidth: number) => {
    if (bandwidth < 1) {
      return `${Math.round(bandwidth * 1000)} Kbps`;
    }
    return `${bandwidth.toFixed(1)} Mbps`;
  };

  return (
    <>
      <Tooltip title={`Network: ${getQualityText()}`}>
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            position: 'relative',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={{ duration: 1, ease: 'linear' }}
          >
            {getQualityIcon()}
          </motion.div>

          {/* Trend indicator */}
          <AnimatePresence>
            {trend !== 'stable' && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                }}
              >
                {getTrendIcon()}
              </motion.div>
            )}
          </AnimatePresence>
        </IconButton>
      </Tooltip>

      {/* Detailed Network Info Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Paper sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NetworkCheck color="primary" />
              <Typography variant="h6">Network Quality</Typography>
            </Box>
            <IconButton size="small" onClick={handleRefresh} disabled={isRefreshing}>
              <Refresh />
            </IconButton>
          </Box>

          {/* Quality Status */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getQualityIcon()}
              <Typography variant="h6" color={`${getQualityColor()}.main`}>
                {getQualityText()}
              </Typography>
              {getTrendIcon()}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {getQualityDescription()}
            </Typography>
          </Box>

          {/* Quality Alert */}
          {quality === 'poor' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Poor connection detected. Consider switching to audio-only mode.
            </Alert>
          )}

          {quality === 'disconnected' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Connection lost. Attempting to reconnect...
            </Alert>
          )}

          {/* Network Statistics */}
          {stats && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Connection Details
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Speed color={getBandwidthColor(stats.bandwidth) as any} />
                  </ListItemIcon>
                  <ListItemText primary="Bandwidth" secondary={formatBandwidth(stats.bandwidth)} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Speed color={getLatencyColor(stats.latency) as any} />
                  </ListItemIcon>
                  <ListItemText primary="Latency" secondary={`${stats.latency}ms`} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    {stats.packetLoss < 1 ? (
                      <CheckCircle color="success" />
                    ) : stats.packetLoss < 3 ? (
                      <Warning color="warning" />
                    ) : (
                      <Error color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Packet Loss"
                    secondary={`${stats.packetLoss.toFixed(1)}%`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Info color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Jitter" secondary={`${stats.jitter.toFixed(1)}ms`} />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Media Quality
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText primary="Resolution" secondary={stats.resolution} />
                </ListItem>

                <ListItem>
                  <ListItemText primary="Frame Rate" secondary={`${stats.frameRate} fps`} />
                </ListItem>

                <ListItem>
                  <ListItemText
                    primary="Bitrate"
                    secondary={`${Math.round(stats.bitrate / 1000)} kbps`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemText primary="Codec" secondary={stats.codec} />
                </ListItem>
              </List>

              {/* Quality Recommendations */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Recommendations
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {stats.bandwidth < 2 && (
                  <Chip
                    label="Switch to audio-only"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
                {stats.latency > 100 && (
                  <Chip
                    label="High latency detected"
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
                {stats.packetLoss > 3 && (
                  <Chip label="Packet loss issues" size="small" color="error" variant="outlined" />
                )}
                {quality === 'excellent' && (
                  <Chip label="Optimal quality" size="small" color="success" variant="outlined" />
                )}
              </Box>

              {/* Visual Quality Indicator */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Overall Quality Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    quality === 'excellent'
                      ? 100
                      : quality === 'good'
                        ? 75
                        : quality === 'fair'
                          ? 50
                          : quality === 'poor'
                            ? 25
                            : 0
                  }
                  color={getQualityColor() as any}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                  }}
                />
              </Box>
            </>
          )}

          {/* Last Updated */}
          <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default NetworkQualityIndicator;
