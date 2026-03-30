import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Button,
  Divider,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

import StatusChip from './Statuschip';
import {
  getServiceStatus,
  formatMachineType,
  getRemainingHours,
  getServiceProgressColor,
  formatStatus,
  getMachineIcon
} from './machinaryutils';

export default function MachineCard({
  machine,
  onView,
  onAddLog,
  onServiceDone,
  onEdit,
  onDelete,
}) {
  const theme = useTheme();

  if (!machine) return null;

  const serviceStatus = getServiceStatus(machine);
  const remainingHrs = machine.serviceReminderEnabled 
    ? getRemainingHours(machine) 
    : null;
    
  const progressColor = machine.serviceReminderEnabled 
    ? getServiceProgressColor(serviceStatus) 
    : theme.palette.text.disabled;

  // Calculate progress percentage for a visual service bar (assuming 250 interval, cap at 100%)
  const serviceInterval = machine.serviceIntervalHours || 250;
  const hoursSinceService = machine.currentMeterReading - (machine.lastServiceMeter || (machine.currentMeterReading - serviceInterval));
  const progressPercent = Math.min(100, Math.max(0, (hoursSinceService / serviceInterval) * 100));

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: serviceStatus === 'overdue' ? alpha(theme.palette.error.main, 0.03) 
               : serviceStatus === 'service_due' ? alpha(theme.palette.warning.main, 0.03) 
               : 'background.paper',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: `0 8px 24px -4px ${alpha(theme.palette.primary.main, 0.2)}`,
          transform: 'translateY(-4px)'
        },
      }}
    >
      <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header: Name, Code, and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ letterSpacing: '-0.01em', mb: 0.5 }}>
              {machine.machineName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600 }}>
                {machine.machineCode}
              </Typography>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <Box component="span" sx={{ mx: 0.5 }}>•</Box>
                {getMachineIcon(machine.machineType)}
                {formatMachineType(machine.machineType)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => onView?.(machine._id)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Machine">
              <IconButton size="small" onClick={() => onEdit?.(machine)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Machine">
              <IconButton size="small" color="error" onClick={() => onDelete?.(machine)}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
          <StatusChip status={machine.status} type="machine" />
          <StatusChip status={serviceStatus} type="service" />
          <Typography variant="caption" sx={{ 
            bgcolor: machine.ownershipType === 'owned' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.info.main, 0.1),
            color: machine.ownershipType === 'owned' ? 'success.main' : 'info.main',
            px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.62rem'
          }}>
            {machine.ownershipType}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2.5, borderStyle: 'dashed' }} />

        {/* Main Stats: Meter and Service Info with Circular Gauge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 500 }}>
                <SpeedOutlinedIcon sx={{ fontSize: 16 }} /> CURRENT METER
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {(machine.currentMeterReading || 0).toLocaleString()} <Typography component="span" variant="caption" color="text.secondary">hrs</Typography>
              </Typography>
            </Box>

            {machine.serviceReminderEnabled && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 500 }}>
                  <BuildCircleOutlinedIcon sx={{ fontSize: 16 }} /> NEXT SERVICE
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {(machine.nextServiceDueAt || 0).toLocaleString()} <Typography component="span" variant="caption" color="text.secondary">hrs</Typography>
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Circular Progress Gauge */}
          {machine.serviceReminderEnabled && (
            <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
              <Tooltip title={remainingHrs > 0 ? `${remainingHrs} hrs remaining` : `Overdue by ${Math.abs(remainingHrs)} hrs`} arrow placement="top">
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={76}
                    thickness={4.5}
                    sx={{ color: alpha(progressColor, 0.15), position: 'absolute' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={progressPercent}
                    size={76}
                    thickness={4.5}
                    sx={{ color: progressColor, strokeLinecap: 'round' }}
                  />
                  <Box
                    sx={{
                      top: 0, left: 0, bottom: 0, right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: progressColor, lineHeight: 1 }}>
                      {Math.round(progressPercent)}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                      Used
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Box>
          )}
        </Box>
      </CardContent>

      <Divider sx={{ borderStyle: 'solid' }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', p: 1, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Button 
          fullWidth 
          variant="text" 
          size="small"
          startIcon={<CalendarTodayOutlinedIcon />}
          onClick={() => onAddLog?.(machine)}
          sx={{ fontWeight: 600 }}
        >
          Daily Log
        </Button>
        {machine.serviceReminderEnabled && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Button 
              fullWidth 
              variant="text" 
              size="small"
              color={serviceStatus === 'service_due' || serviceStatus === 'overdue' ? 'warning' : 'primary'}
              startIcon={<VerifiedOutlinedIcon />}
              onClick={() => onServiceDone?.(machine)}
              sx={{ fontWeight: 600 }}
            >
              Mark Serviced
            </Button>
          </>
        )}
      </Box>
    </Card>
  );
}