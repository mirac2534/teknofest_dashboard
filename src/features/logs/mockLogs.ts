import type { LiveLog } from '../../types/logs';

export const mockLogs: LiveLog[] = [
  {
    id: 'log-001',
    timestamp: '11:58:04',
    severity: 'INFO',
    source: 'CORE',
    message: 'Sistem başlatıldı',
  },
  {
    id: 'log-002',
    timestamp: '11:58:08',
    severity: 'SECURITY',
    source: 'AUTH',
    message: 'Kullanıcı oturumu doğrulandı',
  },
  {
    id: 'log-003',
    timestamp: '11:58:12',
    severity: 'CONNECTION',
    source: 'OPS-LINK',
    message: 'Yerel demo bağlantısı hazır',
  },
  {
    id: 'log-004',
    timestamp: '11:58:17',
    severity: 'BLOCKCHAIN',
    source: 'CHAIN',
    message: 'Bütünlük doğrulama kuyruğu beklemede',
  },
  {
    id: 'log-005',
    timestamp: '11:58:21',
    severity: 'TELEMETRY',
    source: 'SENSOR-BUS',
    message: 'Telemetri ön izleme kanalı dinleniyor',
  },
  {
    id: 'log-006',
    timestamp: '11:58:26',
    severity: 'WARNING',
    source: 'OPS',
    message: 'Operasyon paneli yüklendi',
  },
  {
    id: 'log-007',
    timestamp: '11:58:31',
    severity: 'CRITICAL',
    source: 'ALERT',
    message: 'Kritik alarm simülasyonu pasif durumda',
  },
];
