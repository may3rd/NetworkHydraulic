import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import axios from 'axios'
import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { submitCalculation } from '../services/api'
import { useCalculationStore } from '../store/calculationStore'

const schema = yup
  .object({
    projectName: yup.string().required('Please name your project'),
    direction: yup
      .string()
      .oneOf(['auto', 'upstream-to-downstream', 'downstream-to-upstream'])
      .required('Specify at least one direction'),
    designMargin: yup
      .number()
      .min(0, 'Margin cannot be negative')
      .max(100, 'Margin must be 100% or less')
      .typeError('Design margin must be a number')
      .default(10),
  })
  .required()

type ConfigFormValues = yup.InferType<typeof schema>

const directionOptions = [
  { label: 'Auto (let solver decide)', value: 'auto' },
  { label: 'Upstream → Downstream', value: 'upstream-to-downstream' },
  { label: 'Downstream → Upstream', value: 'downstream-to-upstream' },
]

const statusColor: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  idle: 'default',
  pending: 'warning',
  completed: 'success',
  failed: 'error',
}

const statusLabel: Record<string, string> = {
  idle: 'Awaiting run',
  pending: 'Calculation in progress',
  completed: 'Latest run succeeded',
  failed: 'Latest run failed',
}

const fileAccept = {
  'application/x-yaml': ['.yaml', '.yml'],
  'application/json': ['.json'],
}

const ConfigForm = () => {
  const status = useCalculationStore((state) => state.status)
  const setConfig = useCalculationStore((state) => state.setConfig)
  const setResult = useCalculationStore((state) => state.setResult)
  const setStatus = useCalculationStore((state) => state.setStatus)
  const addHistory = useCalculationStore((state) => state.addHistory)

  const [configContent, setConfigContent] = useState<string | null>(null)
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfigFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      projectName: '',
      direction: 'auto',
      designMargin: 10,
    },
  })

  const onDrop = useCallback((files: File[]) => {
    if (files.length === 0) {
      setUploadName(null)
      setConfigContent(null)
      return
    }

    const file = files[0]
    setUploadName(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setConfigContent(text)
      setErrorMessage(null)
    }
    reader.onerror = () => {
      setConfigContent(null)
      setErrorMessage('Unable to read configuration file')
    }
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: fileAccept,
  })

  const onSubmit: SubmitHandler<ConfigFormValues> = async (values) => {
    if (!configContent) {
      setErrorMessage('Please upload a network configuration file before running')
      return
    }

    setStatus('pending')
    setConfig({
      projectName: values.projectName,
      networkDirection: values.direction,
      designMargin: values.designMargin,
      fileName: uploadName ?? undefined,
    })
    setErrorMessage(null)

    try {
      const result = await submitCalculation({
        projectName: values.projectName,
        config: configContent,
      })
      setResult(result)
      addHistory({
        id: result.id,
        projectName: values.projectName,
        status: 'completed',
        timestamp: result.generatedAt,
      })
      setStatus('completed')
    } catch (error) {
      setStatus('failed')
      const message =
        axios.isAxiosError(error) && error.response?.data?.detail
          ? String(error.response.data.detail)
          : 'Unable to run calculation right now. Try again later.'
      setErrorMessage(message)
      addHistory({
        id: `failure-${Date.now()}`,
        projectName: values.projectName,
        status: 'failed',
        timestamp: new Date().toISOString(),
      })
    }
  }

  const badge = useMemo(
    () => (
      <Chip
        label={statusLabel[status] ?? 'Ready'}
        color={statusColor[status]}
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      />
    ),
    [status],
  )

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Stack spacing={1}>
        <Typography variant="h6">Network Configuration</Typography>
        <Typography variant="body2" color="text.secondary">
          Upload or describe your YAML configuration and submit the calculation to see
          results and profiles.
        </Typography>
        <Divider sx={{ my: 1 }} />
        {badge}
        <Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Project name"
            placeholder="Service line Alpha"
            error={Boolean(errors.projectName)}
            helperText={errors.projectName?.message}
            {...register('projectName')}
            fullWidth
          />
          <FormControl fullWidth error={Boolean(errors.direction)}>
            <InputLabel id="direction-label">Network direction</InputLabel>
            <Select
              labelId="direction-label"
              label="Network direction"
              defaultValue="auto"
              {...register('direction')}
            >
              {directionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.direction?.message}</FormHelperText>
          </FormControl>
          <TextField
            label="Design margin (%)"
            type="number"
            inputProps={{ min: 0, max: 100, step: 0.5 }}
            error={Boolean(errors.designMargin)}
            helperText={errors.designMargin?.message ?? 'Adds a buffer to flow estimates'}
            {...register('designMargin')}
            fullWidth
          />
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              px: 2,
              py: 3,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'transparent',
            }}
          >
            <input {...getInputProps()} />
            <Typography variant="body2" color="text.secondary">
              {uploadName ? (
                <>
                  Loaded file <strong>{uploadName}</strong>
                </>
              ) : (
                'Drag a YAML/JSON network config or click to browse'
              )}
            </Typography>
          </Box>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!configContent || isSubmitting || status === 'pending'}
          >
            {status === 'pending' ? 'Running calculation…' : 'Run calculation'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default ConfigForm
