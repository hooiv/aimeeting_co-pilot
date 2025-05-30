import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Close,
  InsertDriveFile,
  Image,
  VideoFile,
  AudioFile,
} from '@mui/icons-material';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  disabled?: boolean;
  variant?: 'button' | 'dropzone';
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '*/*',
  multiple = false,
  maxSize = 10, // 10MB default
  maxFiles = 5,
  disabled = false,
  variant = 'button',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image />;
    if (type.startsWith('video/')) return <VideoFile />;
    if (type.startsWith('audio/')) return <AudioFile />;
    return <InsertDriveFile />;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    let errorMessage = '';

    // Validate files
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation) {
        errorMessage = validation;
        break;
      }
      validFiles.push(file);
    }

    // Check max files limit
    if (validFiles.length > maxFiles) {
      errorMessage = `Maximum ${maxFiles} files allowed`;
    }

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setError(null);

    // Create uploaded file objects
    const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
    onFileSelect(validFiles);

    // Simulate upload progress
    newUploadedFiles.forEach((uploadedFile) => {
      const interval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, progress: Math.min(f.progress + 10, 100) } : f
          )
        );
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress: 100 } : f))
        );
      }, 1000);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  if (variant === 'button') {
    return (
      <Box>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <Button
          variant="outlined"
          startIcon={<AttachFile />}
          onClick={handleButtonClick}
          disabled={disabled}
          size="small"
        >
          Attach File
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}

        {uploadedFiles.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {uploadedFiles.map((uploadedFile) => (
              <Chip
                key={uploadedFile.id}
                icon={getFileIcon(uploadedFile.file)}
                label={uploadedFile.file.name}
                onDelete={() => removeFile(uploadedFile.id)}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <Paper
        sx={{
          p: 3,
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          backgroundColor: dragOver ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease-in-out',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? handleButtonClick : undefined}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Drop files here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maximum file size: {maxSize}MB
          {multiple && ` • Maximum ${maxFiles} files`}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {uploadedFiles.map((uploadedFile) => (
            <Box key={uploadedFile.id} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                {getFileIcon(uploadedFile.file)}
                <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>
                  {uploadedFile.file.name}
                </Typography>
                <IconButton size="small" onClick={() => removeFile(uploadedFile.id)}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              {uploadedFile.progress < 100 && (
                <LinearProgress
                  variant="determinate"
                  value={uploadedFile.progress}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
