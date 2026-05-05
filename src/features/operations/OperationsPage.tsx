import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
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
import ThermostatIcon from '@mui/icons-material/Thermostat';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { SvgIconComponent } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import type { EChartsOption } from 'echarts';
import { useFlightSimulation } from '../simulation/FlightSimulationContext';
import type { BlockchainStatus, ConnectionStatus, CriticalProofPacket, TelemetryPacket, VerificationStatus } from '../../types/telemetry';

type NodeState = 'waiting' | 'processing' | 'success' | 'warning' | 'error';
type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

type FleetCard = {
  vehicleId: string;
  flightId: string;
  flightPhase: string;
  connectionStatus: string;
  altitude: number;
  speed: number;
  battery: number;
  isLive: boolean;
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

function statusTone(status?: ConnectionStatus | VerificationStatus | BlockchainStatus | string | null): Tone {
  if (status === 'ONLINE' || status === 'VERIFIED' || status === 'COMMITTED' || status === 'SIGNED') return 'success';
  if (status === 'TAMPER_DETECTED' || status === 'FAILED' || status === 'INVALID') return 'error';
  if (status === 'BUFFERING' || status === 'SYNCING' || status === 'SATCOM_FALLBACK' || status === 'PENDING' || status === 'OFFLINE' || status === 'WARNING') return 'warning';
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
        height: '100%',
        border: `1px solid ${alpha(color, state === 'waiting' ? 0.22 : 0.42)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.84),
        boxShadow: state === 'processing' ? `0 0 0 1px ${alpha(color, 0.18)}, 0 0 22px ${alpha(color, 0.16)}` : 'none',
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
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Chip size="small" label={statusText[state]} sx={{ color, bgcolor: alpha(color, 0.11), border: `1px solid ${alpha(color, 0.26)}`, fontWeight: 850 }} />
        </Stack>
        <Typography variant="h6" sx={{ mt: 1.3, fontSize: 16 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, minHeight: 38 }}>
          {description}
        </Typography>
        <Typography variant="caption" sx={{ mt: 1.1, display: 'block', color, fontWeight: 850, wordBreak: 'break-all' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function MiniChart({ title, option }: { title: string; option: EChartsOption }) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.72) }}>
      <CardContent sx={{ p: 1.7, '&:last-child': { pb: 1.7 } }}>
        <Typography variant="subtitle2" sx={{ mb: 0.8 }}>
          {title}
        </Typography>
        <Box sx={{ height: 178 }}>
          <ReactECharts option={option} style={{ width: '100%', height: '100%' }} notMerge lazyUpdate />
        </Box>
      </CardContent>
    </Card>
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
        lineStyle: { width: 2.8, color },
        areaStyle: { color: alpha(color, theme.palette.mode === 'dark' ? 0.16 : 0.1) },
      },
    ],
  };
}

function latestProofBlockNo(proof: CriticalProofPacket | null) {
  return proof?.blockNo ?? '-';
}

function buildMockVehicle(base: TelemetryPacket | null, offset: number, vehicleId: string, flightId: string): FleetCard {
  return {
    vehicleId,
    flightId,
    flightPhase: offset % 2 === 0 ? 'CRUISE' : 'CLIMB',
    connectionStatus: offset === 2 ? 'BUFFERING' : 'ONLINE',
    altitude: (base?.barometer.barometricAltitude ?? 1480) + offset * 190,
    speed: (base?.pitot.indicatedAirspeed ?? 118) + offset * 7,
    battery: Math.max(42, (base?.ecu.batteryLevel ?? 88) - offset * 6),
    isLive: false,
  };
}

export function OperationsPage() {
  const theme = useTheme();
  const {
    running,
    flightId,
    vehicleId,
    latestPacket,
    connectionState,
    dbPackets,
    blockchainRecords,
    bufferPackets,
    criticalProofPackets,
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
  } = useFlightSimulation();
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId);

  const packetHistory = useMemo(() => {
    const bySequence = new Map<number, TelemetryPacket>();
    [...dbPackets, ...bufferPackets, ...(latestPacket ? [latestPacket] : [])].forEach((packet) => bySequence.set(packet.sequenceNo, packet));
    return Array.from(bySequence.values())
      .sort((first, second) => first.sequenceNo - second.sequenceNo)
      .slice(-24);
  }, [bufferPackets, dbPackets, latestPacket]);

  const latest = latestPacket ?? packetHistory[packetHistory.length - 1] ?? null;
  const activeFleet = useMemo<FleetCard[]>(
    () => [
      {
        vehicleId,
        flightId,
        flightPhase: latest?.flightPhase ?? 'PREFLIGHT',
        connectionStatus: latest?.connectionState.status ?? connectionState.status,
        altitude: latest?.barometer.barometricAltitude ?? 0,
        speed: latest?.pitot.indicatedAirspeed ?? 0,
        battery: latest?.ecu.batteryLevel ?? 100,
        isLive: true,
      },
      buildMockVehicle(latest, 1, 'SYN-UAV-03', 'SYN-FLT-2026-014'),
      buildMockVehicle(latest, 2, 'SYN-UAV-11', 'SYN-FLT-2026-018'),
      buildMockVehicle(latest, 3, 'SYN-UAV-19', 'SYN-FLT-2026-021'),
    ],
    [connectionState.status, flightId, latest, vehicleId],
  );

  const selectedFlight = activeFleet.find((item) => item.vehicleId === selectedVehicleId) ?? activeFleet[0];
  const selectedIsLive = selectedFlight.isLive;
  const selectedLatest = latest;
  const latestProof = criticalProofPackets[criticalProofPackets.length - 1] ?? null;
  const latestRecord = blockchainRecords[blockchainRecords.length - 1];
  const latestDbPacket = selectedLatest ? dbPackets.find((packet) => packet.sequenceNo === selectedLatest.sequenceNo) : undefined;
  const latestChainRecord = selectedLatest ? blockchainRecords.find((record) => record.sequenceNo === selectedLatest.sequenceNo) : undefined;
  const isTampered = selectedLatest?.integrityState.verificationStatus === 'TAMPER_DETECTED';
  const dbHash = latestDbPacket?.integrityState.payloadHash ?? selectedLatest?.integrityState.payloadHash ?? '';
  const chainHash = latestChainRecord?.payloadHash ?? selectedLatest?.integrityState.payloadHash ?? '';
  const recomputedHash = isTampered ? `${(selectedLatest?.integrityState.payloadHash ?? '').slice(0, 8)}ff${(selectedLatest?.integrityState.payloadHash ?? '').slice(10)}` : selectedLatest?.integrityState.payloadHash ?? '';
  const hashesMatch = Boolean(dbHash && chainHash && recomputedHash && dbHash === chainHash && chainHash === recomputedHash && !isTampered);
  const offline = connectionState.status === 'OFFLINE' || connectionState.status === 'BUFFERING';
  const syncing = connectionState.status === 'SYNCING';

  const pipelineNodes = [
    {
      title: 'Sensörler',
      description: 'GPS, IMU, pitot, barometre ve ECU verisi toplanır.',
      value: selectedLatest ? `Sıra #${selectedLatest.sequenceNo}` : 'Veri bekleniyor',
      icon: SensorsIcon,
      state: running && selectedIsLive ? 'processing' : 'waiting',
    },
    {
      title: 'Paketleme',
      description: 'Seçili uçuş için telemetri paketi üretilir.',
      value: selectedFlight.flightPhase,
      icon: DataObjectIcon,
      state: selectedIsLive && selectedLatest ? 'success' : 'waiting',
    },
    {
      title: 'Hashleme',
      description: 'Paket özeti SHA-256 ile hesaplanır.',
      value: shortHash(selectedLatest?.integrityState.payloadHash),
      icon: FingerprintIcon,
      state: selectedIsLive && selectedLatest ? 'success' : 'waiting',
    },
    {
      title: 'Local Buffer',
      description: offline ? 'Bağlantı yok, paketler yerel tamponda tutuluyor.' : syncing ? 'Batch sync aktif.' : 'Tampon pasif.',
      value: `${bufferPackets.length} paket`,
      icon: StorageIcon,
      state: offline || syncing ? 'warning' : 'success',
    },
    {
      title: 'Off-chain DB',
      description: 'Ham telemetri kaydı yerel veri katmanına yazılır.',
      value: `${dbPackets.length} kayıt`,
      icon: DatasetIcon,
      state: offline ? 'waiting' : dbPackets.length > 0 ? 'success' : 'waiting',
    },
    {
      title: 'Blockchain',
      description: 'Hash kaydı zincir ledger simülasyonuna commit edilir.',
      value: latestRecord ? `Blok ${latestRecord.blockNo}` : 'Commit bekleniyor',
      icon: HubIcon,
      state: selectedLatest?.integrityState.blockchainStatus === 'COMMITTED' ? 'success' : offline ? 'warning' : 'waiting',
    },
    {
      title: 'Doğrulama',
      description: 'DB, zincir ve yeniden hesaplanan hash karşılaştırılır.',
      value: displayStatus(selectedLatest?.integrityState.verificationStatus),
      icon: FactCheckIcon,
      state: isTampered ? 'error' : selectedLatest?.integrityState.verificationStatus === 'VERIFIED' ? 'success' : 'warning',
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
  const motorTempValues = packetHistory.length > 1 ? packetHistory.map((packet) => packet.ecu.motorTemperature) : [32, 35, 38, 42, 46, 51];

  const latestMotorTemp = selectedLatest?.ecu.motorTemperature ?? 32;
  const motorChartColor = latestMotorTemp > 95 ? theme.palette.error.main : latestMotorTemp > 80 ? theme.palette.warning.main : theme.palette.secondary.main;
  const altitudeOption = makeLineOption(theme, labels, altitudeValues, theme.palette.primary.main, 'ft');
  const speedOption = makeLineOption(theme, labels, speedValues, theme.palette.secondary.main, 'kt');
  const bufferOption = makeLineOption(theme, labels, bufferValues, theme.palette.warning.main, 'paket');
  const motorTempOption = makeLineOption(theme, labels, motorTempValues, motorChartColor, 'C');

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
              <Chip size="small" label={`${selectedFlight.vehicleId}`} color="primary" variant="outlined" />
              <StatusChip label="Faz" status={selectedFlight.flightPhase} />
              <StatusChip label="Bağlantı" status={selectedFlight.connectionStatus} />
              <Chip size="small" label={`Buffer: ${bufferPackets.length}`} color={bufferPackets.length > 0 ? 'warning' : 'default'} variant="outlined" />
              <StatusChip label="Bütünlük" status={selectedLatest?.integrityState.verificationStatus ?? 'PENDING'} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <SectionCard title="Aktif Uçuşlar" icon={SatelliteAltIcon}>
        <Grid container spacing={1.5}>
          {activeFleet.map((item) => {
            const activeCard = selectedVehicleId === item.vehicleId;
            return (
              <Grid item xs={12} sm={6} lg={3} key={item.vehicleId}>
                <Card
                  elevation={0}
                  onClick={() => setSelectedVehicleId(item.vehicleId)}
                  sx={{
                    cursor: 'pointer',
                    border: `1px solid ${activeCard ? alpha(theme.palette.primary.main, 0.52) : theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.background.paper, activeCard ? 0.94 : 0.76),
                    boxShadow: activeCard ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
                  }}
                >
                  <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
                    <Stack spacing={0.8}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                          {item.vehicleId}
                        </Typography>
                        <Chip size="small" label={item.isLive ? 'Canlı Demo' : 'İzlenen Uçuş'} color={item.isLive ? 'primary' : 'default'} variant="outlined" />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {item.flightId}
                      </Typography>
                      <StatusChip status={item.flightPhase} />
                      <Typography variant="body2" color="text.secondary">
                        İrtifa {formatNumber(item.altitude)} ft • Hız {formatNumber(item.speed)} kt • Batarya %{formatNumber(item.battery, 1)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </SectionCard>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <SectionCard title="Simülasyon Kontrolü" icon={MemoryIcon}>
            <Stack spacing={2}>
              <Stack spacing={1}>
                <ControlButton label="Simülasyonu Başlat" icon={PlayCircleIcon} onClick={startSimulation} tone="success" />
                <ControlButton label="Duraklat" icon={PauseCircleIcon} onClick={pauseSimulation} tone="warning" />
                <ControlButton label="Sıfırla" icon={RestartAltIcon} onClick={resetSimulation} tone="neutral" />
              </Stack>
              <Stack spacing={1}>
                <ControlButton label="Bağlantıyı Kes" icon={CloudOffIcon} onClick={triggerConnectionLoss} tone="warning" />
                <ControlButton label="Bağlantıyı Geri Getir" icon={CloudDoneIcon} onClick={restoreConnection} tone="success" />
              </Stack>
              {!selectedIsLive ? (
                <Typography variant="caption" color="text.secondary">
                  Senaryo tetikleyicileri canlı demo uçağı olan {vehicleId} üzerinde çalışır.
                </Typography>
              ) : null}
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <SectionCard title="Anomali ve Bütünlük" icon={CrisisAlertIcon}>
            <Stack spacing={1}>
              <ControlButton label="Ani İrtifa Düşüşü Tetikle" icon={VerticalAlignBottomIcon} onClick={triggerAltitudeDrop} tone="error" />
              <ControlButton label="Pitot Anomalisi Tetikle" icon={SpeedIcon} onClick={triggerPitotAnomaly} tone="warning" />
              <ControlButton label="GPS Spoofing Tetikle" icon={GpsNotFixedIcon} onClick={triggerGpsSpoofing} tone="error" />
              <ControlButton label="Motor Sıcaklık Uyarısı Tetikle" icon={ThermostatIcon} onClick={triggerMotorOverheat} tone="warning" />
              <ControlButton label="Son Paketi Manipüle Et" icon={WarningAmberIcon} onClick={tamperLatestPacket} tone="error" />
              <ControlButton label="Doğrulama Çalıştır" icon={FactCheckIcon} onClick={verifyLatestPacket} tone="info" />
              <ControlButton label="Kritik Kanıt Paketi Oluştur" icon={CrisisAlertIcon} onClick={triggerCriticalProofPacket} tone="primary" />
            </Stack>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <SectionCard title="Bağlantı ve Buffer" icon={StorageIcon}>
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
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <SectionCard title="Dijital Kara Kutu İşlem Hattı" icon={MemoryIcon}>
            <Grid container spacing={1.5}>
              {pipelineNodes.map((node) => (
                <Grid item xs={12} sm={6} lg={4} key={node.title}>
                  <PipelineNode {...node} />
                </Grid>
              ))}
            </Grid>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <SectionCard title="Güncel Telemetri Paketi" icon={DataObjectIcon}>
            <Stack spacing={0.2}>
              <FieldRow label="Sequence No" value={`#${selectedLatest?.sequenceNo ?? 0}`} />
              <FieldRow label="Timestamp" value={formatTime(selectedLatest?.timestamp)} />
              <FieldRow label="Flight Phase" value={selectedFlight.flightPhase} />
              <FieldRow label="Altitude" value={`${formatNumber(selectedFlight.altitude)} ft`} />
              <FieldRow label="Speed" value={`${formatNumber(selectedFlight.speed)} kt`} />
              <FieldRow label="Battery" value={`%${formatNumber(selectedFlight.battery, 1)}`} />
              <FieldRow label="Event Type" value={selectedLatest?.events[0]?.eventType ?? 'NORMAL'} warn={Boolean(selectedLatest?.events[0]?.isCritical)} />
              <FieldRow label="Payload Hash" value={shortHash(selectedLatest?.integrityState.payloadHash)} />
              <FieldRow label="Previous Hash" value={shortHash(selectedLatest?.integrityState.previousPacketHash)} />
              <FieldRow label="Tx ID" value={shortHash(selectedLatest?.integrityState.txId, 10)} />
              <FieldRow label="Block No" value={selectedLatest?.integrityState.blockNo ?? '-'} />
            </Stack>
            <Box sx={{ mt: 1.2 }}>
              <StatusChip label="Verification" status={selectedLatest?.integrityState.verificationStatus ?? 'PENDING'} />
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <SectionCard title="Kritik Kanıt Paketi" icon={CrisisAlertIcon}>
            {latestProof ? (
              <Stack spacing={0.2} key={latestProof.proofId}>
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
                  Kritik olay veya manuel kanıt paketi henüz oluşturulmadı. Tetiklenen son anomali burada görünür.
                </Typography>
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard title="Hash Karşılaştırma" icon={FingerprintIcon}>
            <Stack spacing={0.2}>
              <FieldRow label="DB Payload Hash" value={shortHash(dbHash)} warn={isTampered} />
              <FieldRow label="Blockchain Hash" value={shortHash(chainHash)} warn={isTampered && chainHash !== recomputedHash} />
              <FieldRow label="Recomputed Hash" value={isTampered ? tamperedHash(selectedLatest?.integrityState.payloadHash) : shortHash(recomputedHash)} warn={isTampered} />
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
                <StatusChip status={hashesMatch ? 'VERIFIED' : isTampered ? 'TAMPER_DETECTED' : selectedLatest?.integrityState.verificationStatus ?? 'PENDING'} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {hashesMatch ? 'DB ve blokzincir kayıtları eşleşiyor.' : isTampered ? 'Tekrar hesaplanan hash zincir kaydıyla eşleşmiyor.' : 'Doğrulama için commit bekleniyor.'}
              </Typography>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={3}>
          <MiniChart title="İrtifa" option={altitudeOption} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MiniChart title="Hava Hızı" option={speedOption} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MiniChart title="Buffer / Commit Akışı" option={bufferOption} />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MiniChart title="Motor Sıcaklığı" option={motorTempOption} />
        </Grid>
      </Grid>
    </Stack>
  );
}
