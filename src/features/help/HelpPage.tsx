import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HubIcon from '@mui/icons-material/Hub';
import MemoryIcon from '@mui/icons-material/Memory';
import SensorsIcon from '@mui/icons-material/Sensors';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { SvgIconComponent } from '@mui/icons-material';

const sensorList = [
  'IMU',
  'Barometrik Altimetre',
  'Pitot Tüpü + Hava Hızı Sensörü',
  'GPS Modülü',
  'ECU',
  'Uçuş Kontrol Sistemleri',
  'Kapı / Işık / İkaz Sistemleri',
];

const faqs = [
  {
    question: 'Bu sistem gerçek uçuş verisi mi kullanıyor?',
    answer: 'Hayır. Demo, tarayıcı içinde üretilen fiziksel olarak tutarlı sentetik uçuş verisini kullanır.',
  },
  {
    question: 'Blokzincire ham veri mi yazılıyor?',
    answer: 'Hayır. Tasarımda ham telemetri off-chain DB tarafında tutulur; blokzincire hash ve doğrulama metadatası yazılır.',
  },
  {
    question: 'İnternet bağlantısı koparsa ne olur?',
    answer: 'Paket üretimi devam eder, paketler local buffer içinde bekler. Bağlantı dönünce batch sync akışıyla DB ve zincir kayıtları tamamlanır.',
  },
  {
    question: 'Tamper Detected ne anlama gelir?',
    answer: 'DB paketi tekrar hashlendiğinde zincirdeki hash ile eşleşmiyorsa veri değişmiş kabul edilir ve durum TAMPER DETECTED olur.',
  },
  {
    question: 'Bu demo gerçek Hyperledger Fabric ağına bağlı mı?',
    answer: 'Hayır. Bu sürümde backend veya gerçek blockchain ağı yoktur; ledger davranışı tarayıcı belleğinde simüle edilir.',
  },
  {
    question: 'Neden hash + metadata zincire yazılıyor?',
    answer: 'Böylece büyük ham veriyi zincire koymadan, verinin daha sonra değiştirilmediği kriptografik olarak kanıtlanabilir.',
  },
  {
    question: 'SATCOM fallback burada gerçek mi yoksa konsept mi?',
    answer: 'Konsepttir. Kritik kanıt paketi, gerçek sistem tasarımında düşük bant genişlikli yedek kanal üzerinden iletilebilecek özet kanıtı temsil eder.',
  },
];

function HelpCard({ title, icon: Icon, children }: { title: string; icon: SvgIconComponent; children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.76 : 1) }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.4 }}>
          <Icon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {children}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function HelpPage() {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.74 : 0.98) }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4" component="h2">
                Yardım
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8, maxWidth: 860 }}>
                Synapse Dijital Kara Kutu Sistemi için sunum odaklı açıklamalar, demo akışı ve sık sorulan sorular.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label="Yerel demo" color="primary" variant="outlined" />
              <Chip label="Backend yok" variant="outlined" />
              <Chip label="Blockchain simülasyonu" color="success" variant="outlined" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <HelpCard title="Sistem Nasıl Çalışır?" icon={AltRouteIcon}>
            Sensörler uçuş verisini üretir, paketleme katmanı bu veriyi telemetri paketine dönüştürür. Paket SHA-256 hash ile özetlenir; ham paket off-chain DB tarafına,
            hash kaydı ise blokzincir ledger simülasyonuna yazılır. Doğrulama aşamasında DB paketi tekrar hashlenir ve zincirdeki kayıtla karşılaştırılır.
          </HelpCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <HelpCard title="Hash Doğrulaması Nedir?" icon={FactCheckIcon}>
            Ham telemetri paketinin deterministik özeti alınır ve bu hash blokzincire commit edilir. Daha sonra aynı DB paketi yeniden hashlenir. Hashler eşleşirse VERIFIED,
            eşleşmezse TAMPER DETECTED sonucu gösterilir.
          </HelpCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <HelpCard title="Buffer Nedir?" icon={StorageIcon}>
            Bağlantı kesildiğinde paket üretimi durmaz. Paketler local buffer içinde bekletilir, blockchain durumu PENDING kalır. Bağlantı geri geldiğinde batch sync başlar ve
            bekleyen paketler sırayla DB ve blokzincir kayıtlarına işlenir.
          </HelpCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <HelpCard title="Kritik Kanıt Paketi Nedir?" icon={WarningAmberIcon}>
            Kritik olay sırasında olay tipi, zaman, sıra aralığı, son bilinen konum, hash ve imza durumu içeren küçük bir kanıt paketi oluşturulur. Bu demo paketi konsept SATCOM
            fallback kanalıyla iletilmiş gibi gösterir; ham veri daha sonra normal sync ile tamamlanabilir.
          </HelpCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <HelpCard title="Telemetri Verileri Nasıl Üretiliyor?" icon={HubIcon}>
            Veriler tarayıcı içinde çalışan fizik tabanlı sentetik uçuş motorundan gelir. PREFLIGHT, TAKEOFF, CLIMB, CRUISE, DESCENT, LANDING ve POSTFLIGHT fazlarına göre irtifa,
            hız, motor, batarya, flap ve iniş takımı davranışı birlikte değişir. Amaç rastgele sayı göstermek değil, mantıksal olarak tutarlı bir uçuş akışı sunmaktır.
          </HelpCard>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.76) }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                <SensorsIcon color="primary" />
                <Typography variant="h6">Kullanılan Sensörler</Typography>
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {sensorList.map((sensor) => (
                  <Chip key={sensor} icon={<MemoryIcon />} label={sensor} variant="outlined" />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
            <HelpOutlineIcon color="primary" />
            <Typography variant="h6">Sıkça Sorulan Sorular</Typography>
          </Stack>
          <Stack spacing={1}>
            {faqs.map((faq) => (
              <Accordion key={faq.question} disableGutters elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.62), '&::before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
