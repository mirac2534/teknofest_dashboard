import { Card, CardContent, Grid, Stack, Typography, alpha, useTheme } from '@mui/material';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import EngineeringIcon from '@mui/icons-material/Engineering';
import HubIcon from '@mui/icons-material/Hub';
import PublicIcon from '@mui/icons-material/Public';
import ShieldIcon from '@mui/icons-material/Shield';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { SvgIconComponent } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';
import { useFlightSimulation } from '../simulation/FlightSimulationContext';

type KpiTone = 'primary' | 'success' | 'warning' | 'info' | 'neutral';

function formatNumber(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value);
}

function toneColor(theme: Theme, tone: KpiTone) {
  const colors: Record<KpiTone, string> = {
    primary: theme.palette.primary.main,
    success: theme.palette.secondary.main,
    warning: theme.palette.warning.main,
    info: '#38bdf8',
    neutral: theme.palette.text.secondary,
  };
  return colors[tone];
}

function CorporateKpiCard({
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
  tone?: KpiTone;
}) {
  const theme = useTheme();
  const color = toneColor(theme, tone);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.78 : 1),
        transition: 'transform 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: alpha(color, 0.46),
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.8} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ lineHeight: 1, fontSize: { xs: 34, md: 40 } }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {detail}
            </Typography>
          </Stack>
          <Stack
            sx={{
              width: 48,
              height: 48,
              borderRadius: '8px',
              display: 'grid',
              placeItems: 'center',
              color,
              bgcolor: alpha(color, 0.12),
              border: `1px solid ${alpha(color, 0.28)}`,
              flex: '0 0 auto',
            }}
          >
            <Icon />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { blockchainRecords, bufferPackets, criticalProofPackets } = useFlightSimulation();

  const activeFlights = 7;
  const registeredCompanies = 4;
  const totalAircraft = 12;

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Toplam Hava Aracı" value={formatNumber(totalAircraft)} detail="Filoda kayıtlı uçuş platformu" icon={AirplanemodeActiveIcon} tone="info" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Kayıtlı Şirket" value={formatNumber(registeredCompanies)} detail="Panele tanımlı operasyon kurumu" icon={ApartmentIcon} tone="primary" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Aktif Uçuş" value={formatNumber(activeFlights)} detail="Bugün izlenen canlı uçuş" icon={TimelineIcon} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Operasyon Bölgesi" value="3" detail="Marmara, İç Anadolu, Ege" icon={PublicIcon} tone="neutral" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Blokzincir Kayıtları" value={formatNumber(blockchainRecords.length)} detail="Demo ledger üzerinde commit edilen hash" icon={HubIcon} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Bekleyen Buffer" value={formatNumber(bufferPackets.length)} detail="Yerel tamponda bekleyen paket" icon={CloudDoneIcon} tone={bufferPackets.length > 0 ? 'warning' : 'success'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Kritik Kanıt" value={formatNumber(criticalProofPackets.length)} detail="Fallback kanıt paketi sayısı" icon={ShieldIcon} tone={criticalProofPackets.length > 0 ? 'warning' : 'neutral'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Uyumluluk Skoru" value="99.2%" detail="Demo bütünlük ve kayıt standardı" icon={AssignmentTurnedInIcon} tone="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Bakımda Araç" value="2" detail="Planlı bakım sürecindeki platform" icon={EngineeringIcon} tone="warning" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <CorporateKpiCard title="Yetkili Operatör" value="8" detail="Aktif rol tanımı bulunan kullanıcı" icon={BusinessCenterIcon} tone="primary" />
        </Grid>
      </Grid>
    </Stack>
  );
}
