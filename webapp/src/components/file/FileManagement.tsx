import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  FileCopy as FileIcon,
  Folder as FolderIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';

interface StoredFile {
  id: string;
  name: string;
  content: string;
  type: 'yaml' | 'json';
  size: number;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  tags?: string[];
}

interface FileManagementProps {
  onFileLoad?: (content: string, type: string, name: string) => void;
  onFileSave?: (name: string, content: string, type: string, description?: string, tags?: string[]) => void;
  supportedFormats?: string[];
  maxFileSize?: number;
  allowCloudSync?: boolean;
}

const FileManagement: React.FC<FileManagementProps> = ({
  onFileLoad,
  onFileSave,
  supportedFormats = ['yaml', 'json'],
  maxFileSize = 10 * 1024 * 1024,
  allowCloudSync = false
}) => {
  const [files, setFiles] = React.useState<StoredFile[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<StoredFile | null>(null);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [showLoadDialog, setShowLoadDialog] = React.useState(false);
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [saveForm, setSaveForm] = React.useState({
    name: '',
    type: 'yaml' as 'yaml' | 'json',
    description: '',
    tags: ''
  });

  const [importForm, setImportForm] = React.useState({
    file: null as File | null,
    name: '',
    description: '',
    type: 'yaml' as 'yaml' | 'json',
    tags: ''
  });

  React.useEffect(() => {
    loadFilesFromStorage();
  }, []);

  const loadFilesFromStorage = () => {
    try {
      const stored = localStorage.getItem('hydraulic_config_files');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFiles(parsed.map((file: any) => ({
          ...file,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt)
        })));
      }
    } catch (error) {
      console.error('Error loading files from storage:', error);
      showSnackbar('Failed to load saved files', 'error');
    }
  };

  const saveFilesToStorage = (fileList: StoredFile[]) => {
    try {
      localStorage.setItem('hydraulic_config_files', JSON.stringify(fileList));
    } catch (error) {
      console.error('Error saving files to storage:', error);
      showSnackbar('Failed to save files', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveFile = () => {
    if (!saveForm.name.trim()) {
      showSnackbar('Please enter a file name', 'warning');
      return;
    }

    if (!onFileSave) {
      showSnackbar('Save functionality not implemented', 'error');
      return;
    }

    const newFile: StoredFile = {
      id: Date.now().toString(),
      name: saveForm.name,
      content: '', // Will be filled when actual content is provided
      type: saveForm.type,
      size: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: saveForm.description,
      tags: saveForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    // Get content from parent component
    // This would typically be called with actual content
    onFileSave(saveForm.name, newFile.content, saveForm.type, saveForm.description, newFile.tags);
    
    setFiles(prev => [...prev, newFile]);
    saveFilesToStorage([...files, newFile]);
    
    setShowSaveDialog(false);
    setSaveForm({ name: '', type: 'yaml', description: '', tags: '' });
    showSnackbar('File saved successfully', 'success');
  };

  const handleLoadFile = (file: StoredFile) => {
    setSelectedFile(file);
    onFileLoad?.(file.content, file.type, file.name);
    setShowLoadDialog(false);
    showSnackbar(`Loaded ${file.name}`, 'success');
  };

  const handleDeleteFile = (fileId: string) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    if (window.confirm(`Are you sure you want to delete "${fileToDelete.name}"?`)) {
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      saveFilesToStorage(updatedFiles);
      showSnackbar(`Deleted ${fileToDelete.name}`, 'info');
    }
  };

  const handleImportFile = async () => {
    if (!importForm.file) {
      showSnackbar('Please select a file to import', 'warning');
      return;
    }

    if (importForm.file.size > maxFileSize) {
      showSnackbar('File size exceeds limit', 'error');
      return;
    }

    try {
      const content = await importForm.file.text();
      const newFile: StoredFile = {
        id: Date.now().toString(),
        name: importForm.name || importForm.file.name.replace(/\.[^.]*$/, ''),
        content,
        type: importForm.type,
        size: importForm.file.size,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: importForm.description,
        tags: importForm.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      };

      setFiles(prev => [...prev, newFile]);
      saveFilesToStorage([...files, newFile]);
      
      setShowImportDialog(false);
      setImportForm({ file: null, name: '', description: '', type: 'yaml', tags: '' });
      showSnackbar('File imported successfully', 'success');
    } catch (error) {
      console.error('Error importing file:', error);
      showSnackbar('Failed to import file', 'error');
    }
  };

  const handleExportFile = (file: StoredFile) => {
    try {
      const blob = new Blob([file.content], { 
        type: file.type === 'json' ? 'application/json' : 'application/x-yaml' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name}.${file.type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSnackbar(`Exported ${file.name}`, 'success');
    } catch (error) {
      console.error('Error exporting file:', error);
      showSnackbar('Failed to export file', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Configuration File Management
        </Typography>
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Save current configuration">
            <Button 
              startIcon={<SaveIcon />} 
              onClick={() => setShowSaveDialog(true)}
            >
              Save
            </Button>
          </Tooltip>
          <Tooltip title="Load saved configuration">
            <Button 
              startIcon={<UploadIcon />} 
              onClick={() => setShowLoadDialog(true)}
            >
              Load
            </Button>
          </Tooltip>
          <Tooltip title="Import configuration file">
            <Button 
              startIcon={<CloudUploadIcon />} 
              onClick={() => setShowImportDialog(true)}
            >
              Import
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* File List */}
      {files.length > 0 ? (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Modified</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <FileIcon fontSize="small" />
                        <Typography variant="body2">{file.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={file.type.toUpperCase()} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatFileSize(file.size)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(file.updatedAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {file.tags?.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <ButtonGroup variant="outlined" size="small">
                        <Tooltip title="Load configuration">
                          <IconButton size="small" onClick={() => handleLoadFile(file)}>
                            <UploadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export file">
                          <IconButton size="small" onClick={() => handleExportFile(file)}>
                            <CloudDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete configuration">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            No saved configurations found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Save or import configuration files to get started
          </Typography>
        </Paper>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Configuration</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="File Name"
              value={saveForm.name}
              onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={saveForm.type}
                label="File Type"
                onChange={(e) => setSaveForm({ ...saveForm, type: e.target.value as 'yaml' | 'json' })}
              >
                <MenuItem value="yaml">YAML</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={saveForm.description}
              onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={saveForm.tags}
              onChange={(e) => setSaveForm({ ...saveForm, tags: e.target.value })}
              placeholder="e.g., gas, pipeline, industrial"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFile}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onClose={() => setShowLoadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Load Configuration</DialogTitle>
        <DialogContent>
          <TableContainer sx={{ pt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Modified</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{file.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={file.type.toUpperCase()} variant="outlined" />
                    </TableCell>
                    <TableCell>{file.description || '-'}</TableCell>
                    <TableCell>{formatDate(file.updatedAt)}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => handleLoadFile(file)}
                      >
                        Load
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Configuration File</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Select File
              <input
                type="file"
                hidden
                accept={supportedFormats.map(fmt => `.${fmt}`).join(',')}
                onChange={(e) => setImportForm({ ...importForm, file: e.target.files?.[0] || null })}
              />
            </Button>
            {importForm.file && (
              <Alert severity="info" variant="outlined">
                Selected: {importForm.file.name} ({formatFileSize(importForm.file.size)})
              </Alert>
            )}
            <TextField
              fullWidth
              label="Configuration Name"
              value={importForm.name}
              onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
              placeholder="Leave empty to use filename"
            />
            <FormControl fullWidth>
              <InputLabel>File Type</InputLabel>
              <Select
                value={importForm.type}
                label="File Type"
                onChange={(e) => setImportForm({ ...importForm, type: e.target.value as 'yaml' | 'json' })}
              >
                <MenuItem value="yaml">YAML</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={importForm.description}
              onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleImportFile}>Import</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileManagement;