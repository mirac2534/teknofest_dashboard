import { useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FlightIcon from '@mui/icons-material/Flight';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MemoryIcon from '@mui/icons-material/Memory';
import SearchIcon from '@mui/icons-material/Search';
import SensorsIcon from '@mui/icons-material/Sensors';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TuneIcon from '@mui/icons-material/Tune';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { SvgIconComponent } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import type { EChartsOption } from 'echarts';
import { useFlightSimulation } from '../simulation/FlightSimulationContext';
import type { LogSeverity, SystemLog } from '../../types/logs';
import type { TelemetryPacket } from '../../types/telemetry';

type CheckStatus = 'OK' | 'WARNING' | 'CRITICAL';
type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

const allSeverities: Array<LogSeverity | 'ALL'> = ['ALL', 'INFO', 'WARNING', 'CRITICAL', 'SECURITY', 'BLOCKCHAIN', 'CONNECTION', 'TELEMETRY'];

const severityColors: Record<LogSeverity, string> = {
  INFO: '#38bdf8',
  WARNING: '#f59e0b',
  CRITICAL: '#ef4444',
  SECURITY: '#a78bfa',
  BLOCKCHAIN: '#34d399',
  CONNECTION: '#22c55e',
  TELEMETRY: '#06b6d4',
};

function toneColor(theme: Theme, tone: Tone) {
  const colors: Record<Tone, string> = {
    success: theme.palette.secondary.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: '#38bdf8',
    neutral: theme.palette.text.secondary,
    primary: theme.palette.primary.main,
  };
  return colors[tone];
}

function statusTone(status?: string | null): Tone {
  if (status === 'VERIFIED' || status === 'COMMITTED' || status === 'ONLINE' || status === 'OK' || status === 'SIGNED') return 'success';
  if (status === 'TAMPER_DETECTED' || status === 'FAILED' || status === 'CRITICAL' || status === 'INVALID') return 'error';
  if (status === 'PENDING' || status === 'BUFFERING' || status === 'SYNCING' || status === 'OFFLINE' || status === 'SATCOM_FALLBACK' || status === 'WARNING') return 'warning';
  return 'neutral';
}

function displayStatus(status?: string | null) {
  if (!status) return '-';
  return status === 'TAMPER_DETECTED' ? 'TAMPER DETECTED' : status;
}

function StatusChip({ status, label }: { status?: string | null; label?: string }) {
  const theme = useTheme();
  const color = toneColor(theme, statusTone(status));

  return (
    <Chip
      size="small"
      label={label ? `${label}: ${displayStatus(status)}` : displayStatus(status)}
      sx={{
        color,
        bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.14 : 0.1),
        border: `1px solid ${alpha(color, 0.34)}`,
        fontWeight: 850,
      }}
    />
  );
}

function formatNumber(value: number | undefined | null, digits = 0) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value ?? 0);
}

function formatTime(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function shortHash(value?: string | null, length = 16) {
  if (!value) return '-';
  return `${value.slice(0, length)}...${value.slice(-6)}`;
}

function FieldRow({ label, value, mono = false }: { label: string; value: string | number | boolean | null | undefined; mono?: boolean }) {
  const theme = useTheme();
  const normalized = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : value ?? '-';

  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.65, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          textAlign: 'right',
          fontWeight: 780,
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : undefined,
          wordBreak: 'break-all',
        }}
      >
        {normalized}
      </Typography>
    </Stack>
  );
}

