import { Box, Paper, Stack, Typography } from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useMemo } from 'react'
import ReactFlow, { Background, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import { useCalculationStore } from '../store/calculationStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const VisualizationPanel = () => {
  const result = useCalculationStore((state) => state.result)

  const chartData = useMemo(() => {
    if (!result) {
      return null
    }
    return {
      labels: result.pressureProfile.map((point) => point.label),
      datasets: [
        {
          label: 'Pressure (kPa)',
          data: result.pressureProfile.map((point) => point.pressure),
          borderColor: '#1565C0',
          backgroundColor: '#1565C0',
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    }
  }, [result])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value: string | number) => `${value} kPa`,
          },
        },
      },
    }),
    [],
  )

  const flowNodes = useMemo(() => {
    if (!result) {
      return { nodes: [], edges: [] }
    }
    const nodes = result.sections.map((section, index) => ({
      id: section.id,
      position: { x: index * 220, y: 0 },
      data: {
        label: (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">{section.id}</Typography>
            <Typography variant="caption" color="text.secondary">
              ΔP {section.pressureDrop.toFixed(2)} kPa
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Flow {section.flowRate.toFixed(3)} m³/s
            </Typography>
          </Stack>
        ),
      },
      style: {
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.1)',
        width: 180,
        background: '#fff',
      },
    }))
    const edges = nodes.slice(0, -1).map((node, index) => ({
      id: `edge-${index}`,
      source: node.id,
      target: nodes[index + 1].id,
      animated: true,
      style: { strokeWidth: 2 },
    }))
    return { nodes, edges }
  }, [result])

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Visualization & Topology</Typography>
        {!result ? (
          <Typography variant="body2" color="text.secondary">
            Results will render a pressure profile and simplified network layout once the solver completes.
          </Typography>
        ) : (
          <>
            {chartData && (
              <Box sx={{ height: 240 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            )}
            <Box sx={{ height: 320, mt: 2 }}>
              <ReactFlow
                nodes={flowNodes.nodes}
                edges={flowNodes.edges}
                fitView
                attributionPosition="bottom-left"
              >
                <MiniMap />
                <Background gap={16} size={1} />
              </ReactFlow>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  )
}

export default VisualizationPanel
