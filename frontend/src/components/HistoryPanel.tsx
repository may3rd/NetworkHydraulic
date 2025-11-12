import { Chip, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material'
import { useCallback } from 'react'
import { useCalculationStore } from '../store/calculationStore'

const statusColorMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  idle: 'default',
  pending: 'warning',
  completed: 'success',
  failed: 'error',
}

const HistoryPanel = () => {
  const history = useCalculationStore((state) => state.history)

  const formatTimestamp = useCallback((value: string) => {
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }, [])

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Stack spacing={1}>
        <Typography variant="h6">Recent Calculations</Typography>
        <Typography variant="body2" color="text.secondary">
          Tracks the last five submissions for quick reference.
        </Typography>
        <Divider />
        <List dense>
          {history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No calculations have been executed yet.
            </Typography>
          ) : (
            history.map((entry) => (
              <ListItem key={entry.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <ListItemText
                  primary={entry.projectName}
                  secondary={formatTimestamp(entry.timestamp)}
                  sx={{ marginRight: 2 }}
                />
                <Chip label={entry.status} color={statusColorMap[entry.status]} size="small" />
              </ListItem>
            ))
          )}
        </List>
      </Stack>
    </Paper>
  )
}

export default HistoryPanel
