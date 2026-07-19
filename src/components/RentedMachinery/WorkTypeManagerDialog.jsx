import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, List, ListItem, ListItemText, IconButton,
  Typography, Stack, CircularProgress, Divider, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ConstructionIcon from '@mui/icons-material/Construction';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useWorkTypes, useCreateWorkType, useDeleteWorkType } from '../../hooks/useWorkTypes';

export default function WorkTypeManagerDialog({ open, onClose }) {
  const theme = useTheme();
  const { data: workTypes = [], isLoading } = useWorkTypes();
  const createWorkType = useCreateWorkType();
  const deleteWorkType = useDeleteWorkType();

  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createWorkType.mutateAsync({ name: name.trim() });
    setName('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ConstructionIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Manage Work Types</Typography>
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
                placeholder="Type of Work Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              />
              <Button
                variant="contained"
                type="submit"
                startIcon={<AddIcon />}
                sx={{ height: 40, px: 3, fontWeight: 700 }}
                disabled={createWorkType.isPending}
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
          ) : workTypes.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No work types added yet.</Typography>
            </Box>
          ) : (
            workTypes.map((wt, index) => (
              <React.Fragment key={wt._id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc' }
                  }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      color="error"
                      onClick={() => deleteWorkType.mutate(wt._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={wt.name} 
                    primaryTypographyProps={{ fontWeight: 600 }}
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
