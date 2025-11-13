import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  FileCopy as FileIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  showPreview?: boolean;
  label?: string;
}

interface UploadFile extends File {
  preview?: string;
  progress?: number;
  error?: string;
  isValid?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileRemove,
  acceptedTypes = ['.yaml', '.yml', '.json'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  disabled = false,
  showPreview = true,
  label = "Upload Configuration Files"
}) => {
  const [files, setFiles] = React.useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (disabled) return;

    // Process accepted files
    const processedFiles = acceptedFiles.map(file => {
      const uploadFile = file as UploadFile;
      uploadFile.preview = URL.createObjectURL(file);
      uploadFile.progress = 0;
      uploadFile.isValid = false;
      return uploadFile;
    });

    setFiles(prev => [...prev, ...processedFiles]);
    onFileUpload(processedFiles);

    // Handle rejected files
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ file, errors }) => {
        console.warn(`File ${file.name} rejected:`, errors);
      });
    }
  }, [disabled, onFileUpload]);

  const {
    getRootProps,
    getInputProps,
    open: openFileDialog
  } = useDropzone({
    onDrop,
    accept: {
      'application/x-yaml': acceptedTypes.filter(t => t.includes('yaml') || t.includes('yml')),
      'application/json': acceptedTypes.filter(t => t.includes('json')),
      'text/yaml': acceptedTypes.filter(t => t.includes('yaml') || t.includes('yml')),
      'text/plain': acceptedTypes.filter(t => t.includes('txt'))
    },
    maxSize,
    multiple,
    noClick: false,
    noKeyboard: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const removeFile = (fileToRemove: UploadFile) => {
    const newFiles = files.filter(file => file !== fileToRemove);
    setFiles(newFiles);
    onFileRemove?.(fileToRemove);
    // Clean up preview URL
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  const getFileIcon = (file: UploadFile) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'json' ? '📊' : '📄';
  };

  const getFileType = (file: UploadFile) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'json': return 'JSON';
      case 'yaml':
      case 'yml': return 'YAML';
      default: return 'File';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Paper
        {...(getRootProps() as any)}
        elevation={isDragActive ? 8 : 2}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
      >
        <input {...getInputProps()} />
        
        <UploadIcon 
          sx={{ 
            fontSize: 48, 
            color: 'grey.400', 
            mb: 2,
            opacity: disabled ? 0.5 : 1 
          }} 
        />
        
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Drag and drop files here, or click to browse
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Accepted formats: {acceptedTypes.join(', ')} (max {formatFileSize(maxSize)})
        </Typography>
      </Paper>

      {files.length > 0 && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">
              Uploaded Files ({files.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFiles}
              disabled={disabled}
            >
              Clear All
            </Button>
          </Box>

          <Grid container spacing={2}>
            {files.map((file, index) => (
              <Grid item xs={12} key={index}>
                <Paper
                  variant="outlined"
                  component="div"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderColor: file.error ? 'error.main' : 'grey.300'
                  }}
                >
                  <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {getFileIcon(file)}
                    </Typography>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getFileType(file)} • {formatFileSize(file.size)}
                      </Typography>
                      
                      {file.error && (
                        <Alert severity="error" variant="outlined" sx={{ mt: 1, py: 0.5 }}>
                          {file.error}
                        </Alert>
                      )}
                      
                      {showPreview && file.preview && (
                        <Box mt={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => window.open(file.preview!, '_blank')}
                          >
                            Preview
                          </Button>
                        </Box>
                      )}
                    </Box>
                    
                    <Box textAlign="right" sx={{ ml: 2 }}>
                      {file.progress !== undefined && (
                        <Box sx={{ width: 60 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={file.progress} 
                            sx={{ mb: 1 }} 
                          />
                          <Typography variant="caption">
                            {file.progress}%
                          </Typography>
                        </Box>
                      )}
                      
                      {file.isValid ? (
                        <SuccessIcon color="success" />
                      ) : file.error ? (
                        <ErrorIcon color="error" />
                      ) : null}
                    </Box>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<ClearIcon />}
                    onClick={() => removeFile(file)}
                    disabled={disabled}
                    sx={{ ml: 2 }}
                  >
                    Remove
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <Box mt={2}>
          <Typography variant="body2" gutterBottom>
            Uploading... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;