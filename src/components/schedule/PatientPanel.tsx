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
} from '@mui/material';
import { Patient } from '../../types/Patient';
import { Appointment } from '../../types/Appointment';
import { searchPatient, getPatient, getPatientAppointments } from '../../services/patientAPI';
import { format, parseISO, isBefore } from 'date-fns';

interface PatientPanelProps {
  onNavigateToAppointment?: (appointmentDate: Date, therapistId: string) => void;
}

const PatientPanel: React.FC<PatientPanelProps> = ({ onNavigateToAppointment }) => {  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState<boolean>(false);
  const [loadingAppointments, setLoadingAppointments] = useState<boolean>(false);
  const [openAutocomplete, setOpenAutocomplete] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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
      <Typography variant="h6" gutterBottom>
        Patient Information
      </Typography>      <Autocomplete
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
      ) : selectedPatient && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Patient details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Name: {selectedPatient.firstName} {selectedPatient.lastName}</Typography>
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
                              }
                              secondary={
                                <Box>                                  <Typography variant="caption" display="block">
                                    {appointment.appointmentType?.name || 'Appointment'}
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
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {appointment.appointmentType?.name || 'Appointment'}
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
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default PatientPanel;
