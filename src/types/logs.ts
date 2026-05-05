export type LogSeverity =
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL'
  | 'SECURITY'
  | 'BLOCKCHAIN'
  | 'CONNECTION'
  | 'TELEMETRY';

export type LiveLog = {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  source: string;
  message: string;
  relatedSequenceNo?: number;
};

export type SystemLog = LiveLog;
