import React, { useState, useEffect, useCallback } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  Divider,
  Badge,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Edit,
  Delete,
  Save,
  ContentCopy,
  Visibility,
  Settings,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';

import type {
  ReportTemplate,
  ReportTemplateConfig,
  ReportSection,
  ReportLayout,
  ReportBranding,
  TemplateVariables,
  ExportOptions as ExportOptionsType,
} from './types';

interface ReportGeneratorProps {
  calculationId: string;
  calculationName: string;
  onGenerate: (template: ReportTemplateConfig, options: ExportOptionsType) => void;
  isLoading?: boolean;
  error?: string;
  onCancel?: () => void;
  availableTemplates?: ReportTemplateConfig[];
  defaultTemplate?: ReportTemplate;
  onUpdateTemplates?: (templates: ReportTemplateConfig[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const sectionOptions = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'High-level overview with key metrics and findings',
    icon: '📊',
  },
  {
    id: 'calculation_results',
    title: 'Calculation Results',
    description: 'Detailed calculation results and analysis',
    icon: '📈',
  },
  {
    id: 'network_diagram',
    title: 'Network Diagram',
    description: 'Visual representation of the pipe network',
    icon: '🌐',
  },
  {
    id: 'pressure_profile',
    title: 'Pressure Profile',
    description: 'Pressure changes along the network',
    icon: '📉',
  },
  {
    id: 'velocity_distribution',
    title: 'Velocity Distribution',
    description: 'Flow velocity analysis',
    icon: '⚡',
  },
  {
    id: 'loss_breakdown',
    title: 'Loss Breakdown',
    description: 'Analysis of pressure losses by component',
    icon: '📊',
  },
  {
    id: 'critical_conditions',
    title: 'Critical Conditions',
    description: 'Warnings and critical conditions detected',
    icon: '⚠️',
  },
  {
    id: 'recommendations',
    title: 'Recommendations',
    description: 'Optimization suggestions and recommendations',
    icon: '💡',
  },
  {
    id: 'methodology',
    title: 'Methodology',
    description: 'Calculation methods and assumptions',
    icon: '📋',
  },
  {
    id: 'appendices',
    title: 'Appendices',
    description: 'Additional data and raw calculations',
    icon: '📄',
  },
];

const defaultTemplateConfigs: Record<ReportTemplate, ReportTemplateConfig> = {
  executive_summary: {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'High-level summary with key metrics and recommendations',
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        enabled: true,
        order: 1,
        content: 'executive_summary',
      },
      {
        id: 'critical_conditions',
        title: 'Critical Conditions',
        enabled: true,
        order: 2,
        content: 'critical_conditions',
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        enabled: true,
        order: 3,
        content: 'recommendations',
      },
    ],
    layout: {
      orientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 25, bottom: 25, left: 25, right: 25 },
      header: {
        showLogo: true,
        title: 'Executive Summary Report',
        showDate: true,
        showPageNumbers: true,
      },
      footer: {
        showCompanyInfo: true,
        showPageNumbers: true,
      },
    },
    branding: {
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    defaultOptions: {
      format: 'pdf',
      includeCharts: true,
      includeNetworkDiagram: false,
      includeRawData: false,
      includeMetadata: true,
    },
  },
  detailed_technical: {
    id: 'detailed_technical',
    name: 'Detailed Technical Report',
    description: 'Comprehensive technical analysis with all calculations',
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        enabled: true,
        order: 1,
        content: 'executive_summary',
      },
      {
        id: 'calculation_results',
        title: 'Calculation Results',
        enabled: true,
        order: 2,
        content: 'calculation_results',
      },
      {
        id: 'network_diagram',
        title: 'Network Diagram',
        enabled: true,
        order: 3,
        content: 'network_diagram',
      },
      {
        id: 'pressure_profile',
        title: 'Pressure Profile',
        enabled: true,
        order: 4,
        content: 'pressure_profile',
      },
      {
        id: 'velocity_distribution',
        title: 'Velocity Distribution',
        enabled: true,
        order: 5,
        content: 'velocity_distribution',
      },
      {
        id: 'loss_breakdown',
        title: 'Loss Breakdown',
        enabled: true,
        order: 6,
        content: 'loss_breakdown',
      },
      {
        id: 'critical_conditions',
        title: 'Critical Conditions',
        enabled: true,
        order: 7,
        content: 'critical_conditions',
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        enabled: true,
        order: 8,
        content: 'recommendations',
      },
      {
        id: 'methodology',
        title: 'Methodology',
        enabled: true,
        order: 9,
        content: 'methodology',
      },
      {
        id: 'appendices',
        title: 'Appendices',
        enabled: true,
        order: 10,
        content: 'appendices',
      },
    ],
    layout: {
      orientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 25, bottom: 25, left: 25, right: 25 },
      header: {
        showLogo: true,
        title: 'Detailed Technical Report',
        showDate: true,
        showPageNumbers: true,
      },
      footer: {
        showCompanyInfo: true,
        showPageNumbers: true,
      },
    },
    branding: {
      primaryColor: '#00695c',
      secondaryColor: '#424242',
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    defaultOptions: {
      format: 'pdf',
      includeCharts: true,
      includeNetworkDiagram: true,
      includeRawData: true,
      includeMetadata: true,
    },
  },
  calculation_report: {
    id: 'calculation_report',
    name: 'Complete Calculation Report',
    description: 'Complete calculation results with raw data',
    sections: [
      {
        id: 'calculation_results',
        title: 'Calculation Results',
        enabled: true,
        order: 1,
        content: 'calculation_results',
      },
      {
        id: 'appendices',
        title: 'Raw Data',
        enabled: true,
        order: 2,
        content: 'appendices',
      },
    ],
    layout: {
      orientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 25, bottom: 25, left: 25, right: 25 },
      header: {
        showLogo: false,
        title: 'Calculation Report',
        showDate: true,
        showPageNumbers: true,
      },
      footer: {
        showCompanyInfo: false,
        showPageNumbers: true,
      },
    },
    branding: {
      primaryColor: '#424242',
      secondaryColor: '#757575',
      fontFamily: 'Courier New, monospace',
    },
    defaultOptions: {
      format: 'pdf',
      includeCharts: false,
      includeNetworkDiagram: false,
      includeRawData: true,
      includeMetadata: false,
    },
  },
  comparison_report: {
    id: 'comparison_report',
    name: 'Comparison Report',
    description: 'Side-by-side comparison of multiple scenarios',
    sections: [
      {
        id: 'executive_summary',
        title: 'Comparison Summary',
        enabled: true,
        order: 1,
        content: 'executive_summary',
      },
      {
        id: 'calculation_results',
        title: 'Results Comparison',
        enabled: true,
        order: 2,
        content: 'calculation_results',
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        enabled: true,
        order: 3,
        content: 'recommendations',
      },
    ],
    layout: {
      orientation: 'landscape',
      pageSize: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      header: {
        showLogo: true,
        title: 'Scenario Comparison Report',
        showDate: true,
        showPageNumbers: true,
      },
      footer: {
        showCompanyInfo: true,
        showPageNumbers: true,
      },
    },
    branding: {
      primaryColor: '#ef6c00',
      secondaryColor: '#424242',
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    defaultOptions: {
      format: 'pdf',
      includeCharts: true,
      includeNetworkDiagram: false,
      includeRawData: false,
      includeMetadata: true,
    },
  },
  one_page: {
    id: 'one_page',
    name: 'One-Page Summary',
    description: 'Single-page summary for quick reference',
    sections: [
      {
        id: 'executive_summary',
        title: 'Key Metrics',
        enabled: true,
        order: 1,
        content: 'executive_summary',
      },
    ],
    layout: {
      orientation: 'portrait',
      pageSize: 'letter',
      margins: { top: 15, bottom: 15, left: 15, right: 15 },
      header: {
        showLogo: true,
        title: 'One-Page Summary',
        showDate: true,
        showPageNumbers: false,
      },
      footer: {
        showCompanyInfo: false,
        showPageNumbers: false,
      },
    },
    branding: {
      primaryColor: '#d32f2f',
      secondaryColor: '#424242',
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    defaultOptions: {
      format: 'pdf',
      includeCharts: false,
      includeNetworkDiagram: false,
      includeRawData: false,
      includeMetadata: false,
    },
  },
  custom: {
    id: 'custom',
    name: 'Custom Template',
    description: 'Custom layout with selected sections',
    sections: [],
    layout: {
      orientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 25, bottom: 25, left: 25, right: 25 },
      header: {
        showLogo: true,
        title: 'Custom Report',
        showDate: true,
        showPageNumbers: true,
      },
      footer: {
        showCompanyInfo: true,
        showPageNumbers: true,
      },
    },
    branding: {
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    defaultOptions: {
      format: 'pdf',
      includeCharts: true,
      includeNetworkDiagram: true,
      includeRawData: false,
      includeMetadata: true,
    },
  },
};

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  calculationId,
  calculationName,
  onGenerate,
  isLoading = false,
  error,
  onCancel,
  availableTemplates = [],
  defaultTemplate = 'executive_summary',
  onUpdateTemplates,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(defaultTemplate);
  const [customTemplate, setCustomTemplate] = useState<ReportTemplateConfig>(
    defaultTemplateConfigs.custom
  );
  const [availableSections, setAvailableSections] = useState<ReportSection[]>(
    defaultTemplateConfigs.custom.sections
  );
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplateConfig[]>(
    availableTemplates.length > 0 ? availableTemplates : Object.values(defaultTemplateConfigs)
  );

  useEffect(() => {
    const config = templates.find(t => t.id === selectedTemplate) || defaultTemplateConfigs[selectedTemplate];
    if (config) {
      setCustomTemplate(config);
      setAvailableSections(config.sections);
    }
  }, [selectedTemplate, templates]);

  const handleTemplateChange = (template: ReportTemplate) => {
    setSelectedTemplate(template);
  };

  const handleSectionToggle = (sectionId: string) => {
    setAvailableSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, enabled: !section.enabled }
          : section
      )
    );
  };

  const handleSectionReorder = (sectionId: string, direction: 'up' | 'down') => {
    setAvailableSections(prev => {
      const sections = [...prev];
      const index = sections.findIndex(s => s.id === sectionId);
      
      if (direction === 'up' && index > 0) {
        const temp = sections[index - 1];
        sections[index - 1] = sections[index];
        sections[index] = temp;
      } else if (direction === 'down' && index < sections.length - 1) {
        const temp = sections[index + 1];
        sections[index + 1] = sections[index];
        sections[index] = temp;
      }
      
      return sections.map((section, idx) => ({ ...section, order: idx + 1 }));
    });
  };

  const handleLayoutChange = (field: string, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [field]: value,
      },
    }));
  };

  const handleBrandingChange = (field: string, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [field]: value,
      },
    }));
  };

  const handleGenerate = () => {
    const templateConfig = selectedTemplate === 'custom' 
      ? { ...customTemplate, sections: availableSections }
      : templates.find(t => t.id === selectedTemplate) || defaultTemplateConfigs[selectedTemplate];

    const exportOptions: ExportOptionsType = {
      format: 'pdf',
      template: selectedTemplate,
      includeCharts: templateConfig.defaultOptions?.includeCharts ?? true,
      includeNetworkDiagram: templateConfig.defaultOptions?.includeNetworkDiagram ?? true,
      includeRawData: templateConfig.defaultOptions?.includeRawData ?? false,
      includeMetadata: templateConfig.defaultOptions?.includeMetadata ?? true,
      customBranding: true,
      compressLargeFiles: true,
      addWatermark: false,
      includeTimestamp: true,
      selectedSections: availableSections.filter(s => s.enabled).map(s => s.id),
      customFields: {},
    };

    onGenerate(templateConfig, exportOptions);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const newTemplate: ReportTemplateConfig = {
      id: `custom_${Date.now()}` as ReportTemplate,
      name: templateName,
      description: templateDescription,
      sections: availableSections,
      layout: customTemplate.layout,
      branding: customTemplate.branding,
      defaultOptions: customTemplate.defaultOptions,
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    
    if (onUpdateTemplates) {
      onUpdateTemplates(updatedTemplates);
    }

    setIsTemplateDialogOpen(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    
    if (onUpdateTemplates) {
      onUpdateTemplates(updatedTemplates);
    }

    if (selectedTemplate === templateId) {
      setSelectedTemplate('executive_summary');
    }
  };

  const getSectionIcon = (sectionId: string) => {
    const option = sectionOptions.find(opt => opt.id === sectionId);
    return option?.icon || '📄';
  };

  const getSectionTitle = (sectionId: string) => {
    const option = sectionOptions.find(opt => opt.id === sectionId);
    return option?.title || sectionId;
  };

  const getSectionDescription = (sectionId: string) => {
    const option = sectionOptions.find(opt => opt.id === sectionId);
    return option?.description || '';
  };

  const enabledSectionsCount = availableSections.filter(s => s.enabled).length;
  const totalSectionsCount = availableSections.length;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Report Generator"
        subheader="Create custom reports with professional templates"
      />
      
      <CardContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Template Selection" />
            <Tab label="Section Editor" />
            <Tab label="Layout & Branding" />
          </Tabs>
        </Box>

        {/* Template Selection Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  variant={selectedTemplate === template.id ? 'outlined' : 'elevation'}
                  sx={{
                    height: '100%',
                    borderColor: selectedTemplate === template.id ? 'primary.main' : 'transparent',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="h6" component="div">
                        {template.name}
                      </Typography>
                      {template.id.startsWith('custom_') && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTemplate(template.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {template.description}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Chip
                        label={`${template.sections.length} sections`}
                        size="small"
                        color="primary"
                      />
                      <Radio
                        checked={selectedTemplate === template.id}
                        onChange={() => handleTemplateChange(template.id as ReportTemplate)}
                      />
                    </Box>
                    
                    <Button
                      fullWidth
                      variant={selectedTemplate === template.id ? 'contained' : 'outlined'}
                      onClick={() => handleTemplateChange(template.id as ReportTemplate)}
                    >
                      {selectedTemplate === template.id ? 'Selected' : 'Select'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
                onClick={() => {
                  setSelectedTemplate('custom');
                  setIsTemplateDialogOpen(true);
                }}
              >
                <Box textAlign="center" py={2}>
                  <Add color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body1" color="primary">
                    Create Custom Template
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Section Editor Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Sections ({enabledSectionsCount}/{totalSectionsCount} enabled)
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Select and reorder the sections to include in your report
            </Typography>
          </Box>
          
          <List>
            {availableSections.map((section, index) => (
              <ListItem key={section.id} divider>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{getSectionIcon(section.id)}</span>
                      <Typography variant="body1">
                        {getSectionTitle(section.id)}
                      </Typography>
                      {!section.enabled && (
                        <Chip size="small" label="Disabled" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={getSectionDescription(section.id)}
                />
                
                <ListItemSecondaryAction>
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => handleSectionReorder(section.id, 'up')}
                    >
                      <ExpandMore sx={{ transform: 'rotate(-90deg)' }} />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      disabled={index === availableSections.length - 1}
                      onClick={() => handleSectionReorder(section.id, 'down')}
                    >
                      <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                    
                    <Switch
                      edge="start"
                      checked={section.enabled}
                      onChange={() => handleSectionToggle(section.id)}
                    />
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Layout & Branding Tab */}
        <TabPanel value={activeTab} index={2}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Layout Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Orientation"
                    value={customTemplate.layout.orientation}
                    onChange={(e) => handleLayoutChange('orientation', e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="portrait">Portrait</MenuItem>
                    <MenuItem value="landscape">Landscape</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Page Size"
                    value={customTemplate.layout.pageSize}
                    onChange={(e) => handleLayoutChange('pageSize', e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="A4">A4</MenuItem>
                    <MenuItem value="A3">A3</MenuItem>
                    <MenuItem value="letter">Letter</MenuItem>
                    <MenuItem value="legal">Legal</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Margins (mm)
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <TextField
                    type="number"
                    label="Top"
                    value={customTemplate.layout.margins.top}
                    onChange={(e) => handleLayoutChange('margins', {
                      ...customTemplate.layout.margins,
                      top: Number(e.target.value)
                    })}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <TextField
                    type="number"
                    label="Bottom"
                    value={customTemplate.layout.margins.bottom}
                    onChange={(e) => handleLayoutChange('margins', {
                      ...customTemplate.layout.margins,
                      bottom: Number(e.target.value)
                    })}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <TextField
                    type="number"
                    label="Left"
                    value={customTemplate.layout.margins.left}
                    onChange={(e) => handleLayoutChange('margins', {
                      ...customTemplate.layout.margins,
                      left: Number(e.target.value)
                    })}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <TextField
                    type="number"
                    label="Right"
                    value={customTemplate.layout.margins.right}
                    onChange={(e) => handleLayoutChange('margins', {
                      ...customTemplate.layout.margins,
                      right: Number(e.target.value)
                    })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Branding</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Primary Color"
                    type="color"
                    value={customTemplate.branding.primaryColor}
                    onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Secondary Color"
                    type="color"
                    value={customTemplate.branding.secondaryColor}
                    onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Font Family"
                    value={customTemplate.branding.fontFamily}
                    onChange={(e) => handleBrandingChange('fontFamily', e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
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
              onClick={handleGenerate}
              disabled={isLoading || enabledSectionsCount === 0}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Save Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onClose={() => setIsTemplateDialogOpen(false)}>
        <DialogTitle>Save Custom Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ReportGenerator;