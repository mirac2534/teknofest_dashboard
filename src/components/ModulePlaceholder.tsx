import { Box, Card, CardContent, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

type ModulePlaceholderProps = {
  title: string;
  description: string;
  status?: string;
};

export function ModulePlaceholder({ title, description, status = 'Hazırlık aşaması' }: ModulePlaceholderProps) {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box>
        <Chip icon={<VerifiedUserIcon />} label={status} color="primary" variant="outlined" sx={{ mb: 1.5 }} />
        <Typography variant="h4" component="h2">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760, lineHeight: 1.7 }}>
          {description}
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.76 : 1),
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '8px',
                color: theme.palette.warning.main,
                bgcolor: alpha(theme.palette.warning.main, 0.12),
              }}
            >
              <ConstructionIcon />
            </Box>
            <Box>
              <Typography variant="h6">Modül iskeleti hazır</Typography>
              <Typography color="text.secondary">
                Bu modül bir sonraki geliştirme adımında doldurulacaktır.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
