import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField, 
  Typography,
  IconButton,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Specialization } from '../../types';
import { getSpecializations, createSpecialization, updateSpecialization, deleteSpecialization } from '../../services/api';

const SpecializationsManager: React.FC = () => {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpecialization, setCurrentSpecialization] = useState<Specialization>({
    id: 0,
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      setLoading(true);
      const data = await getSpecializations();
      setSpecializations(data);
    } catch (error) {
      console.error('Failed to load specializations:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load specializations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setCurrentSpecialization({
      id: 0,
      name: '',
      description: ''
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (specialization: Specialization) => {
    setCurrentSpecialization({ ...specialization });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSpecialization(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Basic validation
      if (!currentSpecialization.name) {
        setSnackbar({
          open: true,
          message: 'Specialization name is required',
          severity: 'error'
        });
        return;
      }

      if (isEditing) {
        await updateSpecialization(currentSpecialization.id, currentSpecialization);
        setSnackbar({
          open: true,
          message: 'Specialization updated successfully',
          severity: 'success'
        });
      } else {
        await createSpecialization(currentSpecialization);
        setSnackbar({
          open: true,
          message: 'Specialization created successfully',
          severity: 'success'
        });
      }

      setDialogOpen(false);
      loadSpecializations();
    } catch (error) {
      console.error('Failed to save specialization:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} specialization`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this specialization?')) return;

    try {
      setLoading(true);
      await deleteSpecialization(id);
      setSnackbar({
        open: true,
        message: 'Specialization deleted successfully',
        severity: 'success'
      });
      loadSpecializations();
    } catch (error) {
      console.error('Failed to delete specialization:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete specialization',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Specializations Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Specialization
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {specializations.map((specialization) => (
              <TableRow key={specialization.id}>
                <TableCell>{specialization.name}</TableCell>
                <TableCell>{specialization.description}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEditDialog(specialization)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(specialization.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {specializations.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No specializations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Specialization' : 'Create Specialization'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={currentSpecialization.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={currentSpecialization.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SpecializationsManager; 