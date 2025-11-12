import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { useCalculationStore } from '../store/calculationStore'

const ResultsPanel = () => {
  const result = useCalculationStore((state) => state.result)

  const summaryMetrics = useMemo(
    () =>
      result
        ? [
            {
              label: 'Total Sections',
              value: result.summary.totalSections,
            },
            {
              label: 'Total Length (m)',
              value: result.summary.totalLength.toFixed(1),
            },
            {
              label: 'Total Pressure Drop (kPa)',
              value: result.summary.totalPressureDrop.toFixed(2),
            },
            {
              label: 'Peak Flow (m³/s)',
              value: result.summary.peakFlow.toFixed(3),
            },
          ]
        : [],
    [result],
  )

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Stack spacing={1}>
        <Typography variant="h6">Results</Typography>
        <Typography variant="body2" color="text.secondary">
          The solver summarizes pressure drops, per-section losses, and peak flow across the network.
        </Typography>
        <Divider sx={{ my: 1 }} />
        {!result ? (
          <Typography variant="body2" color="text.secondary">
            Submit a configuration to see computed sections, flow, and pressure profiles.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              {summaryMetrics.map((metric) => (
                <Box key={metric.label}>
                  <Typography variant="caption" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Typography variant="subtitle1">{metric.value}</Typography>
                </Box>
              ))}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2">Sections</Typography>
              <Chip label={`${result.sections.length} configured`} size="small" variant="outlined" />
            </Stack>
            <List dense disablePadding>
              {result.sections.map((section) => (
                <ListItem key={section.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <ListItemText
                    primary={section.id}
                    secondary={`Flow ${section.flowRate.toFixed(3)} m³/s · diameter ${section.diameterMm} mm · ΔP ${section.pressureDrop.toFixed(2)} kPa`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Stack>
    </Paper>
  )
}

export default ResultsPanel
