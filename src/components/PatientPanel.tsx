import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  CircularProgress,
  Button,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Patient, Appointment } from '../types';
import { searchPatients, getPatient, getAppointmentsByPatient, deleteAppointment } from '../services/patientAPI';
import { format, addMinutes } from 'date-fns';

interface PatientPanelProps {
  onPatientSelect: (patientId: number) => void;
  onViewInSchedule?: (appointmentDate: Date, therapistId: number) => void;
}

const PatientPanel: React.FC<PatientPanelProps> = ({ onPatientSelect, onViewInSchedule }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const fetchResults = async () => {
        setLoading(true);
        try {
          const results = await searchPatients(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching patients:', error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      };
      
      const timeoutId = setTimeout(fetchResults, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchPatientDetails = async (patientId: number) => {
    setLoading(true);
    try {
      const patient = await getPatient(patientId);
      setSelectedPatient(patient);
      
      const appointments = await getAppointmentsByPatient(patientId);
      setPatientAppointments(appointments);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient.id);
    fetchPatientDetails(patient.id);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNewPatient = () => {
    // Determine base URL from environment or window location
    const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
    
    // Open new window with patient creation form
    const patientCreateUrl = `${baseUrl}/create-patient`;
    const windowFeatures = 'width=800,height=700,resizable=yes,scrollbars=yes,status=yes';
    const newWindow = window.open(patientCreateUrl, '_blank', windowFeatures);
    
    // Focus on the new window
    if (newWindow) {
      newWindow.focus();
    }
  };

  const handleEditPatient = (patientId: number) => {
    // Determine base URL from environment or window location
    const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
    
    // Open edit window with patient edit form
    const patientEditUrl = `${baseUrl}/edit-patient/${patientId}`;
    const windowFeatures = 'width=800,height=700,resizable=yes,scrollbars=yes,status=yes';
    const newWindow = window.open(patientEditUrl, '_blank', windowFeatures);
    
    // Focus on the new window
    if (newWindow) {
      newWindow.focus();
    }
  };

  const handleEditAppointment = (appointmentId: number) => {
    // Determine base URL from environment or window location
    const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
    
    // Open popup window with appointment edit form
    const appointmentEditUrl = `${baseUrl}/appointments/edit/${appointmentId}`;
    const windowFeatures = 'width=800,height=700,resizable=yes,scrollbars=yes,status=yes';
    
    const newWindow = window.open(appointmentEditUrl, '_blank', windowFeatures);
    
    // Set up message listener to refresh appointments after edit
    window.addEventListener('message', function handleAppointmentUpdated(event) {
      if (event.data && event.data.type === 'APPOINTMENT_UPDATED') {
        // Refresh patient appointments
        if (selectedPatient) {
          fetchPatientDetails(selectedPatient.id);
        }
        
        // Clean up event listener
        window.removeEventListener('message', handleAppointmentUpdated);
      }
    });
    
    // Focus on the new window
    if (newWindow) {
      newWindow.focus();
    }
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    try {
      setDeleteLoading(appointmentId);
      await deleteAppointment(appointmentId);
      
      // After successful deletion, refresh the appointments list
      if (selectedPatient) {
        await fetchPatientDetails(selectedPatient.id);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewInSchedule = (appointment: Appointment) => {
    if (onViewInSchedule && appointment.startTime && appointment.therapistId) {
      const appointmentDate = new Date(appointment.startTime);
      onViewInSchedule(appointmentDate, appointment.therapistId);
    }
  };

  const renderAppointmentList = (appointments: Appointment[], isPast: boolean) => {
    const filteredAppointments = appointments
      .filter(app => {
        const appDate = new Date(app.startTime);
        const now = new Date();
        return isPast ? appDate < now : appDate >= now;
      })
      .sort((a, b) => {
        return isPast 
          ? new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          : new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

    if (filteredAppointments.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No {isPast ? 'previous' : 'upcoming'} appointments found
          </Typography>
        </Box>
      );
    }

    return (
      <List dense>
        {filteredAppointments.map((appointment) => {
          const startTimeDate = new Date(appointment.startTime);
          let endTimeDate: Date;

          // Calculate endTime if it's not provided
          if (appointment.endTime) {
            endTimeDate = new Date(appointment.endTime);
          } else if (appointment.durationMinutes) {
            endTimeDate = addMinutes(startTimeDate, appointment.durationMinutes);
          } else {
            // Fallback: Assume a default duration (e.g., 30 minutes) if neither is available
            console.warn(`Appointment ID ${appointment.id} in PatientPanel missing endTime and durationMinutes. Assuming 30 min duration.`);
            endTimeDate = addMinutes(startTimeDate, 30); 
          }
          
          const formattedStartTime = format(startTimeDate, 'HH:mm');
          const formattedEndTime = format(endTimeDate, 'HH:mm');
          
          const isDeleting = deleteLoading === appointment.id;

          return (
            <React.Fragment key={appointment.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <Tooltip title="View in schedule">
                      <IconButton 
                        edge="end" 
                        aria-label="view-in-schedule" 
                        onClick={() => handleViewInSchedule(appointment)}
                        size="small"
                        disabled={isDeleting}
                      >
                        <CalendarTodayIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit appointment">
                      <IconButton 
                        edge="end" 
                        aria-label="edit" 
                        onClick={() => handleEditAppointment(appointment.id)}
                        size="small"
                        disabled={isDeleting}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete appointment">
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        size="small"
                        disabled={isDeleting}
                      >
                        {isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {format(startTimeDate, 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body2" sx={{ mr: 8 }}>
                        {`${formattedStartTime} - ${formattedEndTime}`}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {appointment.therapist ? appointment.therapist.name : 'Unknown therapist'}
                      </Typography>
                      {appointment.type !== undefined && (
                        <Typography variant="caption" display="block">
                          Type: {typeof appointment.type === 'string' ? appointment.type : Object.keys(appointment.type)[appointment.type]}
                        </Typography>
                      )}
                      {appointment.notes && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          {appointment.notes}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          );
        })}
      </List>
    );
  };

  return (
    <Paper 
      sx={{ 
        height: 'calc(100vh - 128px)', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          sx={{ flex: 1 }}
          placeholder="Search by name, email, phone, ID or BSN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
        />
        <Button 
          variant="contained" 
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleNewPatient}
        >
          New
        </Button>
      </Box>

      {searchResults.length > 0 && (
        <Box 
          sx={{ 
            p: 1, 
            maxHeight: '200px', 
            overflowY: 'auto',
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
          }}
        >
          <List dense>
            {searchResults.map(patient => (
              <ListItem 
                key={patient.id}
                onClick={() => handlePatientSelect(patient)}
                sx={{ cursor: 'pointer' }}
              >
                <ListItemText 
                  primary={
                    <Typography variant="body2">
                      <strong>{patient.name}</strong> {patient.surname && `${patient.surname}`}
                    </Typography>
                  } 
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        {patient.email}
                      </Typography>
                      {patient.phone && (
                        <Typography variant="caption" display="block">
                          {patient.phone}
                        </Typography>
                      )}
                      {patient.bsn && (
                        <Typography variant="caption" display="block">
                          BSN: {patient.bsn}
                        </Typography>
                      )}
                    </>
                  } 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {selectedPatient ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Card sx={{ mx: 2, mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <IconButton sx={{ p: 0, mr: 1 }}>
                  <PersonIcon sx={{ width: 40, height: 40 }} />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6">
                      {selectedPatient.name} {selectedPatient.surname || ''}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditPatient(selectedPatient.id)}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.email} {selectedPatient.phone && `• ${selectedPatient.phone}`}
                  </Typography>
                  {selectedPatient.bsn && (
                    <Typography variant="body2" color="text.secondary">
                      BSN: {selectedPatient.bsn}
                    </Typography>
                  )}
                  {selectedPatient.address && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedPatient.address}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Upcoming" />
              <Tab label="Previous" />
            </Tabs>
            
            <Box 
              sx={{ 
                flex: 1, 
                overflowY: 'auto', 
                p: 0 
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {tabValue === 0 && renderAppointmentList(patientAppointments, false)}
                  {tabValue === 1 && renderAppointmentList(patientAppointments, true)}
                </>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            flexDirection: 'column',
            p: 3,
            color: 'text.secondary'
          }}
        >
          <PersonIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
          <Typography variant="body1" textAlign="center">
            Search for a patient to view their details and appointments
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PatientPanel; 