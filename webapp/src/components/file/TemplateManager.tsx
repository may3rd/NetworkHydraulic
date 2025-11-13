import React from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  FileCopy as FileIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  Science as ScienceIcon,
  LocalGasStation as GasStationIcon,
  Water as WaterIcon,
  Engineering as EngineeringIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Template } from '../../templates/templates';
import TemplateSelector from './TemplateSelector';

interface TemplateManagerProps {
  templates: Template[];
  onTemplateCreate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTemplateUpdate: (templateId: string, updates: Partial<Template>) => void;
  onTemplateDelete: (templateId: string) => void;
  onTemplateSelect: (template: Template) => void;
  selectedTemplate?: Template | null;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateSelect,
  selectedTemplate
}) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedComplexity, setSelectedComplexity] = React.useState('all');

  const [createForm, setCreateForm] = React.useState({
    name: '',
    description: '',
    category: 'basic' as Template['category'],
    complexity: 'simple' as Template['complexity'],
    tags: '',
    content: '',
    author: '',
    version: '1.0',
    isFeatured: false
  });

  const [editForm, setEditForm] = React.useState({
    id: '',
    name: '',
    description: '',
    category: 'basic' as Template['category'],
    complexity: 'simple' as Template['complexity'],
    tags: '',
    author: '',
    version: '1.0',
    isFeatured: false
  });

  const [importForm, setImportForm] = React.useState({
    name: '',
    file: null as File | null,
    content: ''
  });

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity;
    
    return matchesSearch && matchesCategory && matchesComplexity;
  });

  // Group templates by category
  const groupedTemplates = React.useMemo(() => {
    const groups: Record<string, Template[]> = {
      basic: [],
      liquid: [],
      gas: [],
      industrial: [],
      advanced: [],
      custom: []
    };

    templates.forEach(template => {
      groups[template.category].push(template);
    });

    return groups;
  }, [templates]);

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
      onTemplateCreate({
        name: createForm.name,
        description: createForm.description,
        category: createForm.category,
        complexity: createForm.complexity,
        tags: createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        content: parsedContent,
        author: createForm.author,
        version: createForm.version,
        isFeatured: createForm.isFeatured
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
        version: '1.0',
        isFeatured: false
      });
    } catch (error) {
      alert('Invalid JSON content. Please check your template format.');
    }
  };

  const handleEditTemplate = () => {
    if (!editForm.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    onTemplateUpdate(editForm.id, {
      name: editForm.name,
      description: editForm.description,
      category: editForm.category,
      complexity: editForm.complexity,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      author: editForm.author,
      version: editForm.version,
      isFeatured: editForm.isFeatured
    });

    setShowEditDialog(false);
  };

  const handleEditClick = (template: Template) => {
    setEditForm({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      complexity: template.complexity,
      tags: template.tags.join(', '),
      author: template.author || '',
      version: template.version || '1.0',
      isFeatured: template.isFeatured || false
    });
    setShowEditDialog(true);
  };

  const handleImportTemplate = () => {
    if (!importForm.file) {
      alert('Please select a file to import');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedContent = JSON.parse(content);
        
        setImportForm({
          ...importForm,
          content: JSON.stringify(parsedContent, null, 2)
        });
      } catch (error) {
        alert('Invalid JSON file. Please check the file format.');
      }
    };
    reader.readAsText(importForm.file);
  };

  const handleSaveImport = () => {
    if (!importForm.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!importForm.content.trim()) {
      alert('No valid content to import');
      return;
    }

    try {
      const parsedContent = JSON.parse(importForm.content);
      onTemplateCreate({
        name: importForm.name,
        description: 'Imported template',
        category: 'custom',
        complexity: 'medium',
        tags: ['imported', 'custom'],
        content: parsedContent,
        author: 'User',
        version: '1.0',
        isFeatured: false
      });

      setShowImportDialog(false);
      setImportForm({ name: '', file: null, content: '' });
    } catch (error) {
      alert('Invalid JSON content. Please check your template format.');
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories', icon: <CategoryIcon /> },
    { value: 'basic', label: 'Basic', icon: <SettingsIcon /> },
    { value: 'liquid', label: 'Liquid Systems', icon: <WaterIcon /> },
    { value: 'gas', label: 'Gas Systems', icon: <GasStationIcon /> },
    { value: 'industrial', label: 'Industrial', icon: <EngineeringIcon /> },
    { value: 'advanced', label: 'Advanced', icon: <ScienceIcon /> }
  ];

  const complexities = [
    { value: 'all', label: 'All Complexities' },
    { value: 'simple', label: 'Simple' },
    { value: 'medium', label: 'Medium' },
    { value: 'complex', label: 'Complex' }
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Template Management
        </Typography>
        <ButtonGroup variant="outlined" size="small">
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Template
          </Button>
          <Button
            startIcon={<FileIcon />}
            onClick={() => setShowImportDialog(true)}
          >
            Import Template
          </Button>
        </ButtonGroup>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Template Gallery" />
        <Tab label="Template Library" />
        <Tab label="Template Analytics" />
      </Tabs>

      {/* Template Gallery */}
      {activeTab === 0 && (
        <TemplateSelector
          templates={filteredTemplates}
          onTemplateSelect={onTemplateSelect}
          onTemplateCreate={onTemplateCreate}
          onTemplateDelete={onTemplateDelete}
          onTemplateUpdate={onTemplateUpdate}
          showCreateButton={false}
          showSearch={true}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}

      {/* Template Library */}
      {activeTab === 1 && (
        <Box>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Complexity</InputLabel>
                  <Select
                    value={selectedComplexity}
                    label="Complexity"
                    onChange={(e) => setSelectedComplexity(e.target.value)}
                  >
                    {complexities.map((complexity) => (
                      <MenuItem key={complexity.value} value={complexity.value}>
                        {complexity.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Template Groups */}
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            categoryTemplates.length > 0 && (
              <Box key={category} mb={3}>
                <Typography variant="h6" gutterBottom>
                  {getTemplateIcon(category as Template['category'])}
                  {' '}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Templates
                  {' '}
                  <Chip 
                    size="small" 
                    label={categoryTemplates.length} 
                    color={getCategoryColor(category as Template['category']) as any}
                    variant="outlined"
                  />
                </Typography>
                
                <Grid container spacing={2}>
                  {categoryTemplates.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                      <Card variant="outlined">
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
                                  label={template.complexity} 
                                  color={template.complexity === 'simple' ? 'success' : template.complexity === 'medium' ? 'warning' : 'error'}
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
                        />
                        <CardContent>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {template.tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                          <Box>
                            <Button 
                              size="small" 
                              variant="contained" 
                              onClick={() => onTemplateSelect(template)}
                            >
                              Apply
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => handleEditClick(template)}
                            >
                              Edit
                            </Button>
                          </Box>
                          <Button 
                            size="small" 
                            color="error"
                            onClick={() => onTemplateDelete(template.id)}
                          >
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )
          ))}
        </Box>
      )}

      {/* Template Analytics */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Template Distribution" />
                <CardContent>
                  <List>
                    {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                      <ListItem key={category}>
                        <ListItemText
                          primary={category.charAt(0).toUpperCase() + category.slice(1)}
                          secondary={`${categoryTemplates.length} templates`}
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            size="small" 
                            label={categoryTemplates.length} 
                            color={getCategoryColor(category as Template['category']) as any}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Complexity Breakdown" />
                <CardContent>
                  <List>
                    {complexities.slice(1).map((complexity) => {
                      const count = templates.filter(t => t.complexity === complexity.value).length;
                      return (
                        <ListItem key={complexity.value}>
                          <ListItemText
                            primary={complexity.label}
                            secondary={`${count} templates`}
                          />
                          <ListItemSecondaryAction>
                            <Chip 
                              size="small" 
                              label={count} 
                              color={complexity.value === 'simple' ? 'success' : complexity.value === 'medium' ? 'warning' : 'error'}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
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
              rows={10}
              placeholder='Enter JSON configuration...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTemplate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Template</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              multiline
              rows={2}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editForm.category}
                    label="Category"
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Template['category'] })}
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
                    value={editForm.complexity}
                    label="Complexity"
                    onChange={(e) => setEditForm({ ...editForm, complexity: e.target.value as Template['complexity'] })}
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
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              placeholder="e.g., pipeline, gas, industrial"
            />
            <TextField
              fullWidth
              label="Author"
              value={editForm.author}
              onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
            />
            <TextField
              fullWidth
              label="Version"
              value={editForm.version}
              onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditTemplate}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Import Template Dialog */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Template</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Template Name"
              value={importForm.name}
              onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
              required
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileIcon />}
            >
              Select JSON File
              <input
                type="file"
                hidden
                accept=".json"
                onChange={(e) => setImportForm({ ...importForm, file: e.target.files?.[0] || null })}
              />
            </Button>
            {importForm.file && (
              <Alert severity="info" variant="outlined">
                Selected: {importForm.file.name}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Template Content"
              value={importForm.content}
              onChange={(e) => setImportForm({ ...importForm, content: e.target.value })}
              multiline
              rows={8}
              placeholder='JSON content will be loaded from file...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
          <Button variant="outlined" onClick={handleImportTemplate} disabled={!importForm.file}>
            Load File
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveImport}
            disabled={!importForm.content.trim() || !importForm.name.trim()}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateManager;