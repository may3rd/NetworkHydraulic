import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
  Button,
  Alert,
  Collapse,
  Autocomplete,
  Checkbox,
  ListItemText,
  Select,
  MenuItem,
  InputLabel,
  Chip as MUIChip,
  Tooltip,
} from '@mui/material';
import {
  PictureAsPdf,
  TableChart,
  Code,
  FileUpload,
  Image,
  Web,
  Settings,
  InfoOutlined,
  CheckCircle,
  Warning,
  Download,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import type {
  ExportFormat,
  ExportOptions as ExportOptionsType,
  ReportTemplate,
  ExportPreset,
  QualitySettings,
  SecurityOptions,
  EmailDeliveryOptions,
  CloudStorageOptions,
} from './types';

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  pdf: <PictureAsPdf />,
  excel: <TableChart />,
  csv: <Code />,
  json: <FileUpload />,
  xml: <Code />,
  html: <Web />,
  png: <Image />,
  svg: <Image />,
  jpg: <Image />,
};

const formatDescriptions: Record<ExportFormat, string> = {
  pdf: 'Professional PDF document with charts and formatting',
  excel: 'Excel workbook with multiple sheets and formulas',
  csv: 'Comma-separated values for data analysis',
  json: 'Structured JSON data for APIs and integrations',
  xml: 'XML format with proper schema validation',
  html: 'Web-ready HTML document',
  png: 'PNG image of charts and diagrams',
  svg: 'Scalable vector graphics',
  jpg: 'JPEG image format',
};

const templateDescriptions: Record<ReportTemplate, string> = {
  executive_summary: 'High-level summary with key metrics and recommendations',
  detailed_technical: 'Comprehensive technical analysis with all calculations',
  calculation_report: 'Complete calculation results with raw data',
  comparison_report: 'Side-by-side comparison of multiple scenarios',
  one_page: 'Single-page summary for quick reference',
  custom: 'Custom layout with selected sections',
};

