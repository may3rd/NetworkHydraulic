import React from 'react';
import { Box, Card, CardContent, CardHeader, Divider, Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface PipeSectionsProps {
  className?: string;
}

const PipeSections: React.FC<PipeSectionsProps> = ({ className }) => {
  return (
    <Card elevation={3} sx={{ ...(className && { className }) }}>
      <CardHeader 
        title="Pipe Sections"
        subheader="Configure pipe geometry, fittings, and elevation changes"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mt: 1 }}
          >
            Add Section
          </Button>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* SectionList and SectionEditor will be added here */}
          <Box>
            <Typography variant="body1">Section list will be displayed here</Typography>
          </Box>
          <Box>
            <Typography variant="body1">Section editor will be displayed here</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PipeSections;