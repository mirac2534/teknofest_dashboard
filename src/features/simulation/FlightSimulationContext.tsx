import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SystemLog } from '../../types/logs';
import type {
  BlockchainRecord,
  BlockchainStatus,
  ConnectionState,
  CriticalProofPacket,
  FlightPhase,
  GPS,
  IntegrityState,
  TelemetryEvent,
  TelemetryPacket,
  TelemetrySeverity,
} from '../../types/telemetry';

type SimulationSnapshot = {
  running: boolean;
  flightId: string;
  vehicleId: string;
  latestPacket: TelemetryPacket | null;
  connectionState: ConnectionState;
  dbPackets: TelemetryPacket[];
  blockchainRecords: BlockchainRecord[];
  bufferPackets: TelemetryPacket[];
  criticalProofPackets: CriticalProofPacket[];
  logs: SystemLog[];
};

type FlightSimulationContextValue = SimulationSnapshot & {
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  triggerConnectionLoss: () => void;
  restoreConnection: () => void;
  triggerAltitudeDrop: () => void;
  triggerPitotAnomaly: () => void;
  triggerGpsSpoofing: () => void;
  triggerMotorOverheat: () => void;
  tamperLatestPacket: () => void;
  verifyLatestPacket: () => void;
  triggerCriticalProofPacket: () => void;
};

type PhysicsState = {
  sequenceNo: number;
  altitude: number;
  groundSpeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  batteryLevel: number;
  motorTemperature: number;
  previousPacketHash: string;
  blockNo: number;
  pendingSync: boolean;
  pitotAnomalyUntil: number;
  gpsSpoofingUntil: number;
  motorOverheatUntil: number;
  altitudeDropUntil: number;
};

const flightId = 'SYN-FLT-2026-001';
const vehicleId = 'SYN-UAV-07';
const genesisHash = '0'.repeat(64);
const maxLogs = 180;
const maxPackets = 600;

const initialConnectionState: ConnectionState = {
  status: 'ONLINE',
  signalQuality: 96,
  buffered: false,
  bufferedPacketCount: 0,
  uplinkChannel: 'PRIMARY',
};

const FlightSimulationContext = createContext<FlightSimulationContextValue | null>(null);

function createInitialPhysics(): PhysicsState {
  return {
    sequenceNo: 0,
    altitude: 0,
    groundSpeed: 0,
    heading: 42,
    latitude: 40.9829,
    longitude: 29.1234,
    batteryLevel: 100,
    motorTemperature: 32,
    previousPacketHash: genesisHash,
    blockNo: 2100,
    pendingSync: false,
    pitotAnomalyUntil: 0,
    gpsSpoofingUntil: 0,
    motorOverheatUntil: 0,
    altitudeDropUntil: 0,
  };
}