interface ExportOptionsProps {
  calculationId: string;
  calculationName: string;
  onExport: (options: ExportOptionsType) => void;
  isLoading?: boolean;
  error?: string;
  onCancel?: () => void;
  availableFormats?: ExportFormat[];
  defaultOptions?: Partial<ExportOptionsType>;
  presets?: ExportPreset[];
  onPresetSelect?: (preset: ExportPreset) => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const formatOptions: ExportFormat[] = ['pdf', 'excel', 'csv', 'json', 'xml', 'html', 'png', 'svg', 'jpg'];
const templateOptions: ReportTemplate[] = [
  'executive_summary',
  'detailed_technical',
  'calculation_report',
  'comparison_report',
  'one_page',
  'custom',
];

const qualityOptions = [
  { value: 'low', label: 'Low (fast export)' },
  { value: 'medium', label: 'Medium (balanced)' },
  { value: 'high', label: 'High (better quality)' },
  { value: 'print', label: 'Print (maximum quality)' },
];

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  calculationId,
  calculationName,
  onExport,
  isLoading = false,
  error,
  onCancel,
  availableFormats = formatOptions,
  defaultOptions = {},
  presets = [],
  onPresetSelect,
}) => {
  const [options, setOptions] = useState<ExportOptionsType>({
    format: 'pdf',
    template: 'executive_summary',
    includeCharts: true,
    includeNetworkDiagram: true,
    includeRawData: false,
    includeMetadata: true,
    customBranding: false,
    compressLargeFiles: true,
    addWatermark: false,
    includeTimestamp: true,
    selectedSections: [],
    customFields: {},
    ...defaultOptions,
  });

  const [qualitySettings, setQualitySettings] = useState<QualitySettings>({
    imageResolution: 'high',
    chartQuality: 'enhanced',
    compressionLevel: 'medium',
    fontEmbedding: true,
    vectorGraphics: true,
  });

  const [securityOptions, setSecurityOptions] = useState<SecurityOptions>({
    addWatermark: false,
    watermarkText: 'Confidential',
    watermarkOpacity: 0.15,
    encryptFile: false,
    password: '',
    readOnly: false,
    expiryDate: undefined,
  });

  const [emailDelivery, setEmailDelivery] = useState<EmailDeliveryOptions>({
    enabled: false,
    recipients: [],
    subject: '',
    message: '',
    attachFile: true,
    includeLink: true,
    expiryHours: 24,
  });

  const [cloudStorage, setCloudStorage] = useState<CloudStorageOptions>({
    enabled: false,
    provider: 'google_drive',
    credentials: {},
    folderPath: '',
    shareableLink: true,
    linkExpiry: undefined,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    // Validate options when they change
    const errors: string[] = [];
    
    if (options.format === 'pdf' && !options.template) {
      errors.push('Template is required for PDF format');
    }
    
    if (options.addWatermark && !securityOptions.watermarkText) {
      errors.push('Watermark text is required when watermark is enabled');
    }
    
    if (securityOptions.encryptFile && !securityOptions.password) {
      errors.push('Password is required when encryption is enabled');
    }
    
    setValidationErrors(errors);
  }, [options, securityOptions]);

  const handleOptionChange = (key: keyof ExportOptionsType, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleQualityChange = (key: keyof QualitySettings, value: any) => {
    setQualitySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key: keyof SecurityOptions, value: any) => {
    setSecurityOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleEmailChange = (key: keyof EmailDeliveryOptions, value: any) => {
    setEmailDelivery(prev => ({ ...prev, [key]: value }));
  };

  const handleCloudChange = (key: keyof CloudStorageOptions, value: any) => {
    setCloudStorage(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    const exportOptions: ExportOptionsType & {
      qualitySettings?: QualitySettings;
      securityOptions?: SecurityOptions;
      emailDelivery?: EmailDeliveryOptions;
      cloudStorage?: CloudStorageOptions;
    } = {
      ...options,
      qualitySettings,
      securityOptions,
      emailDelivery,
      cloudStorage,
    };

    onExport(exportOptions);
  };

  const canExport = validationErrors.length === 0 && !isLoading;

  return (
    <StyledCard>
      <CardHeader
        title={
          <SectionHeader>
            <Download /> Export Options
          </SectionHeader>
        }
        subheader="Configure your export settings"
      />
      
      <CardContent sx={{ flex: 1, overflow: 'auto' }}>
        <Grid container spacing={3}>
          {/* Format Selection */}
          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
                Export Format
              </FormLabel>
              <RadioGroup
                row
                value={options.format}
                onChange={(e) => handleOptionChange('format', e.target.value)}
              >
                <Grid container spacing={1}>
                  {availableFormats.map((format) => (
                    <Grid item key={format}>
                      <Tooltip title={formatDescriptions[format]}>
                        <FormControlLabel
                          value={format}
                          control={<Radio size="small" />}
                          label={
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {formatIcons[format]}
                              <Typography variant="body2" textTransform="capitalize">
                                {format}
                              </Typography>
                            </Box>
                          }
                        />
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Template Selection */}
          {options.format === 'pdf' && (
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Report Template
                </FormLabel>
                <RadioGroup
                  value={options.template}
                  onChange={(e) => handleOptionChange('template', e.target.value)}
                >
                  <Grid container spacing={2}>
                    {templateOptions.map((template) => (
                      <Grid item xs={12} sm={6} key={template}>
                        <Tooltip title={templateDescriptions[template]}>
                          <FormControlLabel
                            value={template}
                            control={<Radio size="small" />}
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight="medium" textTransform="capitalize">
                                  {template.replace('_', ' ')}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {templateDescriptions[template]}
                                </Typography>
                              </Box>
                            }
                            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                          />
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          {/* Presets */}
          {presets.length > 0 && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Export Presets</InputLabel>
                <Select
                  value=""
                  label="Export Presets"
                  onChange={(e) => {
                    const preset = presets.find(p => p.id === e.target.value);
                    if (preset && onPresetSelect) {
                      onPresetSelect(preset);
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Select a preset</em>
                  </MenuItem>
                  {presets.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {preset.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {preset.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Basic Options */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Content Options
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeCharts}
                      onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                    />
                  }
                  label="Include Charts & Graphs"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeNetworkDiagram}
                      onChange={(e) => handleOptionChange('includeNetworkDiagram', e.target.checked)}
                    />
                  }
                  label="Include Network Diagram"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeRawData}
                      onChange={(e) => handleOptionChange('includeRawData', e.target.checked)}
                    />
                  }
                  label="Include Raw Data"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeMetadata}
                      onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                    />
                  }
                  label="Include Metadata"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.includeTimestamp}
                      onChange={(e) => handleOptionChange('includeTimestamp', e.target.checked)}
                    />
                  }
                  label="Include Timestamp"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.compressLargeFiles}
                      onChange={(e) => handleOptionChange('compressLargeFiles', e.target.checked)}
                    />
                  }
                  label="Compress Large Files"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Advanced Options Toggle */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? undefined : <Settings />}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </Grid>

          {/* Advanced Options */}
          <Collapse in={showAdvanced} sx={{ width: '100%' }}>
            {/* Quality Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Quality Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Image Resolution"
                    value={qualitySettings.imageResolution}
                    onChange={(e) => handleQualityChange('imageResolution', e.target.value)}
                    fullWidth
                  >
                    {qualityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Chart Quality"
                    value={qualitySettings.chartQuality}
                    onChange={(e) => handleQualityChange('chartQuality', e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="enhanced">Enhanced</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={qualitySettings.fontEmbedding}
                        onChange={(e) => handleQualityChange('fontEmbedding', e.target.checked)}
                      />
                    }
                    label="Embed Fonts"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={qualitySettings.vectorGraphics}
                        onChange={(e) => handleQualityChange('vectorGraphics', e.target.checked)}
                      />
                    }
                    label="Use Vector Graphics"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Security Options */}
            <Grid item xs={12}>
              <Button
                variant="text"
                onClick={() => setShowSecurity(!showSecurity)}
                endIcon={showSecurity ? undefined : <InfoOutlined />}
                sx={{ mb: 2 }}
              >
                {showSecurity ? 'Hide' : 'Show'} Security Options
              </Button>
              
              <Collapse in={showSecurity}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={securityOptions.addWatermark}
                            onChange={(e) => handleSecurityChange('addWatermark', e.target.checked)}
                          />
                        }
                        label="Add Watermark"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Watermark Text"
                        value={securityOptions.watermarkText || ''}
                        onChange={(e) => handleSecurityChange('watermarkText', e.target.value)}
                        disabled={!securityOptions.addWatermark}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={securityOptions.encryptFile}
                            onChange={(e) => handleSecurityChange('encryptFile', e.target.checked)}
                          />
                        }
                        label="Encrypt File"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="password"
                        label="Password"
                        value={securityOptions.password}
                        onChange={(e) => handleSecurityChange('password', e.target.value)}
                        disabled={!securityOptions.encryptFile}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Grid>

            {/* Email Delivery */}
            <Grid item xs={12}>
              <Button
                variant="text"
                onClick={() => setShowDelivery(!showDelivery)}
                endIcon={showDelivery ? undefined : <InfoOutlined />}
                sx={{ mb: 2 }}
              >
                {showDelivery ? 'Hide' : 'Show'} Email Delivery Options
              </Button>
              
              <Collapse in={showDelivery}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={emailDelivery.enabled}
                            onChange={(e) => handleEmailChange('enabled', e.target.checked)}
                          />
                        }
                        label="Enable Email Delivery"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        options={[]}
                        freeSolo
                        renderTags={(value: string[], getTagProps) =>
                          value.map((option: string, index: number) => (
                            <MUIChip variant="outlined" label={option} {...getTagProps({ index })} />
                          ))
                        }
                        renderInput={(params) => {
                          const { InputLabelProps, ...otherParams } = params;
                          return (
                            <TextField
                              {...otherParams}
                              label="Recipients"
                              placeholder="Enter email addresses"
                              size="medium"
                            />
                          );
                        }}
                        disabled={!emailDelivery.enabled}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Subject"
                        value={emailDelivery.subject}
                        onChange={(e) => handleEmailChange('subject', e.target.value)}
                        disabled={!emailDelivery.enabled}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Message"
                        value={emailDelivery.message}
                        onChange={(e) => handleEmailChange('message', e.target.value)}
                        disabled={!emailDelivery.enabled}
                        multiline
                        rows={3}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Grid>
          </Collapse>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium">
                  Please fix the following errors:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            </Grid>
          )}

          {/* Error Display */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            </Grid>
          )}
        </Grid>
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} justifyContent="space-between">
          <Grid item>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={!canExport}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? 'Exporting...' : 'Export'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </StyledCard>
  );
};

export default ExportOptions;