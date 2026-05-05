import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  keyframes,
  useTheme,
} from '@mui/material';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DatasetIcon from '@mui/icons-material/Dataset';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import HubIcon from '@mui/icons-material/Hub';
import MemoryIcon from '@mui/icons-material/Memory';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import SensorsIcon from '@mui/icons-material/Sensors';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import SyncIcon from '@mui/icons-material/Sync';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { SvgIconComponent } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import type { EChartsOption } from 'echarts';
import { useFlightSimulation } from '../simulation/FlightSimulationContext';
import type { LogSeverity } from '../../types/logs';
import type { BlockchainStatus, ConnectionStatus, CriticalProofPacket, TelemetryPacket, VerificationStatus } from '../../types/telemetry';

type NodeState = 'waiting' | 'processing' | 'success' | 'warning' | 'error';
type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

const pulse = keyframes`
  0% { transform: translateX(-28%); opacity: 0.15; }
  45% { opacity: 0.9; }
  100% { transform: translateX(128%); opacity: 0.15; }
`;

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

function nodeColor(theme: Theme, state: NodeState) {
  const map: Record<NodeState, string> = {
    waiting: theme.palette.text.secondary,
    processing: theme.palette.primary.main,
    success: theme.palette.secondary.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
  };
  return map[state];
}

function statusTone(status?: ConnectionStatus | VerificationStatus | BlockchainStatus | string | null): Tone {
  if (status === 'ONLINE' || status === 'VERIFIED' || status === 'COMMITTED' || status === 'SIGNED') return 'success';
  if (status === 'TAMPER_DETECTED' || status === 'FAILED' || status === 'INVALID') return 'error';
  if (status === 'BUFFERING' || status === 'SYNCING' || status === 'SATCOM_FALLBACK' || status === 'PENDING' || status === 'OFFLINE') return 'warning';
  return 'neutral';
}

function displayStatus(status?: string | null) {
  if (!status) return 'BEKLEMEDE';
  return status === 'TAMPER_DETECTED' ? 'TAMPER DETECTED' : status;
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

function formatTime(value?: string) {
  if (!value) return 'Henüz yok';
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function shortHash(value?: string | null, length = 14) {
  if (!value) return '-';
  return `${value.slice(0, length)}...${value.slice(-6)}`;
}

function tamperedHash(value?: string | null) {
  if (!value) return '-';
  const changed = `${value.slice(0, 8)}ff${value.slice(10)}`;
  return shortHash(changed);
}

function StatusChip({ label, status }: { label?: string; status?: string | null }) {
  const theme = useTheme();
  const color = toneColor(theme, statusTone(status));

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

function SectionCard({ title, icon: Icon, children }: { title: string; icon: SvgIconComponent; children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.76 : 1) }}>
      <CardContent sx={{ p: 2.3 }}>
        <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.8 }}>
          <Icon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, value, warn = false }: { label: string; value: string | number; warn?: boolean }) {
  const theme = useTheme();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ py: 0.75, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.72)}` }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 800,
          textAlign: 'right',
          fontFamily: String(value).length > 18 ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : undefined,
          color: warn ? theme.palette.error.main : 'text.primary',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function PipelineNode({
  title,
  description,
  value,
  state,
  icon: Icon,
}: {
  title: string;
  description: string;
  value: string;
  state: NodeState;
  icon: SvgIconComponent;
}) {
  const theme = useTheme();
  const color = nodeColor(theme, state);
  const statusText: Record<NodeState, string> = {
    waiting: 'Bekliyor',
    processing: 'İşleniyor',
    success: 'Başarılı',
    warning: 'Uyarı',
    error: 'Hata',
  };

  return (
    <Card
      elevation={0}
      sx={{
        minHeight: 166,
        border: `1px solid ${alpha(color, state === 'waiting' ? 0.22 : 0.46)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.84),
        boxShadow: state === 'processing' ? `0 0 0 1px ${alpha(color, 0.16)}, 0 0 28px ${alpha(color, 0.18)}` : 'none',
        transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
      }}
    >
      <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '8px',
              color,
              bgcolor: alpha(color, 0.13),
              border: `1px solid ${alpha(color, 0.3)}`,
              flex: '0 0 auto',
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Chip size="small" label={statusText[state]} sx={{ color, bgcolor: alpha(color, 0.11), border: `1px solid ${alpha(color, 0.26)}`, fontWeight: 850 }} />
        </Stack>
        <Typography variant="h6" sx={{ mt: 1.3, fontSize: 16 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, minHeight: 42 }}>
          {description}
        </Typography>
        <Typography variant="caption" sx={{ mt: 1.1, display: 'block', color, fontWeight: 850, wordBreak: 'break-all' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function FlowArrow({ active, broken }: { active: boolean; broken?: boolean }) {
  const theme = useTheme();
  const color = broken ? theme.palette.error.main : active ? theme.palette.primary.main : theme.palette.text.secondary;

  return (
    <Box
      sx={{
        position: 'relative',
        height: 18,
        my: { xs: 0.3, md: 7 },
        borderTop: `2px ${broken ? 'dashed' : 'solid'} ${alpha(color, broken || active ? 0.7 : 0.24)}`,
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -4,
          right: 0,
          width: 9,
          height: 9,
          borderTop: `2px solid ${alpha(color, 0.8)}`,
          borderRight: `2px solid ${alpha(color, 0.8)}`,
          transform: 'rotate(45deg)',
        },
        '&::before': active
          ? {
              content: '""',
              position: 'absolute',
              top: -2,
              left: 0,
              width: '38%',
              height: 3,
              borderRadius: 999,
              bgcolor: color,
              animation: `${pulse} 1450ms ease-in-out infinite`,
            }
          : undefined,
      }}
    />
  );
}

function ControlButton({ label, icon: Icon, onClick, tone = 'primary' }: { label: string; icon: SvgIconComponent; onClick: () => void; tone?: Tone }) {
  const theme = useTheme();
  const color = toneColor(theme, tone);

  return (
    <Button
      variant="outlined"
      startIcon={<Icon />}
      onClick={onClick}
      sx={{
        justifyContent: 'flex-start',
        minHeight: 42,
        color,
        borderColor: alpha(color, 0.42),
        bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.06 : 0.035),
        '&:hover': {
          borderColor: alpha(color, 0.74),
          bgcolor: alpha(color, 0.1),
        },
      }}
    >
      {label}
    </Button>
  );
}

