import { Chip } from '@mui/material';
import { SERVICE_STATUS_CONFIG, MACHINE_STATUS_CONFIG } from './machinaryutils';

export default function StatusChip({ status, type = 'service', size = 'small' }) {
  const cfg = type === 'machine' ? MACHINE_STATUS_CONFIG[status] : SERVICE_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size={size}
      sx={{ fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.05em', height: 20 }}
    />
  );
}