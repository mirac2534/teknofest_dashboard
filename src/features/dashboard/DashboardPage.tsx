import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GroupsIcon from '@mui/icons-material/Groups';
import LayersIcon from '@mui/icons-material/Layers';
import LinkIcon from '@mui/icons-material/Link';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MemoryIcon from '@mui/icons-material/Memory';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import SyncIcon from '@mui/icons-material/Sync';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TimelineIcon from '@mui/icons-material/Timeline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerticalAlignCenterIcon from '@mui/icons-material/VerticalAlignCenter';
import type { SvgIconComponent } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import type { EChartsOption } from 'echarts';
import { useFlightSimulation } from '../simulation/FlightSimulationContext';
import type { LogSeverity } from '../../types/logs';
import type { BlockchainStatus, ConnectionStatus, TelemetryPacket, VerificationStatus } from '../../types/telemetry';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

const severityColors: Record<LogSeverity, string> = {
  INFO: '#38bdf8',
  WARNING: '#f59e0b',
  CRITICAL: '#ef4444',
  SECURITY: '#a78bfa',
  BLOCKCHAIN: '#34d399',
  CONNECTION: '#22c55e',
  TELEMETRY: '#06b6d4',
};

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatTime(value?: string) {
  if (!value) return 'Henüz yok';

  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function getRelativeTime(value?: string) {
  if (!value) return 'Beklemede';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 5) return 'Az önce';
  if (seconds < 60) return `${seconds} sn önce`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} dk önce`;
}

function getToneColor(theme: Theme, tone: Tone) {
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

function statusTone(status?: ConnectionStatus | VerificationStatus | BlockchainStatus | string): Tone {
  if (status === 'VERIFIED' || status === 'ONLINE' || status === 'COMMITTED') return 'success';
  if (status === 'TAMPER_DETECTED' || status === 'FAILED') return 'error';
  if (status === 'BUFFERING' || status === 'SYNCING' || status === 'SATCOM_FALLBACK' || status === 'PENDING') return 'warning';
  return 'neutral';
}

function displayStatus(status?: string | null) {
  if (!status) return 'BEKLEMEDE';
  return status === 'TAMPER_DETECTED' ? 'TAMPER DETECTED' : status;
}

function StatusChip({ label, status }: { label?: string; status?: string | null }) {
  const theme = useTheme();
  const tone = statusTone(status ?? undefined);
  const color = getToneColor(theme, tone);

  return (
    <Chip
      size="small"
      label={label ? `${label}: ${displayStatus(status)}` : displayStatus(status)}
      sx={{
        height: 26,
        fontWeight: 850,
        color,
        bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.14 : 0.1),
        border: `1px solid ${alpha(color, 0.34)}`,
      }}
    />
  );
}

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
}: {
  title: string;
  value: string;
  detail: string;
  icon: SvgIconComponent;
  tone?: Tone;
}) {
  const theme = useTheme();
  const color = getToneColor(theme, tone);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${alpha(color, 0.24)}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.78 : 0.96),
        transition: 'transform 180ms ease, border-color 180ms ease, background-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: alpha(color, 0.46),
        },
      }}
    >
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.6, lineHeight: 1.05 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '8px',
              display: 'grid',
              placeItems: 'center',
              color,
              bgcolor: alpha(color, 0.13),
              border: `1px solid ${alpha(color, 0.28)}`,
              flex: '0 0 auto',
            }}
          >
            <Icon fontSize="small" />
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.6 }}>
          {detail}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, option, minHeight = 260 }: { title: string; option: EChartsOption; minHeight?: number }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.76 : 1),
      }}
    >
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <QueryStatsIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontSize: 16 }}>
            {title}
          </Typography>
        </Stack>
        <Box sx={{ height: minHeight, minHeight }}>
          <ReactECharts option={option} style={{ width: '100%', height: '100%' }} notMerge lazyUpdate />
        </Box>
      </CardContent>
    </Card>
  );
}

function MiniMetricCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = 'info',
}: {
  label: string;
  value: string;
  unit?: string;
  icon: SvgIconComponent;
  tone?: Tone;
}) {
  const theme = useTheme();
  const color = getToneColor(theme, tone);

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.72) }}>
      <CardContent sx={{ p: 1.7, '&:last-child': { pb: 1.7 } }}>
        <Stack direction="row" spacing={1.3} alignItems="center">
          <Box sx={{ color, display: 'grid', placeItems: 'center' }}>
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              {label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 850, lineHeight: 1.25 }} noWrap>
              {value}
              {unit ? (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.4 }}>
                  {unit}
                </Typography>
              ) : null}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function makeLineOption(theme: Theme, labels: string[], values: number[], color: string, unit: string): EChartsOption {
  return {
    grid: { left: 38, right: 16, top: 12, bottom: 28 },
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${value} ${unit}` },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLabel: { color: theme.palette.text.secondary },
      axisLine: { lineStyle: { color: theme.palette.divider } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: { lineStyle: { color: alpha(theme.palette.text.secondary, 0.14) } },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color },
        areaStyle: { color: alpha(color, theme.palette.mode === 'dark' ? 0.18 : 0.12) },
      },
    ],
  };
}

