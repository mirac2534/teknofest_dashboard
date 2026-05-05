export type FlightPhase = 'PREFLIGHT' | 'TAKEOFF' | 'CLIMB' | 'CRUISE' | 'DESCENT' | 'LANDING' | 'POSTFLIGHT';

export type GpsStatus = 'LOCKED' | 'DEGRADED' | 'SPOOFING_SUSPECTED' | 'LOST';
export type PitotStatus = 'NORMAL' | 'BLOCKED' | 'ANOMALY';
export type EcuStatus = 'NORMAL' | 'WARNING' | 'OVERHEAT';
export type LandingGearStatus = 'UP' | 'DOWN' | 'TRANSIT';
export type BrakeStatus = 'RELEASED' | 'ARMED' | 'ACTIVE';
export type DoorStatus = 'CLOSED' | 'OPEN';

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'BUFFERING' | 'SYNCING' | 'SATCOM_FALLBACK';
export type UplinkChannel = 'PRIMARY' | 'SATCOM' | 'LOCAL_BUFFER';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'TAMPER_DETECTED';
export type BlockchainStatus = 'PENDING' | 'COMMITTED' | 'FAILED';
export type SignatureStatus = 'SIGNED' | 'UNSIGNED' | 'INVALID';
export type TelemetrySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface GPS {
  latitude: number;
  longitude: number;
  gpsAltitude: number;
  groundSpeed: number;
  heading: number;
  satelliteCount: number;
  gpsStatus: GpsStatus;
}

export interface Barometer {
  barometricAltitude: number;
  verticalSpeed: number;
  pressure: number;
}

export interface Pitot {
  indicatedAirspeed: number;
  trueAirspeed: number;
  pitotStatus: PitotStatus;
}

export interface IMU {
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  roll: number;
  pitch: number;
  yaw: number;
}

export interface ECU {
  motorRpm: number;
  motorTemperature: number;
  batteryLevel: number;
  batteryVoltage: number;
  motorCurrent: number;
  throttle: number;
  ecuStatus: EcuStatus;
}

export interface FlightControl {
  aileronPosition: number;
  elevatorPosition: number;
  rudderPosition: number;
  flapPosition: number;
  landingGearStatus: LandingGearStatus;
  brakeStatus: BrakeStatus;
}

export interface WarningSystem {
  doorStatus: DoorStatus;
  warningLight: boolean;
  masterCaution: boolean;
  alarmCode: string | null;
}

export interface ConnectionState {
  status: ConnectionStatus;
  signalQuality: number;
  buffered: boolean;
  bufferedPacketCount: number;
  uplinkChannel: UplinkChannel;
}

export interface IntegrityState {
  payloadHash: string;
  previousPacketHash: string;
  signatureStatus: SignatureStatus;
  verificationStatus: VerificationStatus;
  blockchainStatus: BlockchainStatus;
  txId: string | null;
  blockNo: number | null;
}

export interface TelemetryEvent {
  isCritical: boolean;
  eventType: string;
  severity: TelemetrySeverity;
}

export interface TelemetryPacket {
  flightId: string;
  vehicleId: string;
  sequenceNo: number;
  timestamp: string;
  flightPhase: FlightPhase;
  gps: GPS;
  barometer: Barometer;
  pitot: Pitot;
  imu: IMU;
  ecu: ECU;
  flightControl: FlightControl;
  warningSystem: WarningSystem;
  connectionState: ConnectionState;
  integrityState: IntegrityState;
  events: TelemetryEvent[];
}

export interface BlockchainRecord {
  txId: string;
  blockNo: number;
  sequenceNo: number;
  payloadHash: string;
  previousPacketHash: string;
  committedAt: string;
}

export interface CriticalProofPacket {
  proofId: string;
  flightId: string;
  vehicleId: string;
  eventType: string;
  severity: TelemetrySeverity;
  timestamp: string;
  sequenceStart: number;
  sequenceEnd: number;
  lastKnownPosition: Pick<GPS, 'latitude' | 'longitude' | 'gpsAltitude'>;
  payloadHash: string;
  previousPacketHash: string;
  signatureStatus: SignatureStatus;
  uplinkChannel: 'SATCOM';
  blockchainStatus: BlockchainStatus;
  blockNo: number | null;
}
