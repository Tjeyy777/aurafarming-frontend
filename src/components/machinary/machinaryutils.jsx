import React from 'react';
import BuildIcon from '@mui/icons-material/Build';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ConstructionIcon from '@mui/icons-material/Construction';
import EngineeringIcon from '@mui/icons-material/Engineering';

// ─── Service status helpers ──────────────────────────────────────────────────

export const getServiceStatus = (machine) => {
  if (!machine.serviceReminderEnabled) return 'disabled';
  const remaining = machine.nextServiceDueAt - machine.currentMeterReading;
  if (remaining > 25) return 'healthy';
  if (remaining > 0) return 'due_soon';
  if (remaining === 0) return 'service_due';
  return 'overdue';
};

export const getRemainingHours = (machine) =>
  machine.nextServiceDueAt - machine.currentMeterReading;

export const formatMachineType = (type) =>
  ({
    excavator: 'Excavator',
    air_compressor: 'Air Compressor',
    loader: 'Loader',
    drill_machine: 'Drill Machine',
    jackhammer: 'Jackhammer',
    other: 'Other',
  }[type] || type);

export const formatStatus = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// ─── Config objects ──────────────────────────────────────────────────────────

export const SERVICE_STATUS_CONFIG = {
  healthy:     { label: 'Healthy',     color: 'success' },
  due_soon:    { label: 'Due Soon',    color: 'warning' },
  service_due: { label: 'Service Due', color: 'warning' },
  overdue:     { label: 'Overdue',     color: 'error' },
  disabled:    { label: 'Disabled',    color: 'default' },
};

export const MACHINE_STATUS_CONFIG = {
  active:      { label: 'Active',      color: 'success' },
  inactive:    { label: 'Inactive',    color: 'default' },
  maintenance: { label: 'Maintenance', color: 'warning' },
};

export const MACHINE_TYPES = [
  { value: 'excavator',     label: 'Excavator' },
  { value: 'air_compressor',label: 'Air Compressor' },
  { value: 'loader',        label: 'Loader' },
  { value: 'drill_machine', label: 'Drill Machine' },
  { value: 'jackhammer',    label: 'Jackhammer' },
  { value: 'other',         label: 'Other' },
];


export const FUEL_TYPES = [
  { value: 'diesel',   label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'none',     label: 'None' },
];

export const STATUS_TYPES = [
  { value: 'active',      label: 'Active' },
  { value: 'inactive',    label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const getServiceProgressColor = (status) =>
  ({ healthy: '#10b981', due_soon: '#f59e0b', service_due: '#f97316', overdue: '#ef4444' }[status] || '#6b7280');

/**
 * Returns an appropriate MUI icon component based on the machine type.
 */
export function getMachineIcon(type = '') {
  switch (type.toLowerCase()) {
    case 'excavator':
    case 'loader':
      return <AgricultureIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />;
    case 'drill_machine':
    case 'air_compressor':
      return <PrecisionManufacturingIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />;
    case 'jackhammer':
      return <ConstructionIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />;
    case 'other':
    default:
      return <EngineeringIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />;
  }
}