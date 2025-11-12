import { Box, Container, Stack, Typography } from '@mui/material'
import ConfigForm from './components/ConfigForm'
import HistoryPanel from './components/HistoryPanel'
import ResultsPanel from './components/ResultsPanel'
import VisualizationPanel from './components/VisualizationPanel'
import './App.css'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={1} mb={3}>
          <Typography variant="h3" component="h1">
            Network Hydraulic Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload network configurations, run the solver, and instantly compare pressure profiles,
            section losses, and volumetric flow. This interface reflects the documentation flow for
            project planning and result inspection.
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
            gap: 3,
          }}
        >
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 1 } }}>
            <ConfigForm />
            <Box mt={3}>
              <HistoryPanel />
            </Box>
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 2' } }}>
            <ResultsPanel />
            <Box mt={3}>
              <VisualizationPanel />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default App
