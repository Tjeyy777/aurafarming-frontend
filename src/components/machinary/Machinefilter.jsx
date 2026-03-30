import { Box, TextField, MenuItem, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { MACHINE_TYPES } from './machinaryutils';

export default function MachineFilters({
  search,        setSearch,
  ownershipFilter, setOwnershipFilter,
  typeFilter,    setTypeFilter,
  statusFilter,  setStatusFilter,
  serviceFilter, setServiceFilter,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search by name or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          select size="small" value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="All">All Ownership</MenuItem>
          <MenuItem value="owned">Owned</MenuItem>
          <MenuItem value="rented">Rented</MenuItem>
        </TextField>

        <TextField
          select size="small" value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="All">All Types</MenuItem>
          {MACHINE_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
          ))}
        </TextField>

        <TextField
          select size="small" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="All">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="maintenance">Maintenance</MenuItem>
        </TextField>

        <TextField
          select size="small" value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="All">All Service</MenuItem>
          <MenuItem value="healthy">Healthy</MenuItem>
          <MenuItem value="due_soon">Due Soon</MenuItem>
          <MenuItem value="service_due">Service Due</MenuItem>
          <MenuItem value="overdue">Overdue</MenuItem>
        </TextField>
      </Box>
    </Box>
  );
}