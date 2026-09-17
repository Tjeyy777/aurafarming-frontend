import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, List, ListItem, ListItemText, IconButton,
  Typography, Stack, CircularProgress, Paper, Divider, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { useParties, useCreateParty, useUpdateParty, useDeleteParty } from '../../hooks/useParties';

export default function PartyManagerDialog({ open, onClose }) {
  const theme = useTheme();
  const { data: parties = [], isLoading } = useParties();
  const createParty = useCreateParty();
  const updateParty = useUpdateParty();
  const deleteParty = useDeleteParty();

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateParty.mutateAsync({ id: editingId, payload: { name: name.trim() } });
      setEditingId(null);
    } else {
      await createParty.mutateAsync({ name: name.trim() });
    }
    setName('');
  };

  const handleEdit = (party) => {
    setEditingId(party._id);
    setName(party.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  const handleToggleOwner = (party) => {
    updateParty.mutate({ id: party._id, payload: { isOwner: !party.isOwner } });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <BusinessIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Manage Companies</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 1, pb: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
          <form onSubmit={handleSubmit}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                fullWidth
                size="small"
                placeholder="Company Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              />
              <Button
                variant="contained"
                type="submit"
                startIcon={editingId ? undefined : <AddIcon />}
                sx={{ height: 40, px: 3, fontWeight: 700 }}
                disabled={createParty.isPending || updateParty.isPending}
              >
                {editingId ? 'Save' : 'Add'}
              </Button>
              {editingId && (
                <Button variant="outlined" onClick={handleCancelEdit} sx={{ height: 40 }}>
                  Cancel
                </Button>
              )}
            </Stack>
          </form>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            <StarIcon fontSize="inherit" sx={{ color: '#f5a623', verticalAlign: 'middle', mr: 0.5 }} />
            Star the company that is your own — its vehicles will be tracked separately from other rental companies.
          </Typography>
        </Box>

        <Divider />
        
        <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : parties.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No companies added yet.</Typography>
            </Box>
          ) : (
            parties.map((party, index) => (
              <React.Fragment key={party._id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    bgcolor: party.isOwner
                      ? (theme.palette.mode === 'dark' ? 'rgba(255,193,7,0.08)' : '#fffbea')
                      : 'transparent',
                    '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc' }
                  }}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title={party.isOwner ? 'This is your own company — click to unmark' : 'Mark as your own company'}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleToggleOwner(party)}
                          disabled={updateParty.isPending}
                        >
                          {party.isOwner
                            ? <StarIcon fontSize="small" sx={{ color: '#f5a623' }} />
                            : <StarBorderIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <IconButton edge="end" size="small" onClick={() => handleEdit(party)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => deleteParty.mutate(party._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={(
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{party.name}</span>
                        {party.isOwner && (
                          <Chip label="Owner" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                        )}
                      </Stack>
                    )}
                    primaryTypographyProps={{ fontWeight: 600, component: 'div' }}
                  />
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
