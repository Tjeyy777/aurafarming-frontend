import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, List, ListItem, ListItemText, IconButton,
  Typography, Stack, CircularProgress, Divider, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import {
  useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial
} from '../../hooks/useMaterials';

export default function MaterialManagerDialog({ open, onClose }) {
  const theme = useTheme();
  const { data: materials = [], isLoading } = useMaterials();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [name, setName] = useState('');
  const [ratePerTon, setRatePerTon] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createMaterial.mutateAsync({ name: name.trim(), ratePerTon: Number(ratePerTon) || 0 });
    setName('');
    setRatePerTon('');
  };

  const startEdit = (mat) => {
    setEditingId(mat._id);
    setEditRate(mat.ratePerTon ?? '');
  };

  const saveEdit = async (id) => {
    await updateMaterial.mutateAsync({ id, ratePerTon: Number(editRate) || 0 });
    setEditingId(null);
    setEditRate('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CategoryIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Manage Materials</Typography>
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
                placeholder="Name (e.g. M-Sand)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ bgcolor: 'background.paper', flex: 2 }}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="Rate/Ton (₹)"
                value={ratePerTon}
                onChange={(e) => setRatePerTon(e.target.value)}
                sx={{ bgcolor: 'background.paper', flex: 1 }}
              />
              <Button
                variant="contained"
                type="submit"
                startIcon={<AddIcon />}
                sx={{ height: 40, px: 3, fontWeight: 700 }}
                disabled={createMaterial.isPending}
              >
                Add
              </Button>
            </Stack>
          </form>
        </Box>

        <Divider />

        <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : materials.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No materials added yet.</Typography>
            </Box>
          ) : (
            materials.map((mat, index) => {
              const isEditing = editingId === mat._id;
              return (
                <React.Fragment key={mat._id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc' }
                    }}
                    secondaryAction={
                      isEditing ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <TextField
                            size="small"
                            type="number"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            sx={{ width: 110 }}
                            autoFocus
                          />
                          <IconButton
                            edge="end"
                            size="small"
                            color="success"
                            onClick={() => saveEdit(mat._id)}
                            disabled={updateMaterial.isPending}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton edge="end" size="small" onClick={() => startEdit(mat)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={() => deleteMaterial.mutate(mat._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )
                    }
                  >
                    <ListItemText
                      primary={mat.name}
                      secondary={mat.ratePerTon ? `₹${mat.ratePerTon} per ton` : 'No rate set'}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                </React.Fragment>
              );
            })
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