function makeLineOption(theme: Theme, labels: string[], values: number[], color: string, unit: string): EChartsOption {
  return {
    grid: { left: 36, right: 12, top: 10, bottom: 24 },
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${value} ${unit}` },
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
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5, color },
        areaStyle: { color: alpha(color, theme.palette.mode === 'dark' ? 0.16 : 0.1) },
      },
    ],
  };
}

function MiniChart({ title, option }: { title: string; option: EChartsOption }) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.72) }}>
      <CardContent sx={{ p: 1.7, '&:last-child': { pb: 1.7 } }}>
        <Typography variant="subtitle2" sx={{ mb: 0.8 }}>
          {title}
        </Typography>
        <Box sx={{ height: 174 }}>
          <ReactECharts option={option} style={{ width: '100%', height: '100%' }} notMerge lazyUpdate />
        </Box>
      </CardContent>
    </Card>
  );
}

function latestProofBlockNo(proof: CriticalProofPacket | null) {
  return proof?.blockNo ?? '-';
}

export function OperationsPage() {
  const theme = useTheme();
  const simulation = useFlightSimulation();
  const {
    running,
    latestPacket,
    connectionState,
    dbPackets,
    blockchainRecords,
    bufferPackets,
    criticalProofPackets,
    logs,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    triggerConnectionLoss,
    restoreConnection,
    triggerAltitudeDrop,
    triggerPitotAnomaly,
    triggerGpsSpoofing,
    triggerMotorOverheat,
    tamperLatestPacket,
    verifyLatestPacket,
    triggerCriticalProofPacket,
  } = simulation;

  const packetHistory = useMemo(() => {
    const bySequence = new Map<number, TelemetryPacket>();
    [...dbPackets, ...bufferPackets, ...(latestPacket ? [latestPacket] : [])].forEach((packet) => bySequence.set(packet.sequenceNo, packet));
    return Array.from(bySequence.values())
      .sort((first, second) => first.sequenceNo - second.sequenceNo)
      .slice(-30);
  }, [bufferPackets, dbPackets, latestPacket]);

  const latest = latestPacket ?? packetHistory[packetHistory.length - 1] ?? null;
  const latestProof = criticalProofPackets[criticalProofPackets.length - 1] ?? null;
  const latestRecord = blockchainRecords[blockchainRecords.length - 1];
  const latestDbPacket = latest ? dbPackets.find((packet) => packet.sequenceNo === latest.sequenceNo) : undefined;
  const latestChainRecord = latest ? blockchainRecords.find((record) => record.sequenceNo === latest.sequenceNo) : undefined;
  const isTampered = latest?.integrityState.verificationStatus === 'TAMPER_DETECTED';
  const dbHash = latestDbPacket?.integrityState.payloadHash ?? latest?.integrityState.payloadHash ?? '';
  const chainHash = latestChainRecord?.payloadHash ?? latest?.integrityState.payloadHash ?? '';
  const recomputedHash = isTampered ? `${(latest?.integrityState.payloadHash ?? '').slice(0, 8)}ff${(latest?.integrityState.payloadHash ?? '').slice(10)}` : latest?.integrityState.payloadHash ?? '';
  const hashesMatch = Boolean(dbHash && chainHash && recomputedHash && dbHash === chainHash && chainHash === recomputedHash && !isTampered);
  const offline = connectionState.status === 'OFFLINE' || connectionState.status === 'BUFFERING';
  const syncing = connectionState.status === 'SYNCING';
  const active = running && Boolean(latest);

  const pipelineNodes = [
    {
      title: 'Sensörler',
      description: 'GPS, barometre, pitot, IMU ve ECU verisi üretilir.',
      value: latest ? `Sıra #${latest.sequenceNo}` : 'Telemetri bekleniyor',
      icon: SensorsIcon,
      state: active ? 'processing' : 'waiting',
    },
    {
      title: 'Paketleme',
      description: 'Uçuş fazı ve sensör değerleri telemetri paketine alınır.',
      value: latest ? latest.flightPhase : 'Paket yok',
      icon: DataObjectIcon,
      state: latest ? 'success' : 'waiting',
    },
    {
      title: 'Hashleme',
      description: 'Paket içeriği SHA-256 hash ile zincire hazırlanır.',
      value: shortHash(latest?.integrityState.payloadHash),
      icon: FingerprintIcon,
      state: latest ? 'success' : 'waiting',
    },
    {
      title: 'Local Buffer',
      description: offline ? 'Bağlantı yok, paketler yerel tamponda tutuluyor.' : syncing ? 'Tampondaki paketler batch sync ile aktarılıyor.' : 'Online modda tampon pasif.',
      value: `${bufferPackets.length} paket`,
      icon: StorageIcon,
      state: offline || syncing ? 'warning' : 'success',
    },
    {
      title: 'Off-chain DB',
      description: 'Tam telemetri paketi yerel simüle veritabanına yazılır.',
      value: `${dbPackets.length} kayıt`,
      icon: DatasetIcon,
      state: offline ? 'waiting' : dbPackets.length > 0 ? 'success' : 'waiting',
    },
    {
      title: 'Blockchain',
      description: 'Paket hash kaydı simüle blokzincir ledgerına commit edilir.',
      value: latestRecord ? `Blok ${latestRecord.blockNo}` : 'Commit bekleniyor',
      icon: HubIcon,
      state: latest?.integrityState.blockchainStatus === 'COMMITTED' ? 'success' : offline ? 'warning' : 'waiting',
    },
    {
      title: 'Doğrulama',
      description: 'DB hash, zincir hash ve tekrar hesaplanan hash karşılaştırılır.',
      value: displayStatus(latest?.integrityState.verificationStatus),
      icon: FactCheckIcon,
      state: isTampered ? 'error' : latest?.integrityState.verificationStatus === 'VERIFIED' ? 'success' : 'warning',
    },
  ] satisfies Array<{ title: string; description: string; value: string; icon: SvgIconComponent; state: NodeState }>;

  const labels = packetHistory.length > 1 ? packetHistory.map((packet) => `#${packet.sequenceNo}`) : ['#0', '#1', '#2', '#3', '#4', '#5'];
  const altitudeValues = packetHistory.length > 1 ? packetHistory.map((packet) => packet.barometer.barometricAltitude) : [0, 28, 92, 180, 310, 460];
  const speedValues = packetHistory.length > 1 ? packetHistory.map((packet) => packet.pitot.indicatedAirspeed) : [0, 18, 42, 64, 82, 95];
  const bufferValues =
    packetHistory.length > 1
      ? packetHistory.map((packet, index) => {
          const historicalBuffered = packet.connectionState.bufferedPacketCount;
          return index === packetHistory.length - 1 ? bufferPackets.length : historicalBuffered;
        })
      : [0, 0, 1, 2, 2, 0];

  const altitudeOption = makeLineOption(theme, labels, altitudeValues, theme.palette.primary.main, 'ft');
  const speedOption = makeLineOption(theme, labels, speedValues, theme.palette.secondary.main, 'kt');
  const bufferOption = makeLineOption(theme, labels, bufferValues, theme.palette.warning.main, 'paket');

  const timelineLogs = logs
    .filter((log) =>
      ['SENSOR-BUS', 'PACKET', 'HASH', 'DB', 'CHAIN', 'OPS-LINK', 'BUFFER', 'SYNC', 'ALERT', 'SATCOM', 'VERIFY', 'PROOF'].includes(log.source),
    )
    .slice(0, 12);

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.74 : 0.98) }}>
        <CardContent sx={{ p: { xs: 2.3, md: 3 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.4} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" component="h2">
                Operasyon Akışı
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8, maxWidth: 920 }}>
                Uçuş verisinin üretilmesi, hashlenmesi, buffer'a alınması, blokzincire kaydedilmesi ve doğrulanması
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
              <StatusChip label="Faz" status={latest?.flightPhase ?? 'PREFLIGHT'} />
              <StatusChip label="Bağlantı" status={connectionState.status} />
              <Chip size="small" label={`Buffer: ${bufferPackets.length}`} color={bufferPackets.length > 0 ? 'warning' : 'default'} variant="outlined" />
              <StatusChip label="Blockchain" status={latest?.integrityState.blockchainStatus ?? 'PENDING'} />
              <StatusChip label="Bütünlük" status={latest?.integrityState.verificationStatus ?? 'PENDING'} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={3}>
          <SectionCard title="Simülasyon Kontrolü" icon={MemoryIcon}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                  Birincil
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <ControlButton label="Simülasyonu Başlat" icon={PlayCircleIcon} onClick={startSimulation} tone="success" />
                  <ControlButton label="Duraklat" icon={PauseCircleIcon} onClick={pauseSimulation} tone="warning" />
                  <ControlButton label="Sıfırla" icon={RestartAltIcon} onClick={resetSimulation} tone="neutral" />
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                  Bağlantı
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <ControlButton label="Bağlantıyı Kes" icon={CloudOffIcon} onClick={triggerConnectionLoss} tone="warning" />
                  <ControlButton label="Bağlantıyı Geri Getir" icon={CloudDoneIcon} onClick={restoreConnection} tone="success" />
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                  Anomali / Kritik
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <ControlButton label="Ani İrtifa Düşüşü Tetikle" icon={VerticalAlignBottomIcon} onClick={triggerAltitudeDrop} tone="error" />
                  <ControlButton label="Pitot Anomalisi Tetikle" icon={SpeedIcon} onClick={triggerPitotAnomaly} tone="warning" />
                  <ControlButton label="GPS Spoofing Tetikle" icon={GpsNotFixedIcon} onClick={triggerGpsSpoofing} tone="error" />
                  <ControlButton label="Motor Sıcaklık Uyarısı Tetikle" icon={ThermostatIcon} onClick={triggerMotorOverheat} tone="warning" />
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                  Bütünlük
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <ControlButton label="Son Paketi Manipüle Et" icon={WarningAmberIcon} onClick={tamperLatestPacket} tone="error" />
                  <ControlButton label="Doğrulama Çalıştır" icon={FactCheckIcon} onClick={verifyLatestPacket} tone="info" />
                  <ControlButton label="Kritik Kanıt Paketi Oluştur" icon={CrisisAlertIcon} onClick={triggerCriticalProofPacket} tone="primary" />
                </Stack>
              </Box>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={9}>
          <SectionCard title="Dijital Kara Kutu İşlem Hattı" icon={CompareArrowsIcon}>
            <Grid container spacing={1.2} alignItems="stretch">
              {pipelineNodes.map((node, index) => (
                <Grid item xs={12} sm={6} md={index === pipelineNodes.length - 1 ? 12 : 3} lg={index === pipelineNodes.length - 1 ? 2.2 : 1.6} key={node.title}>
                  <PipelineNode {...node} />
                </Grid>
              ))}
            </Grid>
            <Box
              sx={{
                display: { xs: 'none', md: 'grid' },
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 1.2,
                mt: 1.2,
              }}
            >
              {pipelineNodes.slice(0, -1).map((node, index) => {
                const broken = offline && index >= 3;
                const arrowActive = active && !broken;
                return <FlowArrow key={`${node.title}-arrow`} active={arrowActive || syncing} broken={broken} />;
              })}
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <SectionCard title="Bağlantı ve Buffer" icon={SatelliteAltIcon}>
            <Stack spacing={1}>
              <FieldRow label="Connection Status" value={connectionState.status} />
              <FieldRow label="Primary Link" value="LTE/5G Demo Link" />
              <FieldRow label="Fallback Link" value="SATCOM Conceptual Fallback" />
              <FieldRow label="Buffered Packets" value={bufferPackets.length} warn={bufferPackets.length > 0} />
              <FieldRow label="Sync Status" value={offline ? 'Buffer modu aktif' : syncing ? 'Batch sync başlatıldı' : 'Batch sync tamamlandı'} />
              <FieldRow label="Last Sync Time" value={formatTime(latestRecord?.committedAt)} />
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.7 }}>
                <Typography variant="caption" color="text.secondary">
                  Signal Quality
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
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard title="Güncel Telemetri Paketi" icon={DataObjectIcon}>
            <Stack spacing={0.2}>
              <FieldRow label="Sequence No" value={`#${latest?.sequenceNo ?? 0}`} />
              <FieldRow label="Timestamp" value={formatTime(latest?.timestamp)} />
              <FieldRow label="Flight Phase" value={latest?.flightPhase ?? 'PREFLIGHT'} />
              <FieldRow label="Altitude" value={`${formatNumber(latest?.barometer.barometricAltitude ?? 0)} ft`} />
              <FieldRow label="Speed" value={`${formatNumber(latest?.pitot.indicatedAirspeed ?? 0)} kt`} />
              <FieldRow label="Battery" value={`${formatNumber(latest?.ecu.batteryLevel ?? 100, 1)}%`} />
              <FieldRow label="Event Type" value={latest?.events[0]?.eventType ?? 'NORMAL'} warn={Boolean(latest?.events[0]?.isCritical)} />
              <FieldRow label="Payload Hash" value={shortHash(latest?.integrityState.payloadHash)} />
              <FieldRow label="Previous Hash" value={shortHash(latest?.integrityState.previousPacketHash)} />
              <FieldRow label="Tx ID" value={shortHash(latest?.integrityState.txId, 10)} />
              <FieldRow label="Block No" value={latest?.integrityState.blockNo ?? '-'} />
            </Stack>
            <Box sx={{ mt: 1.2 }}>
              <StatusChip label="Verification" status={latest?.integrityState.verificationStatus ?? 'PENDING'} />
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard title="Hash Karşılaştırma" icon={FingerprintIcon}>
            <Stack spacing={0.2}>
              <FieldRow label="DB Payload Hash" value={shortHash(dbHash)} warn={isTampered} />
              <FieldRow label="Blockchain Hash" value={shortHash(chainHash)} warn={isTampered && chainHash !== recomputedHash} />
              <FieldRow label="Recomputed Hash" value={isTampered ? tamperedHash(latest?.integrityState.payloadHash) : shortHash(recomputedHash)} warn={isTampered} />
            </Stack>
            <Box
              sx={{
                mt: 2,
                p: 1.4,
                borderRadius: '8px',
                border: `1px solid ${alpha(hashesMatch ? theme.palette.secondary.main : theme.palette.error.main, 0.36)}`,
                bgcolor: alpha(hashesMatch ? theme.palette.secondary.main : theme.palette.error.main, theme.palette.mode === 'dark' ? 0.1 : 0.06),
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                  Verification Result
                </Typography>
                <StatusChip status={hashesMatch ? 'VERIFIED' : isTampered ? 'TAMPER_DETECTED' : latest?.integrityState.verificationStatus ?? 'PENDING'} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {hashesMatch ? 'DB ve blokzincir kayıtları eşleşiyor.' : isTampered ? 'Tekrar hesaplanan hash zincir kaydıyla eşleşmiyor.' : 'Doğrulama için commit bekleniyor.'}
              </Typography>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <SectionCard title="Kritik Kanıt Paketi" icon={CrisisAlertIcon}>
            {latestProof ? (
              <Stack spacing={0.2}>
                <FieldRow label="Proof ID" value={latestProof.proofId} />
                <FieldRow label="Event Type" value={latestProof.eventType} warn={latestProof.severity === 'CRITICAL'} />
                <FieldRow label="Severity" value={latestProof.severity} warn={latestProof.severity === 'CRITICAL'} />
                <FieldRow label="Timestamp" value={formatTime(latestProof.timestamp)} />
                <FieldRow label="Sequence Range" value={`#${latestProof.sequenceStart} - #${latestProof.sequenceEnd}`} />
                <FieldRow label="Last Known Position" value={`${latestProof.lastKnownPosition.latitude}, ${latestProof.lastKnownPosition.longitude}, ${formatNumber(latestProof.lastKnownPosition.gpsAltitude)} ft`} />
                <FieldRow label="Payload Hash" value={shortHash(latestProof.payloadHash)} />
                <FieldRow label="Previous Packet Hash" value={shortHash(latestProof.previousPacketHash)} />
                <FieldRow label="Signature Status" value={latestProof.signatureStatus} />
                <FieldRow label="Uplink Channel" value="SATCOM FALLBACK" />
                <FieldRow label="Blockchain Status" value={latestProof.blockchainStatus} />
                <FieldRow label="Block No" value={latestProofBlockNo(latestProof)} />
              </Stack>
            ) : (
              <Box sx={{ p: 2, borderRadius: '8px', border: `1px dashed ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Typography variant="body2" color="text.secondary">
                  Kritik olay veya manuel kanıt paketi henüz oluşturulmadı. Bir kritik tetikleyici çalıştırıldığında SATCOM fallback akışı burada görünür.
                </Typography>
              </Box>
            )}

            <Stack spacing={1} sx={{ mt: 2 }}>
              {['Kritik olay algılandı', 'Hash üretildi', 'İmza doğrulandı', 'Fallback kanalına aktarıldı', 'Blokzincire kaydedildi'].map((step, index) => {
                const complete = Boolean(latestProof);
                const color = complete ? theme.palette.secondary.main : theme.palette.text.secondary;
                return (
                  <Stack key={step} direction="row" spacing={1.2} alignItems="center">
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', color, border: `1px solid ${alpha(color, 0.54)}`, bgcolor: alpha(color, 0.09), fontSize: 11, fontWeight: 900 }}>
                      {index + 1}
                    </Box>
                    <Typography variant="body2" color={complete ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: complete ? 800 : 500 }}>
                      {step}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <MiniChart title="İrtifa" option={altitudeOption} />
            </Grid>
            <Grid item xs={12} md={4}>
              <MiniChart title="Hava Hızı" option={speedOption} />
            </Grid>
            <Grid item xs={12} md={4}>
              <MiniChart title="Buffer / Commit Akışı" option={bufferOption} />
            </Grid>
            <Grid item xs={12}>
              <SectionCard title="Olay Zaman Çizelgesi" icon={SyncIcon}>
                <Stack spacing={1.1}>
                  {timelineLogs.map((log, index) => {
                    const color = severityColors[log.severity];
                    return (
                      <Stack key={log.id} direction="row" spacing={1.4} alignItems="flex-start">
                        <Box sx={{ width: 24, display: 'grid', justifyItems: 'center', flex: '0 0 auto' }}>
                          <Box sx={{ width: 12, height: 12, mt: 0.35, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 14px ${alpha(color, 0.42)}` }} />
                          {index < timelineLogs.length - 1 ? <Box sx={{ width: 1, height: 32, bgcolor: alpha(color, 0.28), mt: 0.4 }} /> : null}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                              {log.timestamp}
                            </Typography>
                            <Chip size="small" label={log.source} sx={{ height: 21, color, bgcolor: alpha(color, 0.11), border: `1px solid ${alpha(color, 0.25)}`, fontWeight: 850 }} />
                            {log.relatedSequenceNo ? (
                              <Typography variant="caption" color="text.secondary">
                                #{log.relatedSequenceNo}
                              </Typography>
                            ) : null}
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 0.25 }}>
                            {log.message}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Stack>
  );
}
