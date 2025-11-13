import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  FileCopy as FileIcon
} from '@mui/icons-material';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
  suggestion?: string;
  path?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
  suggestion?: string;
  path?: string;
}

export interface ValidationInfo {
  field: string;
  message: string;
  severity: 'info';
  path?: string;
}

interface FilePreviewProps {
  file: File;
  validation: ValidationResult;
  onRetry?: () => void;
  onDownload?: () => void;
  showDetails?: boolean;
  collapsible?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  validation,
  onRetry,
  onDownload,
  showDetails = true,
  collapsible = true
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'json' ? '📊' : '📄';
  };

  const getFileType = (file: File) => {
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

  const getValidationStatus = () => {
    if (validation.isValid) {
      return { severity: 'success', icon: <SuccessIcon />, label: 'Valid' };
    } else if (validation.errors.length > 0) {
      return { severity: 'error', icon: <ErrorIcon />, label: 'Invalid' };
    } else if (validation.warnings.length > 0) {
      return { severity: 'warning', icon: <WarningIcon />, label: 'Warning' };
    }
    return { severity: 'info', icon: <DescriptionIcon />, label: 'Info' };
  };

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const renderErrorTable = (errors: ValidationError[]) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Field</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Suggestion</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errors.map((error, index) => (
            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {error.field}
              </TableCell>
              <TableCell>{error.message}</TableCell>
              <TableCell>
                <Chip 
                  size="small" 
                  label={error.severity} 
                  color={getStatusColor(error.severity) as any}
                />
              </TableCell>
              <TableCell>{error.suggestion || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const status = getValidationStatus();

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Typography variant="h4" sx={{ mr: 1 }}>
            {getFileIcon(file)}
          </Typography>
        }
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" noWrap>
              {file.name}
            </Typography>
            <Chip
              size="small"
              label={getFileType(file)}
              variant="outlined"
            />
            <Chip
              size="small"
              label={status.label}
              color={getStatusColor(status.severity) as any}
              icon={status.icon}
            />
          </Box>
        }
        subheader={`${formatFileSize(file.size)} • ${new Date(file.lastModified).toLocaleDateString()}`}
        action={
          collapsible ? (
            <IconButton
              onClick={() => setExpanded(!expanded)}
              aria-label="expand/collapse"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          ) : undefined
        }
        sx={{ pb: 0 }}
      />
      
      <Collapse in={!collapsible || expanded} timeout="auto">
        <CardContent sx={{ pt: 1 }}>
          {/* Summary Section */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Typography variant="subtitle2">
                {validation.isValid ? 'Valid' : 'Invalid'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Errors
              </Typography>
              <Typography variant="subtitle2" color={validation.errors.length > 0 ? 'error.main' : 'text.primary'}>
                {validation.errors.length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Warnings
              </Typography>
              <Typography variant="subtitle2" color={validation.warnings.length > 0 ? 'warning.main' : 'text.primary'}>
                {validation.warnings.length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Info
              </Typography>
              <Typography variant="subtitle2" color="text.primary">
                {validation.info.length}
              </Typography>
            </Grid>
          </Grid>

          {/* Actions */}
          {(onRetry || onDownload) && (
            <Box display="flex" gap={1} sx={{ mb: 2 }}>
              {onRetry && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onRetry}
                  startIcon={<FileIcon />}
                >
                  Retry Validation
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onDownload}
                  startIcon={<DescriptionIcon />}
                >
                  Download File
                </Button>
              )}
            </Box>
          )}

          {/* Error/Warning Messages */}
          {showDetails && (
            <Box>
              {/* Errors */}
              {validation.errors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Errors ({validation.errors.length})
                  </Typography>
                  {renderErrorTable(validation.errors)}
                </Box>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Warnings ({validation.warnings.length})
                  </Typography>
                  {renderErrorTable(validation.warnings)}
                </Box>
              )}

              {/* Info Messages */}
              {validation.info.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Information ({validation.info.length})
                  </Typography>
                  {renderErrorTable(validation.info)}
                </Box>
              )}

              {/* Success Message */}
              {validation.isValid && validation.errors.length === 0 && (
                <Alert severity="success" variant="outlined">
                  File validation passed successfully. The configuration is ready for processing.
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default FilePreview;