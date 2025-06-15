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
  Snackbar,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Practice } from '../../types';
import { getPractices, createPractice, updatePractice, deletePractice } from '../../services/patientAPI';

const PracticesManager: React.FC = () => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPractice, setCurrentPractice] = useState<Practice>({
    id: 0,
    name: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    color: 'gray'
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Common color options
  const colorOptions = [
    { name: 'Gray', value: 'gray' },
    { name: 'Blue', value: '#3498db' },
    { name: 'Green', value: '#2ecc71' },
    { name: 'Red', value: '#e74c3c' },
    { name: 'Purple', value: '#9b59b6' },
    { name: 'Orange', value: '#e67e22' },
    { name: 'Yellow', value: '#f1c40f' },
    { name: 'Teal', value: '#1abc9c' },
    { name: 'Pink', value: '#e84393' },
    { name: 'Cyan', value: '#00cec9' }
  ];

  useEffect(() => {
    loadPractices();
  }, []);

  const loadPractices = async () => {
    try {
      setLoading(true);
      const data = await getPractices();
      setPractices(data);
    } catch (error) {
      console.error('Failed to load practices:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load practices',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setCurrentPractice({
      id: 0,
      name: '',
      address: '',
      city: '',
      zipCode: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      color: 'gray'
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (practice: Practice) => {
    setCurrentPractice({ ...practice });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentPractice(prev => ({
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
      if (!currentPractice.name) {
        setSnackbar({
          open: true,
          message: 'Practice name is required',
          severity: 'error'
        });
        return;
      }

      if (isEditing) {
        await updatePractice(currentPractice.id, currentPractice);
        setSnackbar({
          open: true,
          message: 'Practice updated successfully',
          severity: 'success'
        });
      } else {
        await createPractice(currentPractice);
        setSnackbar({
          open: true,
          message: 'Practice created successfully',
          severity: 'success'
        });
      }

      setDialogOpen(false);
      loadPractices();
    } catch (error) {
      console.error('Failed to save practice:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} practice`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this practice?')) return;

    try {
      setLoading(true);
      await deletePractice(id);
      setSnackbar({
        open: true,
        message: 'Practice deleted successfully',
        severity: 'success'
      });
      loadPractices();
    } catch (error) {
      console.error('Failed to delete practice:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete practice',
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
        <Typography variant="h5">Practices Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Practice
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {practices.map((practice) => (
              <TableRow key={practice.id}>
                <TableCell>{practice.name}</TableCell>
                <TableCell>{practice.address}</TableCell>
                <TableCell>{practice.city}</TableCell>
                <TableCell>{practice.phone}</TableCell>
                <TableCell>{practice.email}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: practice.color || 'gray',
                      border: '1px solid #ccc'
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEditDialog(practice)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(practice.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {practices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No practices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Practice' : 'Create Practice'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={currentPractice.name}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={currentPractice.address}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={currentPractice.city}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="zipCode"
                  value={currentPractice.zipCode}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={currentPractice.country}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={currentPractice.phone}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={currentPractice.email}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={currentPractice.website}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel htmlFor="practice-color">Color</InputLabel>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 3, mb: 1 }}>
                    {colorOptions.map(color => (
                      <Box
                        key={color.value}
                        sx={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: color.value,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: currentPractice.color === color.value ? '3px solid #000' : '1px solid #ccc',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        onClick={() => setCurrentPractice(prev => ({ ...prev, color: color.value }))}
                        title={color.name}
                      />
                    ))}
                  </Box>
                  <TextField
                    id="practice-color"
                    name="color"
                    value={currentPractice.color}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="Enter a custom color value (e.g., #FF5733)"
                    sx={{ mt: 1 }}
                  />
                  <FormHelperText>Select a predefined color or enter a custom color code</FormHelperText>
                </FormControl>
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

export default PracticesManager; 