function makeDonutOption(theme: Theme, data: Array<{ name: string; value: number; itemStyle?: { color: string } }>): EChartsOption {
  return {
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      textStyle: { color: theme.palette.text.secondary },
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: {
          color: theme.palette.text.primary,
          formatter: '{b}\n{d}%',
          fontWeight: 700,
        },
        labelLine: { length: 8, length2: 8 },
        data,
      },
    ],
  };
}

export function DashboardPage() {
  const theme = useTheme();
  const {
    flightId,
    vehicleId,
    latestPacket,
    connectionState,
    dbPackets,
    blockchainRecords,
    bufferPackets,
    criticalProofPackets,
    logs,
  } = useFlightSimulation();

  const packetHistory = useMemo(() => {
    const bySequence = new Map<number, TelemetryPacket>();
    [...dbPackets, ...bufferPackets, ...(latestPacket ? [latestPacket] : [])].forEach((packet) => {
      bySequence.set(packet.sequenceNo, packet);
    });
    return Array.from(bySequence.values())
      .sort((first, second) => first.sequenceNo - second.sequenceNo)
      .slice(-36);
  }, [bufferPackets, dbPackets, latestPacket]);

  const latest = latestPacket ?? packetHistory[packetHistory.length - 1] ?? null;
  const verifiedCount = dbPackets.filter((packet) => packet.integrityState.verificationStatus === 'VERIFIED').length;
  const pendingCount = bufferPackets.length + dbPackets.filter((packet) => packet.integrityState.verificationStatus === 'PENDING').length;
  const tamperCount = dbPackets.filter((packet) => packet.integrityState.verificationStatus === 'TAMPER_DETECTED').length + (latest?.integrityState.verificationStatus === 'TAMPER_DETECTED' ? 1 : 0);
  const totalChecked = Math.max(verifiedCount + pendingCount + tamperCount, 1);
  const verifiedRate = (verifiedCount / totalChecked) * 100;
  const criticalEventCount =
    criticalProofPackets.length +
    dbPackets.reduce((total, packet) => total + packet.events.filter((event) => event.isCritical).length, 0) +
    bufferPackets.reduce((total, packet) => total + packet.events.filter((event) => event.isCritical).length, 0);
  const lastRecord = blockchainRecords[blockchainRecords.length - 1];
  const importantLogs = logs
    .filter((log) => log.severity !== 'INFO' || ['CHAIN', 'SYNC', 'VERIFY', 'PACKET'].includes(log.source))
    .slice(0, 8);

  const chartLabels = packetHistory.map((packet) => `#${packet.sequenceNo}`);
  const altitudeValues = packetHistory.map((packet) => packet.barometer.barometricAltitude);
  const speedValues = packetHistory.map((packet) => packet.pitot.indicatedAirspeed || packet.gps.groundSpeed);
  const batteryValues = packetHistory.map((packet) => packet.ecu.batteryLevel);
  const fallbackLabels = ['#0', '#1', '#2', '#3', '#4', '#5'];
  const hasHistory = packetHistory.length > 1;
  const lineLabels = hasHistory ? chartLabels : fallbackLabels;

  const altitudeOption = makeLineOption(
    theme,
    lineLabels,
    hasHistory ? altitudeValues : [0, 20, 68, 140, 260, 410],
    theme.palette.primary.main,
    'ft',
  );
  const speedOption = makeLineOption(theme, lineLabels, hasHistory ? speedValues : [0, 12, 34, 58, 76, 91], '#22c55e', 'kt');
  const batteryOption = makeLineOption(theme, lineLabels, hasHistory ? batteryValues : [100, 99.8, 99.5, 99.3, 99.1, 98.8], '#f59e0b', '%');
  const verificationOption = makeDonutOption(theme, [
    { name: 'Doğrulandı', value: Math.max(verifiedCount, hasHistory ? 0 : 12), itemStyle: { color: '#22c55e' } },
    { name: 'Beklemede', value: Math.max(pendingCount, hasHistory ? 0 : 1), itemStyle: { color: '#f59e0b' } },
    { name: 'Şüpheli', value: tamperCount, itemStyle: { color: '#ef4444' } },
  ]);
  const bufferOption = makeDonutOption(theme, [
    { name: 'Dolu', value: bufferPackets.length, itemStyle: { color: '#f59e0b' } },
    { name: 'Boş', value: Math.max(24 - bufferPackets.length, 1), itemStyle: { color: alpha(theme.palette.text.secondary, 0.22) } },
  ]);

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.72 : 0.98),
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2.3, md: 3 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" component="h2">
                Anasayfa
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8, maxWidth: 820 }}>
                Uçuş verisi, bağlantı durumu, blokzincir kayıtları ve bütünlük doğrulama özeti
              </Typography>
              {!latest ? (
                <Typography variant="body2" color="warning.main" sx={{ mt: 1.4, fontWeight: 750 }}>
                  Simülasyonu başlatmak için Operasyon Akışı ekranına geçin
                </Typography>
              ) : null}
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
              <Chip icon={<AirplanemodeActiveIcon />} label={`Uçuş: ${flightId}`} color="primary" variant="outlined" />
              <Chip label={`Araç: ${vehicleId}`} variant="outlined" />
              <StatusChip label="Faz" status={latest?.flightPhase ?? 'PREFLIGHT'} />
              <StatusChip label="Bağlantı" status={connectionState.status} />
              <StatusChip label="Bütünlük" status={latest?.integrityState.verificationStatus ?? 'PENDING'} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Toplam Hava Aracı" value="12" detail="Filoda kayıtlı platform" icon={AirplanemodeActiveIcon} tone="info" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Kayıtlı Şirket" value="4" detail="Yetkili operasyon kurumu" icon={ApartmentIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Aktif Uçuş" value="1" detail={latest?.flightPhase ?? 'PREFLIGHT'} icon={TimelineIcon} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Blokzincire Kaydedilen Paket" value={formatNumber(blockchainRecords.length)} detail={`Son blok: ${lastRecord?.blockNo ?? '-'}`} icon={LayersIcon} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Buffer'da Bekleyen Paket" value={formatNumber(bufferPackets.length)} detail={connectionState.uplinkChannel} icon={CloudQueueIcon} tone={bufferPackets.length > 0 ? 'warning' : 'neutral'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Kritik Olay Sayısı" value={formatNumber(criticalEventCount)} detail="Kanıt paketi ve kritik alarmlar" icon={LocalFireDepartmentIcon} tone={criticalEventCount > 0 ? 'error' : 'success'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Doğrulanmış Paket Oranı" value={`${formatNumber(verifiedRate, 1)}%`} detail={`${verifiedCount}/${totalChecked} paket doğrulandı`} icon={FactCheckIcon} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Son Senkronizasyon" value={getRelativeTime(lastRecord?.committedAt)} detail={formatTime(lastRecord?.committedAt)} icon={SyncIcon} tone="info" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <SecurityIcon color="primary" />
                  <Box>
                    <Typography variant="h6">Canlı Uçuş Durumu</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Paket, zincir ve bağlantı özeti
                    </Typography>
                  </Box>
                </Stack>
                <StatusChip status={connectionState.status} />
              </Stack>

              <Grid container spacing={1.3}>
                <Grid item xs={12} sm={6}>
                  <StatusChip label="Blockchain" status={latest?.integrityState.blockchainStatus ?? 'PENDING'} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatusChip label="Integrity" status={latest?.integrityState.verificationStatus ?? 'PENDING'} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <MiniMetricCard label="Sıra No" value={`#${latest?.sequenceNo ?? 0}`} icon={DataObjectIcon} tone="primary" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <MiniMetricCard label="Blok No" value={latest?.integrityState.blockNo ? String(latest.integrityState.blockNo) : '-'} icon={LayersIcon} tone="success" />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                Son TX ID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.6,
                  p: 1.2,
                  borderRadius: '6px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                  wordBreak: 'break-all',
                }}
              >
                {latest?.integrityState.txId ?? lastRecord?.txId ?? 'Henüz zincir işlemi yok'}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.7 }}>
                  <Typography variant="caption" color="text.secondary">
                    Sinyal kalitesi
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 850 }}>
                    {formatNumber(connectionState.signalQuality)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={connectionState.signalQuality}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.text.secondary, 0.14),
                    '& .MuiLinearProgress-bar': { borderRadius: 999 },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="İrtifa" value={formatNumber(latest?.barometer.barometricAltitude ?? 0)} unit="ft" icon={UploadFileIcon} tone="info" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="Hava Hızı" value={formatNumber(latest?.pitot.indicatedAirspeed ?? 0)} unit="kt" icon={SpeedIcon} tone="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="Dikey Hız" value={formatNumber(latest?.barometer.verticalSpeed ?? 0)} unit="ft/dk" icon={VerticalAlignCenterIcon} tone="warning" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="Motor RPM" value={formatNumber(latest?.ecu.motorRpm ?? 0)} icon={MemoryIcon} tone="primary" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="Motor Sıcaklığı" value={formatNumber(latest?.ecu.motorTemperature ?? 32, 1)} unit="C" icon={ThermostatIcon} tone={(latest?.ecu.motorTemperature ?? 0) > 85 ? 'error' : 'warning'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="Batarya" value={formatNumber(latest?.ecu.batteryLevel ?? 100, 1)} unit="%" icon={BatteryChargingFullIcon} tone="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="GPS Durumu" value={latest?.gps.gpsStatus ?? 'LOCKED'} icon={GpsFixedIcon} tone={latest?.gps.gpsStatus === 'SPOOFING_SUSPECTED' ? 'error' : 'success'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MiniMetricCard label="Uydu Sayısı" value={formatNumber(latest?.gps.satelliteCount ?? 12)} icon={GroupsIcon} tone="info" />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <ChartCard title="İrtifa Profili" option={altitudeOption} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ChartCard title="Hız Profili" option={speedOption} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ChartCard title="Batarya Seviyesi" option={batteryOption} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Doğrulama Durumu" option={verificationOption} minHeight={300} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Buffer Kullanımı" option={bufferOption} minHeight={300} />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
        <CardContent sx={{ p: 2.4 }}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
            <LinkIcon color="primary" />
            <Typography variant="h6">Son Sistem Olayları</Typography>
          </Stack>
          <Stack spacing={1}>
            {importantLogs.map((log) => {
              const color = severityColors[log.severity];
              return (
                <Box
                  key={log.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '78px 112px 120px 1fr' },
                    gap: 1,
                    alignItems: 'center',
                    p: 1.1,
                    borderRadius: '6px',
                    border: `1px solid ${alpha(color, 0.22)}`,
                    bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.06 : 0.04),
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {log.timestamp}
                  </Typography>
                  <Chip size="small" label={log.severity} sx={{ width: 'fit-content', color, bgcolor: alpha(color, 0.12), border: `1px solid ${alpha(color, 0.28)}`, fontWeight: 850 }} />
                  <Typography variant="caption" sx={{ color, fontWeight: 850 }}>
                    {log.source}
                  </Typography>
                  <Typography variant="body2">{log.message}</Typography>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
