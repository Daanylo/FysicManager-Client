import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Autocomplete,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { Patient } from '../../types/Patient';
import { Appointment } from '../../types/Appointment';
import { searchPatient, getPatient, getPatientAppointments, createPatient, updatePatient } from '../../services/patientAPI';
import { format, parseISO, isBefore } from 'date-fns';

interface PatientPanelProps {
  onNavigateToAppointment?: (appointmentDate: Date, therapistId: string) => void;
}

const PatientPanel: React.FC<PatientPanelProps> = ({ onNavigateToAppointment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState<boolean>(false);
  const [loadingAppointments, setLoadingAppointments] = useState<boolean>(false);
  const [openAutocomplete, setOpenAutocomplete] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Debounce search term
  useEffect(() => {
    console.log('searchTerm changed to:', searchTerm); // Debug log
    const timer = setTimeout(() => {
      console.log('Setting debouncedSearchTerm to:', searchTerm); // Debug log
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm.length > 1) { // Start searching after 2 characters
      setLoadingSearch(true);
      const fetchPatients = async () => {
        try {
          console.log('Making API call with search term:', debouncedSearchTerm); // Debug log
          const filtered = await searchPatient(debouncedSearchTerm);
          console.log('API Response:', filtered); // Debug log
          setPatients(filtered);
        } catch (error) {
          console.error("Failed to search patients:", error);
          setPatients([]);
        }
        setLoadingSearch(false);
      };
      fetchPatients();
    } else {
      setPatients([]);
    }
  }, [debouncedSearchTerm]);  const handlePatientSelect = async (event: any, value: Patient | null) => {
    if (value) {
      setLoadingPatientDetails(true);
      setLoadingAppointments(true);
      try {
        const [patientDetails, appointments] = await Promise.all([
          getPatient(value.id),
          getPatientAppointments(value.id)
        ]);
        setSelectedPatient(patientDetails);
        setPatientAppointments(appointments);
      } catch (error) {
        console.error("Failed to fetch patient details or appointments:", error);
        setSelectedPatient(null);
        setPatientAppointments([]);
      }
      setLoadingPatientDetails(false);
      setLoadingAppointments(false);
    } else {
      setSelectedPatient(null);
      setPatientAppointments([]);
    }
  };
  const handleAppointmentClick = (appointment: Appointment) => {
    if (onNavigateToAppointment && appointment.time && appointment.therapist?.id) {
      const appointmentDate = parseISO(appointment.time);
      onNavigateToAppointment(appointmentDate, appointment.therapist.id);
    }
  };

  // Dialog handling functions
  const openCreateDialog = () => {
    setDialogMode('create');
    setFormData({});
    setError(null);
    setSuccess(null);
    setOpenDialog(true);
  };

  const openEditDialog = () => {
    if (!selectedPatient) return;
    
    setDialogMode('edit');    setFormData({
      firstName: selectedPatient.firstName || '',
      lastName: selectedPatient.lastName || '',
      initials: selectedPatient.initials || '',
      email: selectedPatient.email || '',
      phoneNumber: selectedPatient.phoneNumber || '',
      dateOfBirth: selectedPatient.dateOfBirth || '',
      bsn: selectedPatient.bsn || '',
      address: selectedPatient.address || '',
      postalCode: selectedPatient.postalCode || '',
      city: selectedPatient.city || '',
      country: selectedPatient.country || '',
    });
    setError(null);
    setSuccess(null);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setFormData({});
    setError(null);
    setSuccess(null);
  };
  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      if (dialogMode === 'create') {
        const newPatient = await createPatient(formData);
        setSuccess('Patient created successfully!');
        // Auto-select the newly created patient
        await handlePatientSelect(null, newPatient);
      } else if (dialogMode === 'edit' && selectedPatient) {
        const updatedPatient = await updatePatient(selectedPatient.id, formData);
        setSelectedPatient(updatedPatient);
        setSuccess('Patient updated successfully!');
      }
      
      closeDialog();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error(`Failed to ${dialogMode} patient:`, error);
      setError(`Failed to ${dialogMode} patient. Please try again.`);
    }
    
    setSubmitting(false);
  };

  // Separate appointments into past and upcoming
  const now = new Date();
  const upcomingAppointments = patientAppointments
    .filter(apt => apt.time && !isBefore(parseISO(apt.time), now))
    .sort((a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime());
  
  const pastAppointments = patientAppointments
    .filter(apt => apt.time && isBefore(parseISO(apt.time), now))
    .sort((a, b) => new Date(b.time!).getTime() - new Date(a.time!).getTime());
  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Patient Information
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={openCreateDialog}
        >
          New Patient
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}<Autocomplete
        open={openAutocomplete}
        onOpen={() => setOpenAutocomplete(true)}
        onClose={() => setOpenAutocomplete(false)}
        options={patients}
        getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''}`.trim()}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={loadingSearch}
        inputValue={searchTerm}
        onInputChange={(event, newInputValue, reason) => {
          console.log('onInputChange called:', { newInputValue, reason, event: event?.type }); // Debug log
          setSearchTerm(newInputValue);
        }}
        onChange={handlePatientSelect}
        filterOptions={(options) => options} // Disable client-side filtering
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box>
              <Typography variant="body1" component="div">
                {`${option.firstName || ''} ${option.lastName || ''}`.trim()}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                {[
                  option.phoneNumber && `Tel: ${option.phoneNumber}`,
                  option.email && `Email: ${option.email}`,
                  option.bsn && `BSN: ${option.bsn}`,
                  option.dateOfBirth && `DOB: ${format(new Date(option.dateOfBirth), 'dd/MM/yyyy')}`
                ].filter(Boolean).join(' • ')}
              </Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Zoek patiënt"
            variant="outlined"
            sx={{ mb: 2 }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loadingSearch ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      {loadingPatientDetails ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : selectedPatient && (        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Patient details */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle1">Name: {selectedPatient.firstName} {selectedPatient.lastName}</Typography>
              <IconButton
                size="small"
                onClick={openEditDialog}
                sx={{ ml: 1 }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Box>
            {selectedPatient.dateOfBirth && (
              <Typography variant="body2">DOB: {format(new Date(selectedPatient.dateOfBirth), 'dd/MM/yyyy')}</Typography>
            )}
            <Typography variant="body2">Contact: {selectedPatient.phoneNumber || 'N/A'}</Typography>
            <Typography variant="body2">Email: {selectedPatient.email || 'N/A'}</Typography>
            <Typography variant="body2">BSN: {selectedPatient.bsn || 'N/A'}</Typography>
            <Typography variant="body2">Address: {`${selectedPatient.address || ''} ${selectedPatient.postalCode || ''} ${selectedPatient.city || ''}`.trim() || 'N/A'}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Appointments section */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Appointments
            </Typography>

            {loadingAppointments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {/* Upcoming appointments */}
                {upcomingAppointments.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Upcoming Appointments ({upcomingAppointments.length})
                    </Typography>
                    <List dense sx={{ bgcolor: 'background.paper' }}>
                      {upcomingAppointments.map((appointment) => (
                        <ListItem key={appointment.id} disablePadding>
                          <ListItemButton
                            onClick={() => handleAppointmentClick(appointment)}
                            sx={{
                              borderRadius: 1,
                              mb: 0.5,
                              '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" component="span">
                                    {appointment.time && format(parseISO(appointment.time), 'dd/MM/yyyy HH:mm')}
                                  </Typography>
                                  <Chip
                                    label="Upcoming"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                </Box>
                              }                              secondary={
                                <Box>                                  <Typography variant="caption" display="block">
                                    {appointment.description || appointment.appointmentType?.name || 'Appointment'}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Therapist: {appointment.therapist?.name || 'Unknown'}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Duration: {appointment.duration} min
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Past appointments */}
                {pastAppointments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Past Appointments ({pastAppointments.length})
                    </Typography>
                    <List dense sx={{ bgcolor: 'background.paper' }}>
                      {pastAppointments.slice(0, 10).map((appointment) => (
                        <ListItem key={appointment.id} disablePadding>
                          <ListItemButton
                            onClick={() => handleAppointmentClick(appointment)}
                            sx={{
                              borderRadius: 1,
                              mb: 0.5,
                              '&:hover': {
                                bgcolor: 'grey.100',
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" component="span">
                                    {appointment.time && format(parseISO(appointment.time), 'dd/MM/yyyy HH:mm')}
                                  </Typography>
                                  <Chip
                                    label="Past"
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                  />
                                </Box>
                              }                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {appointment.description || appointment.appointmentType?.name || 'Appointment'}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Therapist: {appointment.therapist?.name}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Duration: {appointment.duration} min
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* No appointments message */}
                {!loadingAppointments && patientAppointments.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                    No appointments found for this patient.
                  </Typography>
                )}
              </Box>
            )}          </Box>
        </Box>
      )}

      {/* Create/Edit Patient Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Patient' : 'Edit Patient'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label="First Name *"
              fullWidth
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              label="Last Name *"
              fullWidth
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              label="Initials"
              value={formData.initials || ''}
              onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
              margin="normal"
              sx={{ minWidth: 100 }}
            />
          </Box>
          
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          
          <TextField
            label="Phone Number"
            fullWidth
            value={formData.phoneNumber || ''}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            margin="normal"
          />
          
          <TextField
            label="Date of Birth"
            type="date"
            fullWidth
            value={formData.dateOfBirth || ''}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="BSN"
            fullWidth
            value={formData.bsn || ''}
            onChange={(e) => setFormData({ ...formData, bsn: e.target.value })}
            margin="normal"
          />
          
          <TextField
            label="Address"
            fullWidth
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            margin="normal"
          />
            <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Postal Code"
              value={formData.postalCode || ''}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              margin="normal"
              sx={{ minWidth: 120 }}
            />
            <TextField
              label="City"
              fullWidth
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Country"
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              margin="normal"
              sx={{ minWidth: 120 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {submitting ? 'Saving...' : (dialogMode === 'create' ? 'Create' : 'Update')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PatientPanel;
