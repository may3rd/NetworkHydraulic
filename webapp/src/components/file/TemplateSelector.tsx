import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
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
  Autocomplete,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  Science as ScienceIcon,
  LocalGasStation as GasStationIcon,
  Water as WaterIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'industrial' | 'gas' | 'liquid' | 'advanced' | 'custom';
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
  content: any;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  version?: string;
  isFeatured?: boolean;
  estimatedTime?: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  onTemplateSelect: (template: Template) => void;
  onTemplateCreate?: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTemplateDelete?: (templateId: string) => void;
  onTemplateUpdate?: (templateId: string, updates: Partial<Template>) => void;
  showCreateButton?: boolean;
  showSearch?: boolean;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onTemplateSelect,
  onTemplateCreate,
  onTemplateDelete,
  onTemplateUpdate,
  showCreateButton = true,
  showSearch = true,
  selectedCategory,
  onCategoryChange
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
  const [createForm, setCreateForm] = React.useState({
    name: '',
    description: '',
    category: 'basic' as Template['category'],
    complexity: 'simple' as Template['complexity'],
    tags: '',
    content: '',
    author: '',
    version: '1.0'
  });

  const categories = [
    { value: 'all', label: 'All Templates', icon: <CategoryIcon /> },
    { value: 'basic', label: 'Basic', icon: <SettingsIcon /> },
    { value: 'industrial', label: 'Industrial', icon: <EngineeringIcon /> },
    { value: 'gas', label: 'Gas Systems', icon: <GasStationIcon /> },
    { value: 'liquid', label: 'Liquid Systems', icon: <WaterIcon /> },
    { value: 'advanced', label: 'Advanced', icon: <ScienceIcon /> },
    { value: 'custom', label: 'Custom', icon: <AddIcon /> }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getTemplateIcon = (category: Template['category']) => {
    switch (category) {
      case 'gas': return <GasStationIcon />;
      case 'liquid': return <WaterIcon />;
      case 'industrial': return <EngineeringIcon />;
      case 'advanced': return <ScienceIcon />;
      case 'custom': return <AddIcon />;
      default: return <SettingsIcon />;
    }
  };

  const getCategoryColor = (category: Template['category']) => {
    switch (category) {
      case 'gas': return 'info';
      case 'liquid': return 'primary';
      case 'industrial': return 'warning';
      case 'advanced': return 'error';
      case 'custom': return 'success';
      default: return 'default';
    }
  };

  const getComplexityColor = (complexity: Template['complexity']) => {
    switch (complexity) {
      case 'simple': return 'success';
      case 'medium': return 'warning';
      case 'complex': return 'error';
      default: return 'default';
    }
  };

  const handleCreateTemplate = () => {
    if (!createForm.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!createForm.content.trim()) {
      alert('Please provide template content');
      return;
    }

    try {
      const parsedContent = JSON.parse(createForm.content);
      onTemplateCreate?.({
        name: createForm.name,
        description: createForm.description,
        category: createForm.category,
        complexity: createForm.complexity,
        tags: createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        content: parsedContent,
        author: createForm.author,
        version: createForm.version
      });

      setShowCreateDialog(false);
      setCreateForm({
        name: '',
        description: '',
        category: 'basic',
        complexity: 'simple',
        tags: '',
        content: '',
        author: '',
        version: '1.0'
      });
    } catch (error) {
      alert('Invalid JSON content. Please check your template format.');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      onTemplateDelete?.(templateId);
    }
  };

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={getTemplateIcon(template.category)}
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" noWrap>
              {template.name}
            </Typography>
            {template.isFeatured && (
              <Chip size="small" label="Featured" color="primary" variant="outlined" />
            )}
          </Box>
        }
        subheader={
          <Box>
            <Typography variant="body2" color="text.secondary" component="div">
              {template.description}
            </Typography>
            <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
              <Chip 
                size="small" 
                label={template.category} 
                color={getCategoryColor(template.category) as any}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={template.complexity} 
                color={getComplexityColor(template.complexity) as any}
                variant="outlined"
              />
              {template.estimatedTime && (
                <Chip 
                  size="small" 
                  label={template.estimatedTime} 
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {template.tags.map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="Apply Template">
            <Button 
              size="small" 
              variant="contained" 
              onClick={() => onTemplateSelect(template)}
            >
              Apply
            </Button>
          </Tooltip>
          <Tooltip title="Preview Template">
            <IconButton 
              size="small" 
              onClick={() => {
                setSelectedTemplate(template);
                setShowPreviewDialog(true);
              }}
            >
              <CopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {onTemplateDelete && (
          <Tooltip title="Delete Template">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDeleteTemplate(template.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Configuration Templates
        </Typography>
        {showCreateButton && onTemplateCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Template
          </Button>
        )}
      </Box>

      {/* Search and Filter */}
      {showSearch && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory || 'all'}
                  label="Category"
                  onChange={(e) => onCategoryChange?.(e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <TemplateCard template={template} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search criteria or filters'
              : 'No templates available. Create your first template to get started.'}
          </Typography>
        </Paper>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              multiline
              rows={2}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={createForm.category}
                    label="Category"
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as Template['category'] })}
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="industrial">Industrial</MenuItem>
                    <MenuItem value="gas">Gas Systems</MenuItem>
                    <MenuItem value="liquid">Liquid Systems</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Complexity</InputLabel>
                  <Select
                    value={createForm.complexity}
                    label="Complexity"
                    onChange={(e) => setCreateForm({ ...createForm, complexity: e.target.value as Template['complexity'] })}
                  >
                    <MenuItem value="simple">Simple</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="complex">Complex</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={createForm.tags}
              onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
              placeholder="e.g., pipeline, gas, industrial"
            />
            <TextField
              fullWidth
              label="Author"
              value={createForm.author}
              onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
            />
            <TextField
              fullWidth
              label="Version"
              value={createForm.version}
              onChange={(e) => setCreateForm({ ...createForm, version: e.target.value })}
            />
            <TextField
              fullWidth
              label="Template Content (JSON)"
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              multiline
              rows={8}
              placeholder='Enter JSON configuration...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTemplate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showPreviewDialog} onClose={() => setShowPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Description:</strong> {selectedTemplate?.description}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Category:</strong> {selectedTemplate?.category} | <strong>Complexity:</strong> {selectedTemplate?.complexity}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Tags:</strong> {selectedTemplate?.tags.join(', ') || 'None'}
            </Typography>
            {selectedTemplate?.content && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Configuration Preview:
                </Typography>
                <Alert severity="info" variant="outlined">
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    fontSize: '0.875rem',
                    margin: 0
                  }}>
                    {JSON.stringify(selectedTemplate.content, null, 2)}
                  </pre>
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
          {selectedTemplate && (
            <Button 
              variant="contained" 
              onClick={() => {
                onTemplateSelect(selectedTemplate);
                setShowPreviewDialog(false);
              }}
            >
              Apply Template
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateSelector;