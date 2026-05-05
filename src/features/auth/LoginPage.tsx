import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAuth } from './AuthContext';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const logoUrl = new URL('../../../Synapse_logo.png', import.meta.url).href;

export function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Lütfen kullanıcı adı ve şifre alanlarını doldurun.');
      return;
    }

    try {
      login(username, password);
      navigate(redirectTo, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Giriş işlemi tamamlanamadı.');
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 18% 18%, rgba(56, 189, 248, 0.22), transparent 28%), linear-gradient(135deg, #050b14 0%, #07111f 52%, #0d1b2e 100%)'
            : 'linear-gradient(135deg, #e6f0f8 0%, #f7fafc 52%, #d9e8f2 100%)',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateRows: '1fr auto 1fr',
          alignItems: 'center',
          py: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ alignSelf: 'start', justifySelf: 'center' }}>
          <Box
            sx={{
              width: 78,
              height: 78,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '10px',
              bgcolor: '#ffffff',
              border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
              boxShadow: theme.palette.mode === 'dark' ? '0 8px 22px rgba(0,0,0,0.22)' : '0 8px 18px rgba(15,23,42,0.08)',
              p: 1,
            }}
          >
            <Box component="img" src={logoUrl} alt="Synapse" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
        </Box>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box>
              <Typography variant="h3" component="h1" sx={{ maxWidth: 760, fontSize: { xs: 34, md: 50 }, lineHeight: 1.04 }}>
                Synapse Dijital Kara Kutu Sistemi
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1.8, maxWidth: 480, mx: 'auto', lineHeight: 1.5 }}>
                Uçuş Verisi İzleme ve Bütünlük Doğrulama Paneli
              </Typography>
            </Box>

            <Paper
              elevation={theme.palette.mode === 'dark' ? 0 : 8}
              sx={{
                width: '100%',
                maxWidth: 480,
                p: { xs: 3, sm: 4 },
                border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.78 : 0.94),
                backdropFilter: 'blur(20px)',
              }}
            >
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.4}>
                  <FlightIcon color="primary" />
                  <Typography variant="h5">Güvenli Operatör Girişi</Typography>
                </Stack>

                <Divider />

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2.2}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                      label="Kullanıcı adı"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      fullWidth
                    />
                    <TextField
                      label="Şifre"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      fullWidth
                    />
                    <Button type="submit" variant="contained" size="large" startIcon={<ShieldOutlinedIcon />}>
                      Panele Giriş Yap
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </motion.div>

        <Box />
      </Container>
    </Box>
  );
}
