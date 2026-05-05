import { useState } from 'react';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useFlightSimulation } from '../simulation/FlightSimulationContext';
import type { LogSeverity } from '../../types/logs';

const severityColors: Record<LogSeverity, string> = {
  INFO: '#38bdf8',
  WARNING: '#f59e0b',
  CRITICAL: '#ef4444',
  SECURITY: '#a78bfa',
  BLOCKCHAIN: '#34d399',
  CONNECTION: '#22c55e',
  TELEMETRY: '#06b6d4',
};

export function LiveLogConsole() {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const { logs } = useFlightSimulation();

  const consoleBackground = theme.palette.mode === 'dark' ? '#050a12' : '#f8fbff';
  const rowBackground = theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.76)' : 'rgba(226, 232, 240, 0.62)';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        left: 260,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.drawer + 1,
        borderRadius: 0,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: consoleBackground,
        color: theme.palette.mode === 'dark' ? '#dbeafe' : 'text.primary',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1, borderBottom: open ? `1px solid ${theme.palette.divider}` : 'none' }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <TerminalIcon color="primary" />
          <Box>
            <Typography variant="subtitle2">Canlı Sistem Günlüğü</Typography>
            <Typography variant="caption" color="text.secondary">
              Simülasyon motorundan canlı akış
            </Typography>
          </Box>
        </Stack>

        <Tooltip title={open ? 'Konsolu daralt' : 'Konsolu genişlet'}>
          <IconButton onClick={() => setOpen((current) => !current)} color="primary" aria-label="Konsolu aç kapa">
            {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
          </IconButton>
        </Tooltip>
      </Stack>

      <Collapse in={open}>
        <Box
          sx={{
            maxHeight: 212,
            overflowY: 'auto',
            px: 2,
            py: 1.2,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          }}
        >
          <Stack spacing={0.8}>
            {logs.map((log) => {
              const severityColor = severityColors[log.severity];

              return (
                <Box
                  key={log.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '74px 110px 88px 1fr', md: '92px 128px 112px 1fr' },
                    gap: 1.2,
                    alignItems: 'center',
                    minHeight: 34,
                    px: 1.2,
                    py: 0.6,
                    borderRadius: '6px',
                    bgcolor: rowBackground,
                    border: `1px solid ${alpha(severityColor, theme.palette.mode === 'dark' ? 0.22 : 0.18)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {log.timestamp}
                  </Typography>
                  <Chip
                    size="small"
                    label={log.severity}
                    sx={{
                      width: 'fit-content',
                      minWidth: 92,
                      height: 22,
                      fontSize: 11,
                      fontWeight: 800,
                      color: severityColor,
                      bgcolor: alpha(severityColor, 0.12),
                      border: `1px solid ${alpha(severityColor, 0.35)}`,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: severityColor, fontWeight: 800 }}>
                    {log.source}
                  </Typography>
                  <Typography variant="caption" sx={{ whiteSpace: 'normal' }}>
                    {log.message}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}
