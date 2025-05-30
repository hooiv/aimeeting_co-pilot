import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Fab,
  Menu,
  MenuItem,
  Slider,
  Popover,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Badge,
} from '@mui/material';
import {
  StopScreenShare,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  PictureInPicture,
  Settings,
  Brush,
  Clear,
  Undo,
  Redo,
  Save,
  Share,
  RecordVoiceOver,
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  MoreVert,
  Pause,
  PlayArrow,
  FiberManualRecord,
  Stop,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ScreenShareOverlayProps {
  screenShareRef: React.RefObject<HTMLVideoElement>;
  onStopSharing: () => void;
  isHost?: boolean;
  sharerName?: string;
  sharerAvatar?: string;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
}

interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  timestamp: number;
}

interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  size: number;
  id: string;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = ({
  screenShareRef,
  onStopSharing,
  isHost = false,
  sharerName = 'Unknown',
  sharerAvatar,
  onStartRecording,
  onStopRecording,
  isRecording = false,
}) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isPiPMode, setIsPiPMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [drawingSize, setDrawingSize] = useState(3);
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [autoHideControls, setAutoHideControls] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls
  useEffect(() => {
    if (!autoHideControls) return;

    const resetHideTimer = () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      setShowControls(true);
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetHideTimer();
    const handleMouseEnter = () => resetHideTimer();

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseenter', handleMouseEnter);
    }

    resetHideTimer();

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseenter', handleMouseEnter);
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [autoHideControls]);

  // Drawing functionality
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setCurrentStroke([
      {
        x,
        y,
        color: drawingColor,
        size: drawingSize,
        timestamp: Date.now(),
      },
    ]);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setCurrentStroke((prev) => [
      ...prev,
      {
        x,
        y,
        color: drawingColor,
        size: drawingSize,
        timestamp: Date.now(),
      },
    ]);
  };

  const stopDrawing = () => {
    if (!isDrawing || currentStroke.length === 0) return;

    const newStroke: DrawingStroke = {
      points: currentStroke,
      color: drawingColor,
      size: drawingSize,
      id: Date.now().toString(),
    };

    setUndoStack((prev) => [...prev, drawingStrokes]);
    setDrawingStrokes((prev) => [...prev, newStroke]);
    setCurrentStroke([]);
    setIsDrawing(false);
  };

  const clearDrawings = () => {
    setUndoStack((prev) => [...prev, drawingStrokes]);
    setDrawingStrokes([]);
    setCurrentStroke([]);
  };

  const undoDrawing = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setDrawingStrokes(previousState);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const togglePictureInPicture = async () => {
    if (!screenShareRef.current) return;

    try {
      if (!isPiPMode) {
        await screenShareRef.current.requestPictureInPicture();
        setIsPiPMode(true);
      } else {
        await document.exitPictureInPicture();
        setIsPiPMode(false);
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error);
    }
  };

  const handleZoomChange = (event: Event, newValue: number | number[]) => {
    setZoom(newValue as number);
  };

  const colors = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ffffff',
    '#000000',
    '#ff8000',
    '#8000ff',
    '#0080ff',
    '#80ff00',
  ];

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      {/* Video Element */}
      <video
        ref={screenShareRef}
        autoPlay
        playsInline
        style={{
          width: `${zoom}%`,
          height: `${zoom}%`,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />

      {/* Drawing Canvas */}
      {showAnnotations && (
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: isDrawingMode ? 'auto' : 'none',
            cursor: isDrawingMode ? 'crosshair' : 'default',
          }}
          width={1920}
          height={1080}
        />
      )}

      {/* Sharer Info */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Avatar src={sharerAvatar} sx={{ width: 32, height: 32 }}>
                {sharerName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {sharerName}
                </Typography>
                <Typography variant="caption" color="grey.300">
                  Sharing screen
                </Typography>
              </Box>
              {isRecording && (
                <Badge badgeContent={<FiberManualRecord sx={{ fontSize: 8 }} />} color="error">
                  <Chip label="REC" size="small" color="error" sx={{ ml: 1 }} />
                </Badge>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
              }}
            >
              {/* Stop Sharing */}
              <Tooltip title="Stop sharing">
                <Fab size="small" color="error" onClick={onStopSharing} sx={{ mx: 1 }}>
                  <StopScreenShare />
                </Fab>
              </Tooltip>

              {/* Zoom Controls */}
              <Tooltip title="Zoom out">
                <IconButton
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  disabled={zoom <= 50}
                  sx={{ color: 'white' }}
                >
                  <ZoomOut />
                </IconButton>
              </Tooltip>

              <Box sx={{ width: 100, mx: 1 }}>
                <Slider
                  value={zoom}
                  onChange={handleZoomChange}
                  min={50}
                  max={200}
                  step={25}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                  sx={{
                    color: 'white',
                    '& .MuiSlider-thumb': {
                      bgcolor: 'white',
                    },
                    '& .MuiSlider-track': {
                      bgcolor: 'white',
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                />
              </Box>

              <Tooltip title="Zoom in">
                <IconButton
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                  sx={{ color: 'white' }}
                >
                  <ZoomIn />
                </IconButton>
              </Tooltip>

              {/* Drawing Toggle */}
              <Tooltip title={isDrawingMode ? 'Exit drawing mode' : 'Enter drawing mode'}>
                <IconButton
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  sx={{
                    color: isDrawingMode ? 'primary.main' : 'white',
                    bgcolor: isDrawingMode ? 'white' : 'transparent',
                  }}
                >
                  <Brush />
                </IconButton>
              </Tooltip>

              {/* Drawing Controls */}
              {isDrawingMode && (
                <>
                  <Tooltip title="Choose color">
                    <IconButton
                      onClick={(e) => setColorPickerAnchor(e.currentTarget)}
                      sx={{ color: 'white' }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          bgcolor: drawingColor,
                          borderRadius: '50%',
                          border: '2px solid white',
                        }}
                      />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Undo">
                    <IconButton
                      onClick={undoDrawing}
                      disabled={undoStack.length === 0}
                      sx={{ color: 'white' }}
                    >
                      <Undo />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Clear all">
                    <IconButton
                      onClick={clearDrawings}
                      disabled={drawingStrokes.length === 0}
                      sx={{ color: 'white' }}
                    >
                      <Clear />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* Recording Controls */}
              {isHost && (
                <Tooltip title={isRecording ? 'Stop recording' : 'Start recording'}>
                  <IconButton
                    onClick={isRecording ? onStopRecording : onStartRecording}
                    sx={{
                      color: isRecording ? 'error.main' : 'white',
                      bgcolor: isRecording ? 'white' : 'transparent',
                    }}
                  >
                    {isRecording ? <Stop /> : <FiberManualRecord />}
                  </IconButton>
                </Tooltip>
              )}

              {/* Fullscreen */}
              <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Tooltip>

              {/* Picture-in-Picture */}
              <Tooltip title="Picture-in-Picture">
                <IconButton onClick={togglePictureInPicture} sx={{ color: 'white' }}>
                  <PictureInPicture />
                </IconButton>
              </Tooltip>

              {/* Settings */}
              <Tooltip title="Settings">
                <IconButton
                  onClick={(e) => setSettingsAnchor(e.currentTarget)}
                  sx={{ color: 'white' }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>

              {/* More Options */}
              <Tooltip title="More options">
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ color: 'white' }}>
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={() => setColorPickerAnchor(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Drawing Color
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, mb: 2 }}>
            {colors.map((color) => (
              <IconButton
                key={color}
                onClick={() => {
                  setDrawingColor(color);
                  setColorPickerAnchor(null);
                }}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: color,
                  border: drawingColor === color ? '3px solid' : '1px solid',
                  borderColor: drawingColor === color ? 'primary.main' : 'grey.300',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              />
            ))}
          </Box>
          <Typography variant="subtitle2" gutterBottom>
            Brush Size
          </Typography>
          <Slider
            value={drawingSize}
            onChange={(e, value) => setDrawingSize(value as number)}
            min={1}
            max={10}
            step={1}
            valueLabelDisplay="auto"
            sx={{ width: 150 }}
          />
        </Box>
      </Popover>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Switch checked={audioEnabled} onChange={(e) => setAudioEnabled(e.target.checked)} />
            }
            label="Audio"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={showAnnotations}
                onChange={(e) => setShowAnnotations(e.target.checked)}
              />
            }
            label="Show Annotations"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={autoHideControls}
                onChange={(e) => setAutoHideControls(e.target.checked)}
              />
            }
            label="Auto-hide Controls"
          />
        </MenuItem>
      </Menu>

      {/* More Options Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Save sx={{ mr: 1 }} />
          Save Screenshot
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Share sx={{ mr: 1 }} />
          Share Link
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <RecordVoiceOver sx={{ mr: 1 }} />
          Toggle Transcription
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ScreenShareOverlay;
