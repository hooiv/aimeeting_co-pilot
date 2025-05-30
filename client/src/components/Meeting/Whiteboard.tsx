import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  ButtonGroup,
  Slider,
  Popover,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Brush,
  Create,
  Rectangle,
  Circle,
  Timeline,
  TextFields,
  Undo,
  Redo,
  Clear,
  Save,
  Download,
  Upload,
  Share,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Palette,
  FormatSize,
  GridOn,
  GridOff,
  Layers,
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  Add,
  Remove,
  MoreVert,
  Image,
  InsertDriveFile,
  SmartToy,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

interface DrawingStroke {
  id: string;
  tool: string;
  points: DrawingPoint[];
  color: string;
  size: number;
  opacity: number;
  timestamp: number;
  userId?: string;
  userName?: string;
}

interface WhiteboardProps {
  width?: number;
  height?: number;
  isReadOnly?: boolean;
  onStrokeAdded?: (stroke: DrawingStroke) => void;
  onStrokeRemoved?: (strokeId: string) => void;
  onClear?: () => void;
  onSave?: (imageData: string) => void;
  initialStrokes?: DrawingStroke[];
  collaborativeMode?: boolean;
  showGrid?: boolean;
  backgroundColor?: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  width = 800,
  height = 600,
  isReadOnly = false,
  onStrokeAdded,
  onStrokeRemoved,
  onClear,
  onSave,
  initialStrokes = [],
  collaborativeMode = false,
  showGrid = false,
  backgroundColor = '#ffffff',
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialStrokes);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([]);

  // Tool state
  const [selectedTool, setSelectedTool] = useState<string>('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // UI state
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const [sizeSliderAnchor, setSizeSliderAnchor] = useState<null | HTMLElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('whiteboard');
  const [showLayers, setShowLayers] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(showGrid);

  // Layer management
  const [layers, setLayers] = useState([
    { id: 'layer1', name: 'Layer 1', visible: true, locked: false, strokes: [] as string[] },
  ]);
  const [activeLayer, setActiveLayer] = useState('layer1');

  // Predefined colors
  const colors = [
    '#000000',
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ff8000',
    '#8000ff',
    '#0080ff',
    '#80ff00',
    '#ff0080',
    '#80ff80',
    '#8080ff',
    '#ff8080',
    '#808080',
    '#c0c0c0',
  ];

  // Tools configuration
  const tools = [
    { id: 'pen', icon: <Create />, name: 'Pen' },
    { id: 'brush', icon: <Brush />, name: 'Brush' },
    { id: 'eraser', icon: <Remove />, name: 'Eraser' },
    { id: 'line', icon: <Timeline />, name: 'Line' },
    { id: 'rectangle', icon: <Rectangle />, name: 'Rectangle' },
    { id: 'circle', icon: <Circle />, name: 'Circle' },
    { id: 'text', icon: <TextFields />, name: 'Text' },
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context for high DPI displays
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    redrawCanvas();
  }, [width, height, strokes, gridEnabled, backgroundColor]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw grid if enabled
    if (gridEnabled) {
      drawGrid(ctx);
    }

    // Draw all strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // Draw current stroke
    if (currentStroke.length > 0) {
      drawCurrentStroke(ctx);
    }
  }, [strokes, currentStroke, gridEnabled, backgroundColor, width, height]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 20;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return;

    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // Draw current stroke
  const drawCurrentStroke = (ctx: CanvasRenderingContext2D) => {
    if (currentStroke.length < 2) return;

    ctx.globalAlpha = brushOpacity;
    ctx.strokeStyle = selectedTool === 'eraser' ? backgroundColor : brushColor;
    ctx.lineWidth = brushSize;

    if (selectedTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

    for (let i = 1; i < currentStroke.length; i++) {
      const point = currentStroke[i];
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // Get mouse position relative to canvas
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / zoom - pan.x,
      y: (event.clientY - rect.top) / zoom - pan.y,
    };
  };

  // Start drawing
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;

    const pos = getMousePos(event);
    setIsDrawing(true);
    setCurrentStroke([pos]);
  };

  // Continue drawing
  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;

    const pos = getMousePos(event);
    setCurrentStroke((prev) => [...prev, pos]);
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing || currentStroke.length === 0) return;

    const newStroke: DrawingStroke = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      tool: selectedTool,
      points: currentStroke,
      color: selectedTool === 'eraser' ? backgroundColor : brushColor,
      size: brushSize,
      opacity: brushOpacity,
      timestamp: Date.now(),
      userId: 'current-user', // Replace with actual user ID
      userName: 'Current User', // Replace with actual user name
    };

    // Save current state for undo
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);

    // Add stroke
    setStrokes((prev) => [...prev, newStroke]);
    setCurrentStroke([]);
    setIsDrawing(false);

    // Notify parent
    onStrokeAdded?.(newStroke);
  };

  // Undo
  const undo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [strokes, ...prev]);
    setStrokes(previousState);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  // Redo
  const redo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[0];
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes(nextState);
    setRedoStack((prev) => prev.slice(1));
  };

  // Clear canvas
  const clearCanvas = () => {
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes([]);
    onClear?.();
  };

  // Save canvas
  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    onSave?.(imageData);

    // Download image
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = imageData;
    link.click();

    setSaveDialogOpen(false);
  };

  // Zoom in/out
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Toolbar */}
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Tools */}
        <ButtonGroup orientation="vertical" variant="outlined" size="small">
          {tools.map((tool) => (
            <Tooltip key={tool.id} title={tool.name} placement="right">
              <IconButton
                onClick={() => setSelectedTool(tool.id)}
                color={selectedTool === tool.id ? 'primary' : 'default'}
                sx={{
                  bgcolor: selectedTool === tool.id ? 'primary.light' : 'transparent',
                }}
              >
                {tool.icon}
              </IconButton>
            </Tooltip>
          ))}
        </ButtonGroup>

        {/* Color Picker */}
        <Tooltip title="Color">
          <IconButton
            onClick={(e) => setColorPickerAnchor(e.currentTarget)}
            sx={{
              bgcolor: brushColor,
              border: '2px solid white',
              '&:hover': { bgcolor: brushColor },
            }}
          >
            <Palette sx={{ color: 'white' }} />
          </IconButton>
        </Tooltip>

        {/* Brush Size */}
        <Tooltip title="Brush Size">
          <IconButton onClick={(e) => setSizeSliderAnchor(e.currentTarget)}>
            <FormatSize />
          </IconButton>
        </Tooltip>

        {/* Actions */}
        <ButtonGroup orientation="vertical" variant="outlined" size="small">
          <Tooltip title="Undo">
            <IconButton onClick={undo} disabled={undoStack.length === 0}>
              <Undo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo">
            <IconButton onClick={redo} disabled={redoStack.length === 0}>
              <Redo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear">
            <IconButton onClick={clearCanvas}>
              <Clear />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Paper>

      {/* View Controls */}
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          p: 1,
          display: 'flex',
          gap: 1,
          zIndex: 1000,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Tooltip title="Zoom In">
          <IconButton onClick={() => handleZoom(0.1)} size="small">
            <ZoomIn />
          </IconButton>
        </Tooltip>

        <Chip
          label={`${Math.round(zoom * 100)}%`}
          size="small"
          onClick={resetView}
          sx={{ cursor: 'pointer' }}
        />

        <Tooltip title="Zoom Out">
          <IconButton onClick={() => handleZoom(-0.1)} size="small">
            <ZoomOut />
          </IconButton>
        </Tooltip>

        <Tooltip title="Reset View">
          <IconButton onClick={resetView} size="small">
            <CenterFocusStrong />
          </IconButton>
        </Tooltip>

        <Tooltip title={gridEnabled ? 'Hide Grid' : 'Show Grid'}>
          <IconButton onClick={() => setGridEnabled(!gridEnabled)} size="small">
            {gridEnabled ? <GridOff /> : <GridOn />}
          </IconButton>
        </Tooltip>

        <Tooltip title="More Options">
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
            <MoreVert />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Canvas Container */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: selectedTool === 'eraser' ? 'crosshair' : 'default',
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'top left',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            display: 'block',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </Box>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Whiteboard actions"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        direction="up"
      >
        <SpeedDialAction
          icon={<Save />}
          tooltipTitle="Save"
          onClick={() => setSaveDialogOpen(true)}
        />
        <SpeedDialAction
          icon={<Share />}
          tooltipTitle="Share"
          onClick={() => console.log('Share whiteboard')}
        />
        <SpeedDialAction
          icon={<Upload />}
          tooltipTitle="Import"
          onClick={() => console.log('Import image')}
        />
        <SpeedDialAction
          icon={<SmartToy />}
          tooltipTitle="AI Assist"
          onClick={() => console.log('AI assistance')}
        />
      </SpeedDial>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={() => setColorPickerAnchor(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Choose Color
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, mb: 2 }}>
            {colors.map((color) => (
              <IconButton
                key={color}
                onClick={() => {
                  setBrushColor(color);
                  setColorPickerAnchor(null);
                }}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: color,
                  border: brushColor === color ? '3px solid' : '1px solid',
                  borderColor: brushColor === color ? 'primary.main' : 'grey.300',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
              />
            ))}
          </Box>
          <TextField
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>
      </Popover>

      {/* Size Slider Popover */}
      <Popover
        open={Boolean(sizeSliderAnchor)}
        anchorEl={sizeSliderAnchor}
        onClose={() => setSizeSliderAnchor(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Brush Size: {brushSize}px
          </Typography>
          <Slider
            value={brushSize}
            onChange={(e, value) => setBrushSize(value as number)}
            min={1}
            max={50}
            step={1}
            valueLabelDisplay="auto"
          />
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Opacity: {Math.round(brushOpacity * 100)}%
          </Typography>
          <Slider
            value={brushOpacity}
            onChange={(e, value) => setBrushOpacity(value as number)}
            min={0.1}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          />
        </Box>
      </Popover>

      {/* More Options Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => setSaveDialogOpen(true)}>
          <Save sx={{ mr: 1 }} />
          Save as Image
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Upload sx={{ mr: 1 }} />
          Import Image
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Share sx={{ mr: 1 }} />
          Share Whiteboard
        </MenuItem>
        <MenuItem onClick={() => setShowLayers(!showLayers)}>
          <Layers sx={{ mr: 1 }} />
          {showLayers ? 'Hide' : 'Show'} Layers
        </MenuItem>
      </Menu>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Whiteboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveCanvas} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collaboration Indicators */}
      {collaborativeMode && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            display: 'flex',
            gap: 1,
          }}
        >
          <Chip
            label="Live Collaboration"
            color="success"
            size="small"
            sx={{ animation: 'pulse 2s infinite' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Whiteboard;
