import React from 'react';
import { Box, Grid, TextField, Typography, Alert, Collapse } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';

interface SectionEditorProps {
  className?: string;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ className }) => {
  const { control, watch } = useFormContext();
  const selectedSection = watch('selectedSection');

  return (
    <Box className={className}>
      <Typography variant="subtitle1" gutterBottom>
        Section Editor
      </Typography>
      
      {!selectedSection ? (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
          <Typography variant="body2">
            Select a section from the list to edit its properties, or click "Add Section" to create a new one.
          </Typography>
        </Alert>
      ) : (
        <Collapse in={!!selectedSection}>
          <Box>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
              <Typography variant="body2">
                Section editor interface will be displayed here with detailed configuration options for the selected section.
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="sectionId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Section ID"
                      fullWidth
                      required
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || "Unique identifier for this pipe section"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      helperText="Optional description of this section"
                    />
                  )}
                />
              </Grid>
            </Grid>
            
            <Alert severity="success" sx={{ mt: 2, borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Section Configuration:</strong> Section "{selectedSection}" is being configured with all
                relevant properties. Make sure to specify accurate dimensions and fittings for precise calculations.
              </Typography>
            </Alert>
          </Box>
        </Collapse>
      )}
      
      <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Best Practices:</strong>
          {' '}
          Ensure pipe diameters are consistent between connected sections.
          Use appropriate K-factors for fittings based on manufacturer data or engineering standards.
          Accurate elevation data is crucial for pressure calculations in liquid systems.
        </Typography>
      </Alert>
    </Box>
  );
};

export default SectionEditor;