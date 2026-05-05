import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
<<<<<<< HEAD
=======
  Drawer,
>>>>>>> 87a5718b8febfe1f3544715ec200e79ad6ef6915
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
<<<<<<< HEAD
  Paper,
=======
>>>>>>> 87a5718b8febfe1f3544715ec200e79ad6ef6915
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { appRoutes, getRouteByPath } from '../app/routes';
import { useAuth } from '../features/auth/AuthContext';
import { useThemeMode } from '../features/theme/SynapseThemeProvider';
<<<<<<< HEAD

const drawerWidth = 260;
const collapsedWidth = 74;
const logoUrl = new URL('../../Synapse_logo.png', import.meta.url).href;
=======
import { LiveLogConsole } from '../features/logs/LiveLogConsole';

const drawerWidth = 260;
>>>>>>> 87a5718b8febfe1f3544715ec200e79ad6ef6915

export function AuthLayout() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, session } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
<<<<<<< HEAD
  const [menuOpen, setMenuOpen] = useState(false);
=======
>>>>>>> 87a5718b8febfe1f3544715ec200e79ad6ef6915
  const currentRoute = getRouteByPath(location.pathname);

  function handleLogout() {
    setProfileAnchor(null);
    logout();
    navigate('/login', { replace: true });
  }

<<<<<<< HEAD
  const drawerContent = (
    <Stack sx={{ height: '100%' }}>
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '8px',
              bgcolor: '#ffffff',
              border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
              p: 0.55,
            }}
          >
            <Box component="img" src={logoUrl} alt="Synapse" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
          <Box sx={{ opacity: menuOpen ? 1 : 0, transition: 'opacity 160ms ease', pointerEvents: menuOpen ? 'auto' : 'none' }}>
            <Typography variant="h6" sx={{ lineHeight: 1 }}>
              SYNAPSE
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Digital Black Box
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Divider />

      <List sx={{ px: 1.5, py: 2 }}>
        {appRoutes.map((route) => {
          const Icon = route.icon;
          const active = location.pathname === route.path;

          return (
            <ListItemButton
              key={route.path}
              selected={active}
              onClick={() => {
                navigate(route.path);
                setMenuOpen(false);
              }}
              sx={{
                mb: 0.8,
                minHeight: 48,
                borderRadius: '8px',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                },
                '&.Mui-selected:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: active ? theme.palette.primary.main : 'text.secondary' }}>
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={route.title}
                primaryTypographyProps={{ fontWeight: active ? 800 : 650, fontSize: 14 }}
                sx={{
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateX(0)' : 'translateX(-8px)',
                  transition: 'opacity 160ms ease, transform 160ms ease',
                  whiteSpace: 'nowrap',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper
        elevation={0}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: menuOpen ? drawerWidth : collapsedWidth,
          overflow: 'hidden',
          zIndex: theme.zIndex.drawer + 1,
          borderRight: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? '#081321' : '#ffffff',
          transition: 'width 180ms ease',
        }}
      >
        {drawerContent}
      </Paper>

      <Box sx={{ minWidth: 0, pl: `${collapsedWidth}px` }}>
=======
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'dark' ? '#081321' : '#ffffff',
          },
        }}
      >
        <Stack sx={{ height: '100%' }}>
          <Stack spacing={1.5} sx={{ p: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '8px',
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                }}
              >
                <AutoAwesomeMosaicIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>
                  SYNAPSE
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Digital Black Box
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Divider />

          <List sx={{ px: 1.5, py: 2 }}>
            {appRoutes.map((route) => {
              const Icon = route.icon;
              const active = location.pathname === route.path;

              return (
                <ListItemButton
                  key={route.path}
                  selected={active}
                  onClick={() => navigate(route.path)}
                  sx={{
                    mb: 0.8,
                    minHeight: 48,
                    borderRadius: '8px',
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                    },
                    '&.Mui-selected:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.18),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: active ? theme.palette.primary.main : 'text.secondary' }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={route.title}
                    primaryTypographyProps={{ fontWeight: active ? 800 : 650, fontSize: 14 }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.07 : 0.05),
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Oturum
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {session?.username ?? 'Operatör'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
>>>>>>> 87a5718b8febfe1f3544715ec200e79ad6ef6915
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.86 : 0.92),
            backdropFilter: 'blur(18px)',
          }}
        >
          <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 3 } }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h5" component="h1">
                {currentRoute.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {currentRoute.description}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={mode === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}>
                <IconButton onClick={toggleMode} color="primary" aria-label="Tema değiştir">
                  <LightbulbOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Profil menüsü">
                <IconButton
                  onClick={(event) => setProfileAnchor(event.currentTarget)}
                  color="primary"
                  aria-label="Profil menüsünü aç"
                >
                  <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
                    <AccountCircleIcon color="primary" />
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

<<<<<<< HEAD
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, pb: { xs: 3, md: 3 } }}>
=======
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, pb: 15 }}>
>>>>>>> 87a5718b8febfe1f3544715ec200e79ad6ef6915
          <Outlet />
        </Box>
      </Box>

      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate('/profile');
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profil'e Git
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Çıkış Yap
        </MenuItem>
      </Menu>

<<<<<<< HEAD
=======
      <LiveLogConsole />
>>>>>>> 87a5718b8febfe1f3544715ec200e79ad6ef6915
    </Box>
  );
}
