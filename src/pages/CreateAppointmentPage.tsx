import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Snackbar,
} from '@mui/material';
import { getPatients, getTherapists, createAppointment } from '../services/api';
import { 
  Appointment, 
  Patient, 
  Therapist, 
  AppointmentStatus, 
  AppointmentType
} from '../types';
import { addMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// We keep useNavigate import for potential future use, but mark it as unused if not needed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useNavigate } from 'react-router-dom';

const CreateAppointmentPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
  
  // State for form data
  const [formData, setFormData] = useState<Partial<Appointment>>({
    patientId: undefined,
    therapistId: undefined,
    status: AppointmentStatus.Gepland,
    type: AppointmentType.FysioTherapie,
    startTime: new Date().toISOString(),
    durationMinutes: 30,
    notes: '',
  });

  // State for patients/therapists data and loading state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Separate date and time for easier input handling
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Effect to load initial data from localStorage (passed from the main window)
  useEffect(() => {
    const savedData = localStorage.getItem('newAppointmentData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          ...parsedData,
          therapistId: parsedData.therapistId || '',
          patientId: parsedData.patientId || '',
        }));
        
        // Remove the data from localStorage to avoid conflicts
        localStorage.removeItem('newAppointmentData');
      } catch (err) {
        console.error('Error parsing saved appointment data:', err);
      }
    }
  }, []);

  // Effect to load patients and therapists
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patientsData, therapistsData] = await Promise.all([
          getPatients(),
          getTherapists()
        ]);
        setPatients(patientsData);
        setTherapists(therapistsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load patients or therapists. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update startTime when date or time changes
  useEffect(() => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0);
      
      setFormData(prev => ({
        ...prev,
        startTime: newDate.toISOString(),
      }));
    }
  }, [selectedDate, selectedTime]);

  // Handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    
    // Special handling for durationMinutes to ensure it's a number
    if (name === 'durationMinutes') {
      const numberValue = parseInt(value, 10);
      if (!isNaN(numberValue) && numberValue > 0) {
        setFormData(prev => ({ ...prev, [name]: numberValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle select changes
  const handleSelectChange = (event: SelectChangeEvent<string | number>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate required fields
    if (!formData.patientId || !formData.therapistId || !formData.startTime || 
        formData.durationMinutes === undefined || formData.durationMinutes <= 0) {
      setError('Please fill in all required fields with valid values.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Parse start time
      const [startHour, startMinute] = selectedTime.split(':').map(Number);
      
      // Use selectedDate instead of formData.date which doesn't exist
      const baseDate = selectedDate || new Date();
      let startTimeLocal = setMilliseconds(setSeconds(setMinutes(setHours(baseDate, startHour), startMinute), 0), 0);
      
      // Calculate end time based on duration
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let endTimeLocal = addMinutes(startTimeLocal, formData.durationMinutes || 30);
      // endTimeLocal is used for calculating appointment duration
      
      // Timezone compensation
      const timezoneOffsetMinutes = new Date().getTimezoneOffset();
      const adjustedStart = new Date(startTimeLocal.getTime() - timezoneOffsetMinutes * 60 * 1000);
      
      // Create a clean appointment object with only the necessary fields
      // to avoid entity tracking issues
      const appointmentData = {
        patientId: Number(formData.patientId),
        therapistId: Number(formData.therapistId),
        startTime: adjustedStart.toISOString(),
        durationMinutes: formData.durationMinutes || 30,
        status: Number(formData.status),
        type: Number(formData.type),
        notes: formData.notes || ''
      };
      
      // Submit to API
      const createdAppointment = await createAppointment(appointmentData);
      
      // Show success message
      setSuccessMessage('Appointment created successfully!');
      
      // Send message to parent window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'APPOINTMENT_CREATED',
          appointment: createdAppointment
        }, '*');
        
        // Close popup after short delay
        setTimeout(() => window.close(), 1500);
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      let errorMessage = 'Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
        
        // Provide a clearer message for entity tracking issues
        if (errorMessage.includes('entity type') && errorMessage.includes('cannot be tracked')) {
          errorMessage = 'Database conflict: Please try again.';
        }
      }
      
      setError(`Failed to create appointment: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Close the popup
  const handleCancel = () => {
    window.close();
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
  };

  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
  };

  const handleSnackbarClose = () => {
    setError(null);
    setSuccessMessage(null);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        py: 2, 
        height: '100vh', 
        overflow: 'auto' 
      }}
    >
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, fontSize: '1.2rem' }}>
          Create New Appointment
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={1.5}>
            {/* Patient & Therapist Section */}
            <Stack spacing={1.5}>
              <FormControl fullWidth size="small" required>
                <InputLabel id="patient-label">Patient</InputLabel>
                <Select
                  labelId="patient-label"
                  name="patientId"
                  value={formData.patientId || ''}
                  label="Patient"
                  onChange={handleSelectChange}
                  disabled={submitting}
                >
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name} {patient.surname} {patient.bsn ? `(BSN: ${patient.bsn})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small" required>
                <InputLabel id="therapist-label">Therapist</InputLabel>
                <Select
                  labelId="therapist-label"
                  name="therapistId"
                  value={formData.therapistId || ''}
                  label="Therapist"
                  onChange={handleSelectChange}
                  disabled={submitting}
                >
                  {therapists.map(therapist => (
                    <MenuItem key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            
            <Divider sx={{ my: 0.5 }} />
            
            {/* Date & Time Section */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Date & Time
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      size: "small",
                      margin: "dense"
                    }
                  }}
                  disabled={submitting}
                />
              </LocalizationProvider>
              
              <TextField
                label="Time"
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                disabled={submitting}
                size="small"
                margin="dense"
              />
            </Stack>
            
            <TextField
              label="Duration (minutes)"
              name="durationMinutes"
              type="number"
              value={formData.durationMinutes || ''}
              onChange={handleInputChange}
              fullWidth
              required
              inputProps={{ min: 5, step: 5 }}
              disabled={submitting}
              size="small"
              margin="dense"
            />
            
            <Divider sx={{ my: 0.5 }} />
            
            {/* Appointment Details Section */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Appointment Details
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status !== undefined ? formData.status : ''}
                  label="Status"
                  onChange={handleSelectChange}
                  disabled={submitting}
                >
                  {Object.values(AppointmentStatus)
                    .filter(value => typeof value === 'string')
                    .map((status, index) => (
                      <MenuItem key={index} value={index}>
                        {status}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={formData.type !== undefined ? formData.type : ''}
                  label="Type"
                  onChange={handleSelectChange}
                  disabled={submitting}
                >
                  {Object.values(AppointmentType)
                    .filter(value => typeof value === 'string')
                    .map((type, index) => (
                      <MenuItem key={index} value={index}>
                        {type}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
            
            <TextField
              label="Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              minRows={2}
              disabled={submitting}
              size="small"
              margin="dense"
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleCancel}
                disabled={submitting}
                size="small"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} /> : null}
                size="small"
              >
                Create Appointment
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
      
      {/* Snackbars for feedback */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateAppointmentPage; 