function DetailSection({ title, icon: Icon, children }: { title: string; icon: SvgIconComponent; children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.72),
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
            {title}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

function makeLineOption(theme: Theme, labels: string[], series: Array<{ name: string; data: number[]; color: string }>, unit: string): EChartsOption {
  return {
    grid: { left: 38, right: 14, top: 20, bottom: 28 },
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${value} ${unit}` },
    legend: { top: 0, right: 0, textStyle: { color: theme.palette.text.secondary } },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLabel: { color: theme.palette.text.secondary, fontSize: 10 },
      axisLine: { lineStyle: { color: theme.palette.divider } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme.palette.text.secondary, fontSize: 10 },
      splitLine: { lineStyle: { color: alpha(theme.palette.text.secondary, 0.14) } },
    },
    series: series.map((item) => ({
      name: item.name,
      type: 'line',
      data: item.data,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2.5, color: item.color },
      areaStyle: series.length === 1 ? { color: alpha(item.color, theme.palette.mode === 'dark' ? 0.16 : 0.1) } : undefined,
    })),
  };
}

function getConsistencyChecks(packet: TelemetryPacket | null): Array<{ label: string; status: CheckStatus; detail: string }> {
  if (!packet) {
    return [
      { label: 'GPS-Baro irtifa uyumu', status: 'WARNING', detail: 'Paket bekleniyor' },
      { label: 'Pitot-GPS hız uyumu', status: 'WARNING', detail: 'Paket bekleniyor' },
      { label: 'Heading-Yaw uyumu', status: 'WARNING', detail: 'Paket bekleniyor' },
      { label: 'Vertical speed / altitude uyumu', status: 'WARNING', detail: 'Paket bekleniyor' },
      { label: 'Uçuş fazı / iniş takımı uyumu', status: 'WARNING', detail: 'Paket bekleniyor' },
      { label: 'Batarya / motor durumu uyumu', status: 'WARNING', detail: 'Paket bekleniyor' },
    ];
  }

  const altitudeDelta = Math.abs(packet.gps.gpsAltitude - packet.barometer.barometricAltitude);
  const speedDelta = Math.abs(packet.pitot.indicatedAirspeed - packet.gps.groundSpeed);
  const headingDelta = Math.abs(packet.gps.heading - packet.imu.yaw);
  const gearExpectedDown = ['PREFLIGHT', 'TAKEOFF', 'LANDING', 'POSTFLIGHT'].includes(packet.flightPhase);
  const gearOk = gearExpectedDown ? packet.flightControl.landingGearStatus === 'DOWN' : packet.flightControl.landingGearStatus === 'UP';
  const batteryMotorOk = packet.ecu.batteryLevel > 18 && packet.ecu.motorTemperature < 95;

  return [
    {
      label: 'GPS-Baro irtifa uyumu',
      status: altitudeDelta < 60 ? 'OK' : altitudeDelta < 160 ? 'WARNING' : 'CRITICAL',
      detail: `${formatNumber(altitudeDelta, 1)} ft fark`,
    },
    {
      label: 'Pitot-GPS hız uyumu',
      status: speedDelta < 18 ? 'OK' : speedDelta < 45 ? 'WARNING' : 'CRITICAL',
      detail: `${formatNumber(speedDelta, 1)} kt fark`,
    },
    {
      label: 'Heading-Yaw uyumu',
      status: headingDelta < 8 ? 'OK' : headingDelta < 18 ? 'WARNING' : 'CRITICAL',
      detail: `${formatNumber(headingDelta, 1)} derece fark`,
    },
    {
      label: 'Vertical speed / altitude uyumu',
      status: Math.abs(packet.barometer.verticalSpeed) < 2200 ? 'OK' : 'CRITICAL',
      detail: `${formatNumber(packet.barometer.verticalSpeed)} ft/dk`,
    },
    {
      label: 'Uçuş fazı / iniş takımı uyumu',
      status: gearOk ? 'OK' : 'WARNING',
      detail: `${packet.flightPhase} / ${packet.flightControl.landingGearStatus}`,
    },
    {
      label: 'Batarya / motor durumu uyumu',
      status: batteryMotorOk ? 'OK' : packet.ecu.motorTemperature > 105 ? 'CRITICAL' : 'WARNING',
      detail: `${formatNumber(packet.ecu.batteryLevel, 1)}% / ${formatNumber(packet.ecu.motorTemperature, 1)} C`,
    },
  ];
}

function jsonDownload(logs: SystemLog[]) {
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `synapse-loglar-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function TelemetryPage() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<LogSeverity | 'ALL'>('ALL');
  const [source, setSource] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedPacket, setSelectedPacket] = useState<TelemetryPacket | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const { latestPacket, connectionState, dbPackets, bufferPackets, blockchainRecords, logs, verifyLatestPacket, tamperLatestPacket } = useFlightSimulation();

  const packetHistory = useMemo(() => {
    const bySequence = new Map<number, TelemetryPacket>();
    [...dbPackets, ...bufferPackets, ...(latestPacket ? [latestPacket] : [])].forEach((packet) => bySequence.set(packet.sequenceNo, packet));
    return Array.from(bySequence.values())
      .sort((first, second) => second.sequenceNo - first.sequenceNo)
      .slice(0, 50);
  }, [bufferPackets, dbPackets, latestPacket]);

  const latest = latestPacket ?? packetHistory[0] ?? null;
  const logSources = useMemo(() => ['ALL', ...Array.from(new Set(logs.map((log) => log.source))).sort()], [logs]);
  const visibleLogs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        log.message.toLocaleLowerCase('tr-TR').includes(query) ||
        log.source.toLocaleLowerCase('tr-TR').includes(query) ||
        log.severity.toLocaleLowerCase('tr-TR').includes(query) ||
        String(log.relatedSequenceNo ?? '').includes(query);
      const matchesSeverity = severity === 'ALL' || log.severity === severity;
      const matchesSource = source === 'ALL' || log.source === source;
      return matchesSearch && matchesSeverity && matchesSource;
    });
  }, [logs, search, severity, source]);

  const labels = packetHistory.length > 1 ? [...packetHistory].reverse().map((packet) => `#${packet.sequenceNo}`) : ['#0', '#1', '#2', '#3', '#4', '#5'];
  const chronologicalPackets = packetHistory.length > 1 ? [...packetHistory].reverse() : [];
  const motorTempValues = chronologicalPackets.length > 1 ? chronologicalPackets.map((packet) => packet.ecu.motorTemperature) : [32, 34, 37, 39, 41, 42];
  const altitudeValues = chronologicalPackets.length > 1 ? chronologicalPackets.map((packet) => packet.barometer.barometricAltitude) : [0, 45, 120, 260, 390, 540];
  const airspeedValues = chronologicalPackets.length > 1 ? chronologicalPackets.map((packet) => packet.pitot.indicatedAirspeed) : [0, 18, 46, 72, 88, 104];
  const motorOption = makeLineOption(theme, labels, [{ name: 'Motor Sıcaklığı', data: motorTempValues, color: theme.palette.warning.main }], 'C');
  const flightOption = makeLineOption(theme, labels, [
    { name: 'İrtifa', data: altitudeValues, color: theme.palette.primary.main },
    { name: 'Hız', data: airspeedValues, color: theme.palette.secondary.main },
  ], 'değer');
  const checks = getConsistencyChecks(latest);

  function clearFilters() {
    setSearch('');
    setSeverity('ALL');
    setSource('ALL');
  }

  function copyPacketJson(packet: TelemetryPacket) {
    void navigator.clipboard?.writeText(JSON.stringify(packet, null, 2));
  }

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.74 : 0.98) }}>
        <CardContent sx={{ p: { xs: 2.3, md: 3 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.4} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
            <Box>
              <Typography variant="h4" component="h2">
                Telemetri
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8, maxWidth: 840 }}>
                Sensör verileri, paket kayıtları, sistem logları ve bütünlük doğrulama çıktıları
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
              <Chip size="small" label={`Sıra: #${latest?.sequenceNo ?? 0}`} color="primary" variant="outlined" />
              <StatusChip label="Bağlantı" status={connectionState.status} />
              <Chip size="small" label={`Buffer: ${bufferPackets.length}`} color={bufferPackets.length > 0 ? 'warning' : 'default'} variant="outlined" />
              <StatusChip label="Doğrulama" status={latest?.integrityState.verificationStatus ?? 'PENDING'} />
              <Chip size="small" label={`Blok: ${latest?.integrityState.blockNo ?? blockchainRecords[blockchainRecords.length - 1]?.blockNo ?? '-'}`} variant="outlined" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
            <CardContent sx={{ p: 2.3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.4} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" sx={{ mb: 1.8 }}>
                <Stack direction="row" spacing={1.1} alignItems="center">
                  <StorageIcon color="primary" />
                  <Box>
                    <Typography variant="h6">Canlı Sistem Logları</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Global simülasyon log akışı
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <FormControlLabel
                    control={<Checkbox checked={autoScroll} onChange={(event) => setAutoScroll(event.target.checked)} size="small" />}
                    label={<Typography variant="caption">Auto-scroll</Typography>}
                  />
                  <Button size="small" startIcon={<FilterAltOffIcon />} onClick={clearFilters}>
                    Filtreleri Temizle
                  </Button>
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => jsonDownload(visibleLogs)}>
                    JSON olarak dışa aktar
                  </Button>
                </Stack>
              </Stack>

              <Grid container spacing={1.2} sx={{ mb: 1.6 }}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Log ara"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Seviye</InputLabel>
                    <Select label="Seviye" value={severity} onChange={(event) => setSeverity(event.target.value as LogSeverity | 'ALL')}>
                      {allSeverities.map((item) => (
                        <MenuItem key={item} value={item}>
                          {item === 'ALL' ? 'Tümü' : item}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Kaynak</InputLabel>
                    <Select label="Kaynak" value={source} onChange={(event) => setSource(event.target.value)}>
                      {logSources.map((item) => (
                        <MenuItem key={item} value={item}>
                          {item === 'ALL' ? 'Tümü' : item}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TableContainer
                ref={logContainerRef}
                sx={{
                  maxHeight: 438,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                  overflow: 'auto',
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Zaman</TableCell>
                      <TableCell>Seviye</TableCell>
                      <TableCell>Kaynak</TableCell>
                      <TableCell>Mesaj</TableCell>
                      <TableCell align="right">Paket No</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleLogs.map((log) => {
                      const color = severityColors[log.severity];
                      return (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{log.timestamp}</TableCell>
                          <TableCell>
                            <Chip size="small" label={log.severity} sx={{ color, bgcolor: alpha(color, 0.11), border: `1px solid ${alpha(color, 0.28)}`, fontWeight: 850 }} />
                          </TableCell>
                          <TableCell sx={{ color, fontWeight: 850 }}>{log.source}</TableCell>
                          <TableCell>{log.message}</TableCell>
                          <TableCell align="right">{log.relatedSequenceNo ?? '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {autoScroll ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Auto-scroll açık: yeni loglar listenin üstünde görünür.
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
                <CardContent sx={{ p: 2.3 }}>
                  <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.5 }}>
                    <TuneIcon color="primary" />
                    <Typography variant="h6">Sensör Tutarlılık Kontrolleri</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {checks.map((check) => (
                      <Stack key={check.label} direction="row" justifyContent="space-between" alignItems="center" spacing={1.2} sx={{ p: 1, borderRadius: '6px', border: `1px solid ${theme.palette.divider}` }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {check.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {check.detail}
                          </Typography>
                        </Box>
                        <StatusChip status={check.status} />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={12}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
                <CardContent sx={{ p: 1.8 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Motor Sıcaklığı
                  </Typography>
                  <Box sx={{ height: 185 }}>
                    <ReactECharts option={motorOption} style={{ width: '100%', height: '100%' }} notMerge lazyUpdate />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={12}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
                <CardContent sx={{ p: 1.8 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    İrtifa ve Hız
                  </Typography>
                  <Box sx={{ height: 185 }}>
                    <ReactECharts option={flightOption} style={{ width: '100%', height: '100%' }} notMerge lazyUpdate />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
            <CardContent sx={{ p: 2.3 }}>
              <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.6 }}>
                <SensorsIcon color="primary" />
                <Typography variant="h6">Canlı Telemetri Detayı</Typography>
              </Stack>
              <Stack spacing={1}>
                <DetailSection title="GPS" icon={GpsFixedIcon}>
                  <FieldRow label="Latitude" value={latest?.gps.latitude} />
                  <FieldRow label="Longitude" value={latest?.gps.longitude} />
                  <FieldRow label="GPS Altitude" value={`${formatNumber(latest?.gps.gpsAltitude, 1)} ft`} />
                  <FieldRow label="Ground Speed" value={`${formatNumber(latest?.gps.groundSpeed, 1)} kt`} />
                  <FieldRow label="Heading" value={`${formatNumber(latest?.gps.heading, 1)} derece`} />
                  <FieldRow label="Satellite Count" value={latest?.gps.satelliteCount} />
                  <FieldRow label="GPS Status" value={latest?.gps.gpsStatus} />
                </DetailSection>
                <DetailSection title="IMU" icon={MemoryIcon}>
                  <FieldRow label="Roll" value={latest?.imu.roll} />
                  <FieldRow label="Pitch" value={latest?.imu.pitch} />
                  <FieldRow label="Yaw" value={latest?.imu.yaw} />
                  <FieldRow label="Acceleration X/Y/Z" value={`${latest?.imu.accelerationX ?? '-'} / ${latest?.imu.accelerationY ?? '-'} / ${latest?.imu.accelerationZ ?? '-'}`} />
                  <FieldRow label="Gyro X/Y/Z" value={`${latest?.imu.gyroX ?? '-'} / ${latest?.imu.gyroY ?? '-'} / ${latest?.imu.gyroZ ?? '-'}`} />
                </DetailSection>
                <DetailSection title="Barometre" icon={FlightIcon}>
                  <FieldRow label="Barometric Altitude" value={`${formatNumber(latest?.barometer.barometricAltitude, 1)} ft`} />
                  <FieldRow label="Vertical Speed" value={`${formatNumber(latest?.barometer.verticalSpeed, 1)} ft/dk`} />
                  <FieldRow label="Pressure" value={`${formatNumber(latest?.barometer.pressure, 2)} hPa`} />
                </DetailSection>
                <DetailSection title="Pitot" icon={SpeedIcon}>
                  <FieldRow label="Indicated Airspeed" value={`${formatNumber(latest?.pitot.indicatedAirspeed, 1)} kt`} />
                  <FieldRow label="True Airspeed" value={`${formatNumber(latest?.pitot.trueAirspeed, 1)} kt`} />
                  <FieldRow label="Pitot Status" value={latest?.pitot.pitotStatus} />
                </DetailSection>
                <DetailSection title="ECU" icon={ThermostatIcon}>
                  <FieldRow label="Motor RPM" value={latest?.ecu.motorRpm} />
                  <FieldRow label="Motor Temperature" value={`${formatNumber(latest?.ecu.motorTemperature, 1)} C`} />
                  <FieldRow label="Battery Level" value={`${formatNumber(latest?.ecu.batteryLevel, 1)}%`} />
                  <FieldRow label="Battery Voltage" value={`${formatNumber(latest?.ecu.batteryVoltage, 2)} V`} />
                  <FieldRow label="Motor Current" value={`${formatNumber(latest?.ecu.motorCurrent, 1)} A`} />
                  <FieldRow label="Throttle" value={`${formatNumber(latest?.ecu.throttle, 1)}%`} />
                  <FieldRow label="ECU Status" value={latest?.ecu.ecuStatus} />
                </DetailSection>
                <DetailSection title="Uçuş Kontrol" icon={FlightIcon}>
                  <FieldRow label="Aileron Position" value={latest?.flightControl.aileronPosition} />
                  <FieldRow label="Elevator Position" value={latest?.flightControl.elevatorPosition} />
                  <FieldRow label="Rudder Position" value={latest?.flightControl.rudderPosition} />
                  <FieldRow label="Flap Position" value={latest?.flightControl.flapPosition} />
                  <FieldRow label="Landing Gear Status" value={latest?.flightControl.landingGearStatus} />
                  <FieldRow label="Brake Status" value={latest?.flightControl.brakeStatus} />
                </DetailSection>
                <DetailSection title="İkaz Sistemleri" icon={WarningAmberIcon}>
                  <FieldRow label="Door Status" value={latest?.warningSystem.doorStatus} />
                  <FieldRow label="Warning Light" value={latest?.warningSystem.warningLight} />
                  <FieldRow label="Master Caution" value={latest?.warningSystem.masterCaution} />
                  <FieldRow label="Alarm Code" value={latest?.warningSystem.alarmCode} />
                </DetailSection>
                <DetailSection title="Bağlantı" icon={StorageIcon}>
                  <FieldRow label="Status" value={latest?.connectionState.status ?? connectionState.status} />
                  <FieldRow label="Signal Quality" value={`${formatNumber(latest?.connectionState.signalQuality ?? connectionState.signalQuality)}%`} />
                  <FieldRow label="Buffered Packet Count" value={latest?.connectionState.bufferedPacketCount ?? bufferPackets.length} />
                  <FieldRow label="Uplink Channel" value={latest?.connectionState.uplinkChannel ?? connectionState.uplinkChannel} />
                </DetailSection>
                <DetailSection title="Bütünlük" icon={FactCheckIcon}>
                  <FieldRow label="Payload Hash" value={latest?.integrityState.payloadHash} mono />
                  <FieldRow label="Previous Packet Hash" value={latest?.integrityState.previousPacketHash} mono />
                  <FieldRow label="Signature Status" value={latest?.integrityState.signatureStatus} />
                  <FieldRow label="Verification Status" value={latest?.integrityState.verificationStatus} />
                  <FieldRow label="Blockchain Status" value={latest?.integrityState.blockchainStatus} />
                  <FieldRow label="Tx ID" value={latest?.integrityState.txId} mono />
                  <FieldRow label="Block No" value={latest?.integrityState.blockNo} />
                </DetailSection>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
            <CardContent sx={{ p: 2.3 }}>
              <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.6 }}>
                <DataObjectIcon color="primary" />
                <Typography variant="h6">Son Telemetri Paketleri</Typography>
              </Stack>
              <TableContainer sx={{ maxHeight: 720, border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Seq No</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Phase</TableCell>
                      <TableCell>Altitude</TableCell>
                      <TableCell>Airspeed</TableCell>
                      <TableCell>Battery</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Connection</TableCell>
                      <TableCell>Verification</TableCell>
                      <TableCell>Blockchain</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {packetHistory.map((packet) => (
                      <TableRow key={packet.sequenceNo} hover onClick={() => setSelectedPacket(packet)} sx={{ cursor: 'pointer' }}>
                        <TableCell>#{packet.sequenceNo}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTime(packet.timestamp)}</TableCell>
                        <TableCell>{packet.flightPhase}</TableCell>
                        <TableCell>{formatNumber(packet.barometer.barometricAltitude)} ft</TableCell>
                        <TableCell>{formatNumber(packet.pitot.indicatedAirspeed)} kt</TableCell>
                        <TableCell>{formatNumber(packet.ecu.batteryLevel, 1)}%</TableCell>
                        <TableCell>{packet.events[0]?.eventType ?? 'NORMAL'}</TableCell>
                        <TableCell>
                          <StatusChip status={packet.connectionState.status} />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={packet.integrityState.verificationStatus} />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={packet.integrityState.blockchainStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Drawer anchor="right" open={Boolean(selectedPacket)} onClose={() => setSelectedPacket(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, bgcolor: 'background.paper' } }}>
        {selectedPacket ? (
          <Stack sx={{ height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box>
                <Typography variant="h6">Paket Detayı #{selectedPacket.sequenceNo}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Ham JSON ve bütünlük bilgisi
                </Typography>
              </Box>
              <Tooltip title="Kapat">
                <IconButton onClick={() => setSelectedPacket(null)}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                <StatusChip label="Doğrulama" status={selectedPacket.integrityState.verificationStatus} />
                <StatusChip label="Blockchain" status={selectedPacket.integrityState.blockchainStatus} />
                <Chip size="small" label={`Blok: ${selectedPacket.integrityState.blockNo ?? '-'}`} variant="outlined" />
              </Stack>
              <FieldRow label="Payload Hash" value={shortHash(selectedPacket.integrityState.payloadHash)} mono />
              <FieldRow label="Previous Packet Hash" value={shortHash(selectedPacket.integrityState.previousPacketHash)} mono />
              <FieldRow label="Tx ID" value={shortHash(selectedPacket.integrityState.txId)} mono />
              <FieldRow label="Event Info" value={selectedPacket.events.map((event) => `${event.eventType}/${event.severity}`).join(', ') || 'NORMAL'} />
              <FieldRow label="Connection Info" value={`${selectedPacket.connectionState.status} / ${selectedPacket.connectionState.uplinkChannel}`} />

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ my: 2 }}>
                <Button startIcon={<FactCheckIcon />} variant="outlined" onClick={verifyLatestPacket}>
                  Paketi Doğrula
                </Button>
                <Button startIcon={<WarningAmberIcon />} variant="outlined" color="warning" onClick={tamperLatestPacket}>
                  Bu Paketi Manipüle Et
                </Button>
                <Button startIcon={<ContentCopyIcon />} variant="outlined" onClick={() => copyPacketJson(selectedPacket)}>
                  Ham JSON'u Kopyala
                </Button>
              </Stack>

              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.24 : 0.04),
                  overflow: 'auto',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {JSON.stringify(selectedPacket, null, 2)}
              </Box>
            </Box>
          </Stack>
        ) : null}
      </Drawer>
    </Stack>
  );
}
