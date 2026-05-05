import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../auth/AuthContext';
import { useThemeMode } from '../theme/SynapseThemeProvider';

function formatDateTime(value?: string) {
  if (!value) return 'Henüz yok';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 820, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function PermissionItem({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center">
      <CheckCircleIcon color="success" fontSize="small" />
      <Typography variant="body2">{text}</Typography>
    </Stack>
  );
}

export function ProfilePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { mode } = useThemeMode();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.74 : 0.98) }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 76,
                  height: 76,
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                  color: theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.36)}`,
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h2">
                  Synapse Operatörü
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Dijital Kara Kutu İzleme Paneli demo oturumu
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.4 }}>
                  <Chip icon={<BadgeIcon />} label="Operasyon İzleme Yetkilisi" color="primary" variant="outlined" />
                  <Chip label="Oturum aktif" color="success" variant="outlined" />
                  <Chip label={`Tema: ${mode === 'dark' ? 'Dark' : 'Light'}`} variant="outlined" />
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button startIcon={<RefreshIcon />} variant="outlined">
                Profil'i Yenile
              </Button>
              <Button startIcon={<LogoutIcon />} variant="contained" color="primary" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                <SettingsSuggestIcon color="primary" />
                <Typography variant="h6">Profil Bilgileri</Typography>
              </Stack>
              <InfoRow label="Ad Soyad" value="Synapse Operatörü" />
              <InfoRow label="Kullanıcı Adı" value={session?.username ?? 'Synapse'} />
              <InfoRow label="Rol" value="Operasyon İzleme Yetkilisi" />
              <InfoRow label="E-posta" value="operator@synapse.local" />
              <InfoRow label="Takım" value="Synapse" />
              <InfoRow label="Sistem" value="Dijital Kara Kutu İzleme Paneli" />
              <InfoRow label="Son Giriş Zamanı" value={formatDateTime(session?.authenticatedAt)} />
              <InfoRow label="Aktif Tema" value={mode === 'dark' ? 'Dark' : 'Light'} />
              <InfoRow label="Oturum Durumu" value="Aktif" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.7 }}>
                <AdminPanelSettingsIcon color="primary" />
                <Typography variant="h6">Kullanıcı Yetkileri</Typography>
              </Stack>
              <Stack spacing={1.35}>
                <PermissionItem text="Canlı uçuş izleme" />
                <PermissionItem text="Telemetri kayıtlarını görüntüleme" />
                <PermissionItem text="Operasyon senaryosu tetikleme" />
                <PermissionItem text="Paket doğrulama" />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.07), border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VisibilityIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Yetkiler demo kapsamında yerel olarak uygulanır.
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.78) }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.7 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Güvenlik</Typography>
              </Stack>
              <Stack spacing={1.2}>
                <Chip icon={<CheckCircleIcon />} label="Demo kullanıcı" color="success" variant="outlined" />
                <Chip icon={<LockIcon />} label="Local session" color="primary" variant="outlined" />
                <Chip label="Backend bağımlılığı yok" variant="outlined" />
              </Stack>
              <Button fullWidth startIcon={<LockIcon />} variant="outlined" sx={{ mt: 2.2 }}>
                Şifre Değiştir
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Bu işlem demo amaçlıdır; gerçek parola servisine bağlı değildir.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
