import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Alert, 
  Snackbar,
  Tab,
  Tabs,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as CalculateIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { configApi, calculationApi } from '../api/client';

const ConfigurationPage: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [configuration, setConfiguration] = useState({
    network: {
      name: 'Demo Network',
      direction: 'forward',
      boundary_pressure: 200000,
    },
    fluid: {
      name: 'Water',
      phase: 'liquid',
      temperature: 298.15,
      pressure: 200000,
      density: 997.0,
      viscosity: 0.001,
    },
    sections: [
      {
        id: 'pipe_1',
        pipe_diameter: 0.1,
        length: 100.0,
        roughness: 0.000046,
        fittings: [],
      }
    ],
  });

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Save configuration
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const configToSave = {
        network: configuration.network,
        fluid: configuration.fluid,
        sections: configuration.sections,
      };
      localStorage.setItem('hydraulic_config', JSON.stringify(configToSave));
      setIsSaved(true);
      showSnackbar('Configuration saved successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to save configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load configuration from backend
  const handleLoadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await configApi.getTemplates();
      showSnackbar('Templates loaded from server', 'success');
      console.log('Available templates:', response.data);
    } catch (error: any) {
      showSnackbar(`Failed to load templates: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate configuration
  const handleValidate = async () => {
    setIsLoading(true);
    try {
      const configToValidate = {
        network: configuration.network,
        fluid: configuration.fluid,
        sections: configuration.sections,
      };
      const response = await configApi.validate(configToValidate);
      showSnackbar('Configuration is valid!', 'success');
    } catch (error: any) {
      showSnackbar(`Validation failed: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run calculation
  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const configToCalculate = {
        network: configuration.network,
        fluid: configuration.fluid,
        sections: configuration.sections,
      };
      const response = await calculationApi.execute(configToCalculate);
      showSnackbar('Calculation completed successfully!', 'success');
      console.log('Calculation results:', response.data);
    } catch (error: any) {
      showSnackbar(`Calculation failed: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved configuration
  const handleLoadSaved = () => {
    const saved = localStorage.getItem('hydraulic_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setConfiguration(config);
        showSnackbar('Saved configuration loaded!', 'success');
      } catch (error) {
        showSnackbar('Failed to load saved configuration', 'error');
      }
    } else {
      showSnackbar('No saved configuration found', 'warning');
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  // Update configuration handler
  const updateConfiguration = (section: string, data: any) => {
    setConfiguration(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], ...data }
    }));
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Network Configuration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure your hydraulic network and run analysis calculations.
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleLoadSaved}
              disabled={isLoading}
            >
              Load Saved
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleLoadTemplates}
              disabled={isLoading}
            >
              Load Templates
            </Button>
            <Button
              startIcon={<UploadIcon />}
              disabled
              sx={{ opacity: 0.5 }}
            >
              Import File
            </Button>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSave}
              variant="outlined"
              disabled={isLoading}
            >
              Save
            </Button>
            <Button
              startIcon={<CalculateIcon />}
              onClick={handleCalculate}
              variant="contained"
              color="primary"
              disabled={isLoading}
              sx={{ ml: 1 }}
            >
              Run Calculation
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Configuration Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Fluid Properties" />
          <Tab label="Network Settings" />
          <Tab label="Pipe Sections" />
        </Tabs>

        {/* Fluid Properties Tab */}
        {activeTab === 0 && (
          <CardContent>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fluid Properties Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure the properties of the fluid being analyzed in your network.
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Fluid Name"
                      value={configuration.fluid.name}
                      onChange={(e) => updateConfiguration('fluid', { name: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Phase</InputLabel>
                      <Select
                        value={configuration.fluid.phase}
                        label="Phase"
                        onChange={(e) => updateConfiguration('fluid', { phase: e.target.value })}
                      >
                        <MenuItem value="liquid">Liquid</MenuItem>
                        <MenuItem value="gas">Gas</MenuItem>
                        <MenuItem value="vapor">Vapor</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Temperature (K)"
                      type="number"
                      value={configuration.fluid.temperature}
                      onChange={(e) => updateConfiguration('fluid', { temperature: parseFloat(e.target.value) })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pressure (Pa)"
                      type="number"
                      value={configuration.fluid.pressure}
                      onChange={(e) => updateConfiguration('fluid', { pressure: parseFloat(e.target.value) })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Density (kg/m³)"
                      type="number"
                      value={configuration.fluid.density}
                      onChange={(e) => updateConfiguration('fluid', { density: parseFloat(e.target.value) })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Viscosity (Pa·s)"
                      type="number"
                      value={configuration.fluid.viscosity}
                      onChange={(e) => updateConfiguration('fluid', { viscosity: parseFloat(e.target.value) })}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </CardContent>
        )}

        {/* Network Settings Tab */}
        {activeTab === 1 && (
          <CardContent>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Settings Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure the overall network parameters and boundary conditions.
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Network Name"
                      value={configuration.network.name}
                      onChange={(e) => updateConfiguration('network', { name: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Flow Direction</InputLabel>
                      <Select
                        value={configuration.network.direction}
                        label="Flow Direction"
                        onChange={(e) => updateConfiguration('network', { direction: e.target.value })}
                      >
                        <MenuItem value="auto">Auto</MenuItem>
                        <MenuItem value="forward">Forward</MenuItem>
                        <MenuItem value="backward">Backward</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Boundary Pressure (Pa)"
                      type="number"
                      value={configuration.network.boundary_pressure}
                      onChange={(e) => updateConfiguration('network', { boundary_pressure: parseFloat(e.target.value) })}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </CardContent>
        )}

        {/* Pipe Sections Tab */}
        {activeTab === 2 && (
          <CardContent>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pipe Sections Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure individual pipe sections with their geometry, fittings, and components.
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Sections ({configuration.sections.length} total):
                </Typography>
                
                {configuration.sections.map((section, index) => (
                  <Card key={section.id} sx={{ mb: 2, mt: 1 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle2">Section {index + 1}: {section.id}</Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            const newSections = configuration.sections.filter((_, i) => i !== index);
                            setConfiguration(prev => ({ ...prev, sections: newSections }));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Diameter (m)"
                            type="number"
                            value={section.pipe_diameter}
                            onChange={(e) => {
                              const newSections = [...configuration.sections];
                              newSections[index] = { ...section, pipe_diameter: parseFloat(e.target.value) || 0 };
                              setConfiguration(prev => ({ ...prev, sections: newSections }));
                            }}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Length (m)"
                            type="number"
                            value={section.length}
                            onChange={(e) => {
                              const newSections = [...configuration.sections];
                              newSections[index] = { ...section, length: parseFloat(e.target.value) || 0 };
                              setConfiguration(prev => ({ ...prev, sections: newSections }));
                            }}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Roughness (m)"
                            type="number"
                            value={section.roughness}
                            onChange={(e) => {
                              const newSections = [...configuration.sections];
                              newSections[index] = { ...section, roughness: parseFloat(e.target.value) || 0 };
                              setConfiguration(prev => ({ ...prev, sections: newSections }));
                            }}
                            margin="normal"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Fittings Count"
                            type="number"
                            value={section.fittings.length}
                            disabled
                            margin="normal"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newSection = {
                      id: `pipe_${Date.now()}`,
                      pipe_diameter: 0.1,
                      length: 100.0,
                      roughness: 0.000046,
                      fittings: [],
                    };
                    setConfiguration(prev => ({
                      ...prev,
                      sections: [...prev.sections, newSection]
                    }));
                  }}
                  variant="outlined"
                  sx={{ mt: 2 }}
                >
                  Add Section
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        )}
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  startIcon={<CalculateIcon />}
                  onClick={handleCalculate}
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                >
                  Run Calculation
                </Button>
                <Button
                  onClick={handleValidate}
                  variant="outlined"
                  disabled={isLoading}
                >
                  Validate Configuration
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration Status
              </Typography>
              <Stack spacing={1}>
                <Chip 
                  label="Fluid Properties Configured" 
                  color={configuration.fluid?.phase ? "success" : "default"} 
                  size="small" 
                />
                <Chip 
                  label="Network Settings Configured" 
                  color={configuration.network?.name ? "success" : "default"} 
                  size="small" 
                />
                <Chip 
                  label={`Sections: ${configuration.sections?.length || 0} configured`} 
                  color={configuration.sections?.length ? "success" : "default"} 
                  size="small" 
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Info
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Backend Status: <Chip label="Connected" color="success" size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                API Endpoint: localhost:8000/api
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Configuration Saved: <Chip 
                  label={isSaved ? "Yes" : "No"} 
                  color={isSaved ? "success" : "default"} 
                  size="small" 
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity as any}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfigurationPage;