function getFlightPhase(sequenceNo: number): FlightPhase {
  if (sequenceNo < 8) return 'PREFLIGHT';
  if (sequenceNo < 22) return 'TAKEOFF';
  if (sequenceNo < 70) return 'CLIMB';
  if (sequenceNo < 150) return 'CRUISE';
  if (sequenceNo < 205) return 'DESCENT';
  if (sequenceNo < 230) return 'LANDING';
  return 'POSTFLIGHT';
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function noise(scale: number) {
  return (Math.random() - 0.5) * scale;
}

function isoNow() {
  return new Date().toISOString();
}

function timeOnly(timestamp: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

function phaseProfile(phase: FlightPhase) {
  switch (phase) {
    case 'PREFLIGHT':
      return { targetSpeed: 0, verticalSpeed: 0, throttle: 8, pitch: 0, flaps: 12 };
    case 'TAKEOFF':
      return { targetSpeed: 82, verticalSpeed: 850, throttle: 92, pitch: 8, flaps: 18 };
    case 'CLIMB':
      return { targetSpeed: 142, verticalSpeed: 1200, throttle: 78, pitch: 6, flaps: 6 };
    case 'CRUISE':
      return { targetSpeed: 185, verticalSpeed: 0, throttle: 58, pitch: 1, flaps: 0 };
    case 'DESCENT':
      return { targetSpeed: 160, verticalSpeed: -900, throttle: 34, pitch: -3, flaps: 4 };
    case 'LANDING':
      return { targetSpeed: 78, verticalSpeed: -520, throttle: 24, pitch: 2, flaps: 28 };
    case 'POSTFLIGHT':
      return { targetSpeed: 0, verticalSpeed: 0, throttle: 4, pitch: 0, flaps: 0 };
  }
}

function fallbackHash(input: string) {
  let h1 = 0x811c9dc5;
  let h2 = 0x45d9f3b;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  const chunk = (value: number) => (value >>> 0).toString(16).padStart(8, '0');
  return `${chunk(h1)}${chunk(h2)}${chunk(h1 ^ h2)}${chunk(Math.imul(h1, h2))}`.repeat(2).slice(0, 64);
}

async function sha256(input: string) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return fallbackHash(input);
}

function serializeForHash(packet: Omit<TelemetryPacket, 'integrityState'>) {
  return JSON.stringify(packet);
}

function createTxId(sequenceNo: number, hash: string) {
  return `0x${hash.slice(0, 10)}${sequenceNo.toString(16).padStart(6, '0')}`;
}

function createPacketShell(
  physics: PhysicsState,
  connectionState: ConnectionState,
  timestamp: string,
  events: TelemetryEvent[],
): Omit<TelemetryPacket, 'integrityState'> {
  const sequenceNo = physics.sequenceNo;
  const phase = getFlightPhase(sequenceNo);
  const profile = phaseProfile(phase);
  const activePitotAnomaly = physics.pitotAnomalyUntil >= sequenceNo;
  const activeGpsSpoofing = physics.gpsSpoofingUntil >= sequenceNo;
  const activeMotorOverheat = physics.motorOverheatUntil >= sequenceNo;
  const activeAltitudeDrop = physics.altitudeDropUntil >= sequenceNo;

  const speedDelta = (profile.targetSpeed - physics.groundSpeed) * 0.22;
  physics.groundSpeed = clamp(physics.groundSpeed + speedDelta + noise(1.8), 0, 198);
  physics.altitude = clamp(physics.altitude + profile.verticalSpeed / 60 + noise(3), 0, 4200);
  if (activeAltitudeDrop) {
    physics.altitude = clamp(physics.altitude - 75, 0, 4200);
  }

  physics.heading = (physics.heading + (phase === 'CRUISE' ? 0.2 : 0.45) + noise(0.7) + 360) % 360;
  const headingRadians = (physics.heading * Math.PI) / 180;
  const distanceNmPerSecond = physics.groundSpeed / 3600;
  physics.latitude += Math.cos(headingRadians) * distanceNmPerSecond * 0.0166;
  physics.longitude += Math.sin(headingRadians) * distanceNmPerSecond * 0.0215;
  physics.batteryLevel = clamp(physics.batteryLevel - (0.012 + profile.throttle / 20000), 0, 100);
  physics.motorTemperature = activeMotorOverheat
    ? clamp(physics.motorTemperature + 2.6, 32, 118)
    : clamp(physics.motorTemperature + (profile.throttle - 42) * 0.025 - 0.25 + noise(0.35), 30, 88);

  const barometricAltitude = round(physics.altitude + noise(7));
  const gpsAltitude = round(physics.altitude + noise(activeGpsSpoofing ? 80 : 10) + (activeGpsSpoofing ? 180 : 0));
  const pressure = round(1013.25 * (1 - (physics.altitude * 0.3048) / 44330) ** 5.255, 2);
  const trueAirspeed = round(physics.groundSpeed + noise(3));
  const indicatedAirspeed = activePitotAnomaly ? round(trueAirspeed * 0.56 + noise(4)) : round(trueAirspeed - physics.altitude * 0.002 + noise(2));
  const warningLight = events.some((event) => event.severity !== 'INFO');
  const masterCaution = events.some((event) => event.isCritical);

  const gps: GPS = {
    latitude: round(physics.latitude + noise(activeGpsSpoofing ? 0.014 : 0.00008), 6),
    longitude: round(physics.longitude + noise(activeGpsSpoofing ? 0.014 : 0.00008), 6),
    gpsAltitude,
    groundSpeed: round(physics.groundSpeed),
    heading: round(physics.heading),
    satelliteCount: activeGpsSpoofing ? 5 : phase === 'PREFLIGHT' ? 10 : 14,
    gpsStatus: activeGpsSpoofing ? 'SPOOFING_SUSPECTED' : 'LOCKED',
  };

  return {
    flightId,
    vehicleId,
    sequenceNo,
    timestamp,
    flightPhase: phase,
    gps,
    barometer: {
      barometricAltitude,
      verticalSpeed: activeAltitudeDrop ? -2400 : profile.verticalSpeed + noise(70),
      pressure,
    },
    pitot: {
      indicatedAirspeed,
      trueAirspeed,
      pitotStatus: activePitotAnomaly ? 'ANOMALY' : 'NORMAL',
    },
    imu: {
      accelerationX: round((physics.groundSpeed - profile.targetSpeed) * 0.01 + noise(0.05), 3),
      accelerationY: round(noise(0.08), 3),
      accelerationZ: round(1 + profile.verticalSpeed / 5000 + noise(0.04), 3),
      gyroX: round(noise(0.9), 3),
      gyroY: round(profile.pitch * 0.04 + noise(0.7), 3),
      gyroZ: round(noise(0.5), 3),
      roll: round(noise(3)),
      pitch: round(profile.pitch + noise(1.1)),
      yaw: round(physics.heading + noise(1.2)),
    },
    ecu: {
      motorRpm: Math.round(900 + profile.throttle * 62 + physics.groundSpeed * 8 + noise(80)),
      motorTemperature: round(physics.motorTemperature),
      batteryLevel: round(physics.batteryLevel),
      batteryVoltage: round(22.2 * (0.86 + physics.batteryLevel / 720), 2),
      motorCurrent: round(8 + profile.throttle * 0.55 + noise(1.8)),
      throttle: round(profile.throttle + noise(1.2)),
      ecuStatus: activeMotorOverheat ? 'OVERHEAT' : physics.motorTemperature > 82 ? 'WARNING' : 'NORMAL',
    },
    flightControl: {
      aileronPosition: round(noise(3)),
      elevatorPosition: round(profile.pitch * 0.6 + noise(2)),
      rudderPosition: round(noise(2)),
      flapPosition: profile.flaps,
      landingGearStatus: phase === 'PREFLIGHT' || phase === 'TAKEOFF' || phase === 'LANDING' || phase === 'POSTFLIGHT' ? 'DOWN' : 'UP',
      brakeStatus: phase === 'PREFLIGHT' || phase === 'POSTFLIGHT' ? 'ACTIVE' : phase === 'LANDING' ? 'ARMED' : 'RELEASED',
    },
    warningSystem: {
      doorStatus: 'CLOSED',
      warningLight,
      masterCaution,
      alarmCode: events.find((event) => event.isCritical)?.eventType ?? null,
    },
    connectionState,
    events,
  };
}

function createLog(severity: SystemLog['severity'], source: string, message: string, relatedSequenceNo?: number): SystemLog {
  const timestamp = isoNow();
  return {
    id: `log-${timestamp}-${Math.random().toString(16).slice(2)}`,
    timestamp: timeOnly(timestamp),
    severity,
    source,
    message,
    relatedSequenceNo,
  };
}

export function FlightSimulationProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>({
    running: true,
    flightId,
    vehicleId,
    latestPacket: null,
    connectionState: initialConnectionState,
    dbPackets: [],
    blockchainRecords: [],
    bufferPackets: [],
    criticalProofPackets: [],
    logs: [
      createLog('INFO', 'CORE', 'Yerel simülasyon motoru başlatıldı'),
      createLog('CONNECTION', 'OPS-LINK', 'Birincil telemetri kanalı çevrimiçi'),
    ],
  });

  const snapshotRef = useRef(snapshot);
  const physicsRef = useRef(createInitialPhysics());
  const generatingRef = useRef(false);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const commitSnapshot = useCallback((updater: (current: SimulationSnapshot) => SimulationSnapshot) => {
    setSnapshot((current) => {
      const updated = updater(current);
      snapshotRef.current = updated;
      return updated;
    });
  }, []);

  const pushLogs = useCallback(
    (...logs: SystemLog[]) => {
      commitSnapshot((current) => ({
        ...current,
        logs: [...logs, ...current.logs].slice(0, maxLogs),
      }));
    },
    [commitSnapshot],
  );

  const commitPacket = useCallback(
    (packet: TelemetryPacket, forcedChannel?: 'PRIMARY' | 'SATCOM') => {
      const blockNo = physicsRef.current.blockNo + 1;
      physicsRef.current.blockNo = blockNo;
      physicsRef.current.previousPacketHash = packet.integrityState.payloadHash;
      const txId = createTxId(packet.sequenceNo, packet.integrityState.payloadHash);
      const record: BlockchainRecord = {
        txId,
        blockNo,
        sequenceNo: packet.sequenceNo,
        payloadHash: packet.integrityState.payloadHash,
        previousPacketHash: packet.integrityState.previousPacketHash,
        committedAt: isoNow(),
      };
      const committedPacket: TelemetryPacket = {
        ...packet,
        connectionState: {
          ...packet.connectionState,
          uplinkChannel: forcedChannel ?? packet.connectionState.uplinkChannel,
        },
        integrityState: {
          ...packet.integrityState,
          verificationStatus: 'VERIFIED',
          blockchainStatus: 'COMMITTED',
          txId,
          blockNo,
        },
      };

      return { record, committedPacket };
    },
    [],
  );

  const generatePacket = useCallback(async () => {
    if (generatingRef.current || !snapshotRef.current.running) return;
    generatingRef.current = true;

    try {
      const physics = physicsRef.current;
      physics.sequenceNo += 1;
      const sequenceNo = physics.sequenceNo;
      const timestamp = isoNow();
      const current = snapshotRef.current;
      const events: TelemetryEvent[] = [];

      if (physics.altitudeDropUntil >= sequenceNo) {
        events.push({ isCritical: true, eventType: 'ALTITUDE_DROP', severity: 'CRITICAL' });
      }
      if (physics.pitotAnomalyUntil >= sequenceNo) {
        events.push({ isCritical: false, eventType: 'PITOT_ANOMALY', severity: 'WARNING' });
      }
      if (physics.gpsSpoofingUntil >= sequenceNo) {
        events.push({ isCritical: true, eventType: 'GPS_SPOOFING', severity: 'CRITICAL' });
      }
      if (physics.motorOverheatUntil >= sequenceNo) {
        events.push({ isCritical: true, eventType: 'MOTOR_OVERHEAT', severity: 'CRITICAL' });
      }

      const buffering = current.connectionState.status === 'OFFLINE' || current.connectionState.status === 'BUFFERING';
      const connectionState: ConnectionState = {
        status: buffering ? 'BUFFERING' : current.connectionState.status === 'SYNCING' ? 'SYNCING' : 'ONLINE',
        signalQuality: buffering ? 0 : clamp(current.connectionState.signalQuality + noise(4), 72, 99),
        buffered: buffering,
        bufferedPacketCount: current.bufferPackets.length + (buffering ? 1 : 0),
        uplinkChannel: buffering ? 'LOCAL_BUFFER' : 'PRIMARY',
      };

      const packetShell = createPacketShell(physics, connectionState, timestamp, events);
      const payloadHash = await sha256(serializeForHash(packetShell));
      const pendingIntegrity: IntegrityState = {
        payloadHash,
        previousPacketHash: physics.previousPacketHash,
        signatureStatus: 'SIGNED',
        verificationStatus: 'PENDING',
        blockchainStatus: 'PENDING',
        txId: null,
        blockNo: null,
      };
      const pendingPacket: TelemetryPacket = { ...packetShell, integrityState: pendingIntegrity };

      if (buffering) {
        commitSnapshot((state) => ({
          ...state,
          latestPacket: pendingPacket,
          connectionState,
          bufferPackets: [...state.bufferPackets, pendingPacket].slice(-maxPackets),
          logs: [
            createLog('TELEMETRY', 'SENSOR-BUS', `Sensör paketi üretildi: sıra ${sequenceNo}`, sequenceNo),
            createLog('BLOCKCHAIN', 'HASH', `Paket hash'i hesaplandı: ${payloadHash.slice(0, 12)}...`, sequenceNo),
            createLog('CONNECTION', 'BUFFER', `Bağlantı yok, paket yerel tampona alındı (${connectionState.bufferedPacketCount})`, sequenceNo),
            ...state.logs,
          ].slice(0, maxLogs),
        }));
        return;
      }

      const { record, committedPacket } = commitPacket(pendingPacket);
      commitSnapshot((state) => ({
        ...state,
        latestPacket: committedPacket,
        connectionState: committedPacket.connectionState,
        dbPackets: [...state.dbPackets, committedPacket].slice(-maxPackets),
        blockchainRecords: [...state.blockchainRecords, record].slice(-maxPackets),
        logs: [
          createLog('TELEMETRY', 'SENSOR-BUS', `Sensör paketi üretildi: sıra ${sequenceNo}`, sequenceNo),
          createLog('INFO', 'PACKET', `Telemetri paketi oluşturuldu: sıra ${sequenceNo}`, sequenceNo),
          createLog('BLOCKCHAIN', 'HASH', `Paket hash'i hesaplandı: ${payloadHash.slice(0, 12)}...`, sequenceNo),
          createLog('INFO', 'DB', `Paket yerel veritabanına kaydedildi`, sequenceNo),
          createLog('BLOCKCHAIN', 'CHAIN', `Hash blokzincire kaydedildi: blok ${record.blockNo}`, sequenceNo),
          ...state.logs,
        ].slice(0, maxLogs),
      }));
    } finally {
      generatingRef.current = false;
    }
  }, [commitPacket, commitSnapshot]);

  const syncBufferedPackets = useCallback(() => {
    const buffered = snapshotRef.current.bufferPackets;
    if (buffered.length === 0) {
      commitSnapshot((state) => ({
        ...state,
        connectionState: initialConnectionState,
      }));
      return;
    }

    commitSnapshot((state) => ({
      ...state,
      connectionState: {
        status: 'SYNCING',
        signalQuality: 84,
        buffered: true,
        bufferedPacketCount: state.bufferPackets.length,
        uplinkChannel: 'PRIMARY',
      },
      logs: [createLog('CONNECTION', 'SYNC', `Yeniden bağlantı sağlandı, ${state.bufferPackets.length} paket senkronize ediliyor`), ...state.logs].slice(0, maxLogs),
    }));

    let index = 0;
    const timer = window.setInterval(() => {
      const state = snapshotRef.current;
      const packet = state.bufferPackets[0];
      if (!packet) {
        window.clearInterval(timer);
        commitSnapshot((current) => ({
          ...current,
          connectionState: {
            status: 'ONLINE',
            signalQuality: 94,
            buffered: false,
            bufferedPacketCount: 0,
            uplinkChannel: 'PRIMARY',
          },
          logs: [createLog('CONNECTION', 'SYNC', 'Tampon senkronizasyonu tamamlandı, sistem çevrimiçi'), ...current.logs].slice(0, maxLogs),
        }));
        return;
      }

      const { record, committedPacket } = commitPacket(packet);
      index += 1;
      commitSnapshot((current) => {
        const remaining = current.bufferPackets.slice(1);
        return {
          ...current,
          latestPacket: committedPacket,
          dbPackets: [...current.dbPackets, committedPacket].slice(-maxPackets),
          blockchainRecords: [...current.blockchainRecords, record].slice(-maxPackets),
          bufferPackets: remaining,
          connectionState: {
            status: remaining.length > 0 ? 'SYNCING' : 'ONLINE',
            signalQuality: 90,
            buffered: remaining.length > 0,
            bufferedPacketCount: remaining.length,
            uplinkChannel: 'PRIMARY',
          },
          logs: [
            createLog('BLOCKCHAIN', 'SYNC', `Tampondaki paket zincire işlendi (${index}/${buffered.length})`, packet.sequenceNo),
            createLog('INFO', 'DB', `Tampon paketi veritabanına kaydedildi`, packet.sequenceNo),
            ...current.logs,
          ].slice(0, maxLogs),
        };
      });
    }, 420);
  }, [commitPacket, commitSnapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void generatePacket();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [generatePacket]);

  const createCriticalProof = useCallback(
    async (eventType = 'CRITICAL_PROOF', severity: TelemetrySeverity = 'CRITICAL') => {
      const latest = snapshotRef.current.latestPacket;
      if (!latest) {
        pushLogs(createLog('WARNING', 'PROOF', 'Kritik kanıt için henüz telemetri paketi yok'));
        return;
      }

      const timestamp = isoNow();
      const proofSeed = {
        proofId: `proof-${latest.sequenceNo}-${Date.now()}`,
        flightId,
        vehicleId,
        eventType,
        severity,
        timestamp,
        sequenceStart: Math.max(1, latest.sequenceNo - 4),
        sequenceEnd: latest.sequenceNo,
        lastKnownPosition: {
          latitude: latest.gps.latitude,
          longitude: latest.gps.longitude,
          gpsAltitude: latest.gps.gpsAltitude,
        },
        previousPacketHash: latest.integrityState.payloadHash,
      };
      const payloadHash = await sha256(JSON.stringify(proofSeed));
      const proofBlockNo = physicsRef.current.blockNo + 1;
      const proof: CriticalProofPacket = {
        ...proofSeed,
        payloadHash,
        previousPacketHash: latest.integrityState.payloadHash,
        signatureStatus: 'SIGNED',
        uplinkChannel: 'SATCOM',
        blockchainStatus: 'COMMITTED',
        blockNo: proofBlockNo,
      };

      physicsRef.current.blockNo = proofBlockNo;
      commitSnapshot((state) => ({
        ...state,
        connectionState: {
          status: 'SATCOM_FALLBACK',
          signalQuality: 68,
          buffered: state.bufferPackets.length > 0,
          bufferedPacketCount: state.bufferPackets.length,
          uplinkChannel: 'SATCOM',
        },
        criticalProofPackets: [...state.criticalProofPackets, proof].slice(-100),
        blockchainRecords: [
          ...state.blockchainRecords,
          {
            txId: createTxId(latest.sequenceNo, payloadHash),
            blockNo: physicsRef.current.blockNo,
            sequenceNo: latest.sequenceNo,
            payloadHash,
            previousPacketHash: latest.integrityState.payloadHash,
            committedAt: timestamp,
          },
        ].slice(-maxPackets),
        logs: [
          createLog('CRITICAL', 'ALERT', 'Kritik olay algılandı', latest.sequenceNo),
          createLog('SECURITY', 'PROOF', 'Kritik kanıt paketi oluşturuldu', latest.sequenceNo),
          createLog('CONNECTION', 'SATCOM', 'Fallback kanal üzerinden kanıt iletildi', latest.sequenceNo),
          createLog('BLOCKCHAIN', 'CHAIN', "Kritik kanıt hash'i blokzincire kaydedildi", latest.sequenceNo),
          ...state.logs,
        ].slice(0, maxLogs),
      }));

      window.setTimeout(() => {
        commitSnapshot((state) => ({
          ...state,
          connectionState:
            state.connectionState.status === 'SATCOM_FALLBACK'
              ? {
                  status: state.bufferPackets.length > 0 ? 'BUFFERING' : 'ONLINE',
                  signalQuality: state.bufferPackets.length > 0 ? 0 : 91,
                  buffered: state.bufferPackets.length > 0,
                  bufferedPacketCount: state.bufferPackets.length,
                  uplinkChannel: state.bufferPackets.length > 0 ? 'LOCAL_BUFFER' : 'PRIMARY',
                }
              : state.connectionState,
        }));
      }, 1800);
    },
    [commitSnapshot, pushLogs],
  );

  const value = useMemo<FlightSimulationContextValue>(
    () => ({
      ...snapshot,
      startSimulation: () => {
        commitSnapshot((state) => ({ ...state, running: true, logs: [createLog('INFO', 'CORE', 'Simülasyon devam ettirildi'), ...state.logs].slice(0, maxLogs) }));
      },
      pauseSimulation: () => {
        commitSnapshot((state) => ({ ...state, running: false, logs: [createLog('WARNING', 'CORE', 'Simülasyon duraklatıldı'), ...state.logs].slice(0, maxLogs) }));
      },
      resetSimulation: () => {
        physicsRef.current = createInitialPhysics();
        commitSnapshot(() => ({
          running: true,
          flightId,
          vehicleId,
          latestPacket: null,
          connectionState: initialConnectionState,
          dbPackets: [],
          blockchainRecords: [],
          bufferPackets: [],
          criticalProofPackets: [],
          logs: [createLog('INFO', 'CORE', 'Simülasyon sıfırlandı'), createLog('CONNECTION', 'OPS-LINK', 'Birincil telemetri kanalı çevrimiçi')],
        }));
      },
      triggerConnectionLoss: () => {
        commitSnapshot((state) => ({
          ...state,
          connectionState: {
            status: 'OFFLINE',
            signalQuality: 0,
            buffered: true,
            bufferedPacketCount: state.bufferPackets.length,
            uplinkChannel: 'LOCAL_BUFFER',
          },
          logs: [createLog('CONNECTION', 'OPS-LINK', 'Bağlantı kaybı algılandı, yerel tampon aktif'), ...state.logs].slice(0, maxLogs),
        }));
      },
      restoreConnection: syncBufferedPackets,
      triggerAltitudeDrop: () => {
        physicsRef.current.altitudeDropUntil = physicsRef.current.sequenceNo + 6;
        void createCriticalProof('ALTITUDE_DROP', 'CRITICAL');
      },
      triggerPitotAnomaly: () => {
        physicsRef.current.pitotAnomalyUntil = physicsRef.current.sequenceNo + 8;
        pushLogs(createLog('WARNING', 'PITOT', 'Pitot anomalisi tetiklendi'));
      },
      triggerGpsSpoofing: () => {
        physicsRef.current.gpsSpoofingUntil = physicsRef.current.sequenceNo + 8;
        void createCriticalProof('GPS_SPOOFING', 'CRITICAL');
      },
      triggerMotorOverheat: () => {
        physicsRef.current.motorOverheatUntil = physicsRef.current.sequenceNo + 8;
        void createCriticalProof('MOTOR_OVERHEAT', 'CRITICAL');
      },
      tamperLatestPacket: () => {
        commitSnapshot((state) => {
          if (!state.latestPacket) return state;
          const tamperedPacket: TelemetryPacket = {
            ...state.latestPacket,
            ecu: { ...state.latestPacket.ecu, throttle: clamp(state.latestPacket.ecu.throttle + 19, 0, 100) },
            integrityState: {
              ...state.latestPacket.integrityState,
              signatureStatus: 'INVALID',
              verificationStatus: 'TAMPER_DETECTED',
            },
          };
          return {
            ...state,
            latestPacket: tamperedPacket,
            logs: [
              createLog('SECURITY', 'VERIFY', `Son paket üzerinde veri değişikliği algılandı`, tamperedPacket.sequenceNo),
              createLog('CRITICAL', 'VERIFY', 'Bütünlük doğrulaması: TAMPER_DETECTED', tamperedPacket.sequenceNo),
              ...state.logs,
            ].slice(0, maxLogs),
          };
        });
      },
      verifyLatestPacket: () => {
        commitSnapshot((state) => {
          if (!state.latestPacket) return state;
          const chainRecord = state.blockchainRecords.find((record) => record.sequenceNo === state.latestPacket?.sequenceNo);
          const verified = Boolean(chainRecord && chainRecord.payloadHash === state.latestPacket.integrityState.payloadHash && state.latestPacket.integrityState.signatureStatus === 'SIGNED');
          return {
            ...state,
            latestPacket: {
              ...state.latestPacket,
              integrityState: {
                ...state.latestPacket.integrityState,
                verificationStatus: verified ? 'VERIFIED' : 'TAMPER_DETECTED',
              },
            },
            logs: [
              createLog(
                verified ? 'SECURITY' : 'CRITICAL',
                'VERIFY',
                verified ? 'Son paket zincir kaydı ile doğrulandı' : 'Son paket zincir kaydı ile eşleşmedi',
                state.latestPacket.sequenceNo,
              ),
              ...state.logs,
            ].slice(0, maxLogs),
          };
        });
      },
      triggerCriticalProofPacket: () => {
        void createCriticalProof('MANUAL_CRITICAL_PROOF', 'CRITICAL');
      },
    }),
    [createCriticalProof, commitSnapshot, pushLogs, snapshot, syncBufferedPackets],
  );

  return <FlightSimulationContext.Provider value={value}>{children}</FlightSimulationContext.Provider>;
}

export function useFlightSimulation() {
  const context = useContext(FlightSimulationContext);
  if (!context) {
    throw new Error('useFlightSimulation must be used within FlightSimulationProvider');
  }

  return context;
}
