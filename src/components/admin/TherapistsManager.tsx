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
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  FormHelperText
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Therapist } from '../../types/Therapist';
import { Appointment } from '../../types/Appointment';
import { Workshift } from '../../types/Workshift';
import { Practice } from '../../types/Practice';
import { 
  getTherapist,
  createTherapist, 
  updateTherapist, 
  deleteTherapist,
} from '../../services/therapistAPI';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { Specialization } from '../../types/Specialization';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`therapist-tabpanel-${index}`}
      aria-labelledby={`therapist-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `therapist-tab-${index}`,
    'aria-controls': `therapist-tabpanel-${index}`,
  };
}

const TherapistsManager: React.FC = () => {
  // Tabs state
  const [tabValue, setTabValue] = useState(0);
  
  // Therapists state
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [therapistDialogOpen, setTherapistDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTherapist, setCurrentTherapist] = useState<Therapist>({
    id: '',
    name: '',
    email: '',
    phoneNumber: ''
  });
  
  // Work shifts state
  const [workShifts, setWorkShifts] = useState<Workshift[]>([]);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [isEditingShift, setIsEditingShift] = useState(false);
  const [currentWorkShift, setCurrentWorkShift] = useState<Workshift>({
    id: 0,
    therapistId: 0,
    practiceId: 0,
    startDateTime: '',
    endDateTime: ''
  });
  
  // Common state
  const [practices, setPractices] = useState<Practice[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [therapistsData, practicesData] = await Promise.all([
        setTherapists(),
        setPractices()
      ]);
      
      setTherapists(therapistsData);
      setPractices(practicesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkShifts = async (therapistId: number) => {
    if (!therapistId) return;
    
    try {
      setLoading(true);
      const data = await getWorkShiftsByTherapist(therapistId);
      setWorkShifts(data);
    } catch (error) {
      console.error('Failed to load work shifts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load work shifts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Therapist handlers
  const openCreateTherapistDialog = () => {
    setCurrentTherapist({
      id: 0,
      name: '',
      email: '',
      phone: '',
      practiceId: 0
    });
    setIsEditing(false);
    setTherapistDialogOpen(true);
  };

  const openEditTherapistDialog = (therapist: Therapist) => {
    setCurrentTherapist({ ...therapist });
    setIsEditing(true);
    setTherapistDialogOpen(true);
  };

  const handleTherapistInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTherapist(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePracticeChange = (e: SelectChangeEvent<number>) => {
    setCurrentTherapist(prev => ({
      ...prev,
      practiceId: e.target.value as number
    }));
  };

  const handleTherapistClose = () => {
    setTherapistDialogOpen(false);
  };

  const handleTherapistSubmit = async () => {
    try {
      setLoading(true);

      // Basic validation
      if (!currentTherapist.name) {
        setSnackbar({
          open: true,
          message: 'Therapist name is required',
          severity: 'error'
        });
        return;
      }

      if (isEditing) {
        await updateTherapist(currentTherapist.id, currentTherapist);
        setSnackbar({
          open: true,
          message: 'Therapist updated successfully',
          severity: 'success'
        });
      } else {
        await createTherapist(currentTherapist);
        setSnackbar({
          open: true,
          message: 'Therapist created successfully',
          severity: 'success'
        });
      }

      setTherapistDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save therapist:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} therapist`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTherapist = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this therapist?')) return;

    try {
      setLoading(true);
      await deleteTherapist(id);
      setSnackbar({
        open: true,
        message: 'Therapist deleted successfully',
        severity: 'success'
      });
      await loadData();
    } catch (error) {
      console.error('Failed to delete therapist:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete therapist',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Work shifts handlers
  const handleSelectTherapist = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    loadWorkShifts(therapist.id);
  };

  const openCreateShiftDialog = () => {
    if (!selectedTherapist) return;
    
    // Set default values with local timezone handling
    const now = new Date();
    
    // Make sure we're using the right format for the datetime-local input
    const localDateTimeFormat = (date: Date) => {
      const pad = (num: number) => String(num).padStart(2, '0');
      
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1); // months are 0-indexed
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    // Format for input type="datetime-local"
    const startDate = localDateTimeFormat(now);
    
    // End date = now + 1 hour
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endDate = localDateTimeFormat(endTime);
    
    console.log('Default start date:', startDate);
    console.log('Default end date:', endDate);
    
    setCurrentWorkShift({
      id: 0,
      therapistId: selectedTherapist.id,
      practiceId: selectedTherapist.practices,
      startDateTime: startDate,
      endDateTime: endDate
    });
    setIsEditingShift(false);
    setShiftDialogOpen(true);
  };

  const openEditShiftDialog = (shift: Workshift) => {
    setCurrentWorkShift({ ...shift });
    setIsEditingShift(true);
    setShiftDialogOpen(true);
  };

  const handleShiftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentWorkShift(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShiftPracticeChange = (e: SelectChangeEvent<number>) => {
    setCurrentWorkShift(prev => ({
      ...prev,
      practiceId: e.target.value as number
    }));
  };

  const handleShiftClose = () => {
    setShiftDialogOpen(false);
  };

  const handleShiftSubmit = async () => {
    if (!selectedTherapist || !currentWorkShift) return;

    try {
      setLoading(true);
      
      // Perform validation
      if (new Date(currentWorkShift.startDateTime) >= new Date(currentWorkShift.endDateTime)) {
        setSnackbar({
          open: true,
          message: 'Start time must be before end time',
          severity: 'error'
        });
        return;
      }

      if (isEditingShift) {
        // Update existing shift
        await updateWorkShift(
          selectedTherapist.id,
          currentWorkShift.id, 
          currentWorkShift
        );
        setSnackbar({
          open: true,
          message: 'Work shift updated successfully',
          severity: 'success'
        });
      } else {
        // Create new shift - make sure therapistId is set
        const workShiftToCreate = {
          ...currentWorkShift,
          therapistId: selectedTherapist.id
        };
        await currentWorkShift(workShiftToCreate);
        setSnackbar({
          open: true,
          message: 'Work shift created successfully',
          severity: 'success'
        });
      }

      // Refresh shifts
      await loadWorkShifts(selectedTherapist.id);
      
      // Reset form
      setShiftDialogOpen(false);
      setCurrentWorkShift({
        id: 0,
        therapistId: 0,
        practiceId: 0,
        startDateTime: '',
        endDateTime: ''
      });
    } catch (error) {
      console.error('Error saving work shift:', error);
      
      // Better error handling
      if (error instanceof Error) {
        setSnackbar({
          open: true,
          message: error.message,
          severity: 'error'
        });
      } else if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data;
        
        if (typeof responseData === 'string') {
          setSnackbar({
            open: true,
            message: responseData,
            severity: 'error'
          });
        } else if (responseData.errors && Array.isArray(responseData.errors)) {
          setSnackbar({
            open: true,
            message: responseData.errors.join(', '),
            severity: 'error'
          });
        } else if (responseData.errors) {
          setSnackbar({
            open: true,
            message: Object.values(responseData.errors).flat().join(', '),
            severity: 'error'
          });
        } else {
          setSnackbar({
            open: true,
            message: `Server error: ${error.response.status} ${error.response.statusText}`,
            severity: 'error'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: 'An unexpected error occurred',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this work shift?')) return;

    try {
      setLoading(true);
      if (!selectedTherapist) {
        throw new Error('No therapist selected');
      }
      await setWorkShifts(id, selectedTherapist.id);
      setSnackbar({
        open: true,
        message: 'Work shift deleted successfully',
        severity: 'success'
      });
      if (selectedTherapist) {
        await loadWorkShifts(selectedTherapist.id);
      }
    } catch (error) {
      console.error('Failed to delete work shift:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete work shift',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatDateTime = (isoString: string) => {
    try {
      return format(parseISO(isoString), 'MMM d, yyyy HH:mm');
    } catch (e) {
      return isoString;
    }
  };

  const getPracticeName = (id: number) => {
    const practice = practices.find(p => p.id === id);
    return practice ? practice.name : 'Unknown Practice';
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Therapists" {...a11yProps(0)} />
          <Tab label="Work Shifts" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Therapists Management</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={openCreateTherapistDialog}
          >
            Add Therapist
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Practice</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {therapists.map((therapist) => (
                <TableRow key={therapist.id}>
                  <TableCell>{therapist.name}</TableCell>
                  <TableCell>{therapist.email}</TableCell>
                  <TableCell>{therapist.phone}</TableCell>
                  <TableCell>{getPracticeName(therapist.practices)}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleSelectTherapist(therapist)} color="info" title="Manage Work Shifts">
                      <ScheduleIcon />
                    </IconButton>
                    <IconButton onClick={() => openEditTherapistDialog(therapist)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteTherapist(therapist.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {therapists.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No therapists found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box mb={3}>
          {selectedTherapist ? (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">
                  Work Shifts for {selectedTherapist.name}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={openCreateShiftDialog}
                >
                  Add Work Shift
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Start Date & Time</TableCell>
                      <TableCell>End Date & Time</TableCell>
                      <TableCell>Practice</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{formatDateTime(shift.startDateTime)}</TableCell>
                        <TableCell>{formatDateTime(shift.endDateTime)}</TableCell>
                        <TableCell>{getPracticeName(shift.practiceId)}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => openEditShiftDialog(shift)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteShift(shift.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {workShifts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No work shifts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Please select a therapist to manage their work shifts
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setTabValue(0)}
              >
                Go to Therapists
              </Button>
            </Paper>
          )}
        </Box>
      </TabPanel>

      {/* Therapist Dialog */}
      <Dialog open={therapistDialogOpen} onClose={handleTherapistClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Therapist' : 'Create Therapist'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={currentTherapist.name}
                  onChange={handleTherapistInputChange}
                  required
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={currentTherapist.email}
                  onChange={handleTherapistInputChange}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={currentTherapist.phone}
                  onChange={handleTherapistInputChange}
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth required>
                  <InputLabel>Practice</InputLabel>
                  <Select
                    value={currentTherapist.practices || ''}
                    label="Practice"
                    onChange={handlePracticeChange}
                  >
                    <MenuItem value="" disabled>
                      <em>Select a practice</em>
                    </MenuItem>
                    {practices.map(practice => (
                      <MenuItem key={practice.id} value={practice.id}>
                        {practice.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>The practice this therapist belongs to</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTherapistClose}>Cancel</Button>
          <Button 
            onClick={handleTherapistSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work Shift Dialog */}
      <Dialog open={shiftDialogOpen} onClose={handleShiftClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditingShift ? 'Edit Work Shift' : 'Create Work Shift'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="Start Date & Time"
                  name="startDateTime"
                  type="datetime-local"
                  value={currentWorkShift.startDateTime}
                  onChange={handleShiftInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 6' }}>
                <TextField
                  fullWidth
                  label="End Date & Time"
                  name="endDateTime"
                  type="datetime-local"
                  value={currentWorkShift.endDateTime}
                  onChange={handleShiftInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth required>
                  <InputLabel>Practice</InputLabel>
                  <Select
                    value={currentWorkShift.practiceId || ''}
                    label="Practice"
                    onChange={handleShiftPracticeChange}
                  >
                    <MenuItem value="" disabled>
                      <em>Select a practice</em>
                    </MenuItem>
                    {practices.map(practice => (
                      <MenuItem key={practice.id} value={practice.id}>
                        {practice.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>The practice for this work shift</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShiftClose}>Cancel</Button>
          <Button 
            onClick={handleShiftSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {isEditingShift ? 'Update' : 'Create'}
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

export default TherapistsManager; 