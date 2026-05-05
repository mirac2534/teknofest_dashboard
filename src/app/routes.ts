import DashboardIcon from '@mui/icons-material/Dashboard';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import SensorsIcon from '@mui/icons-material/Sensors';
import PersonIcon from '@mui/icons-material/Person';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import type { SvgIconComponent } from '@mui/icons-material';

export type AppRoute = {
  path: string;
  title: string;
  description: string;
  icon: SvgIconComponent;
};

export const appRoutes: AppRoute[] = [
  {
    path: '/',
    title: 'Anasayfa',
    description: 'Uçuş bütünlüğü, sistem durumu ve kritik sinyallerin genel operasyon görünümü.',
    icon: DashboardIcon,
  },
  {
    path: '/operations',
    title: 'Operasyon Akışı',
    description: 'Uçuş verisi alma, doğrulama ve zincire yazma adımlarının izleneceği modül.',
    icon: FlightTakeoffIcon,
  },
  {
    path: '/telemetry',
    title: 'Telemetri',
    description: 'İrtifa, hız, koordinat ve sensör veri akışlarının analiz edileceği alan.',
    icon: SensorsIcon,
  },
  {
    path: '/profile',
    title: 'Profil',
    description: 'Demo operatör bilgileri, oturum durumu ve erişim ayrıntıları.',
    icon: PersonIcon,
  },
  {
    path: '/help',
    title: 'Yardım',
    description: 'Sunum akışı, modül açıklamaları ve kullanım destek içeriği.',
    icon: HelpOutlineIcon,
  },
];

export function getRouteByPath(pathname: string) {
  return appRoutes.find((route) => route.path === pathname) ?? appRoutes[0];
}
