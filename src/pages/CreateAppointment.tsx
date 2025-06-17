import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { Patient } from '../types/Patient';
import { AppointmentType } from '../types/AppointmentType';
import { searchPatient, createPatient } from '../services/patientAPI';
import { createAppointment, CreateAppointmentRequest } from '../services/appointmentAPI';
import { getAllAppointmentTypes } from '../services/appointmentTypeAPI';
import { getTherapist, getAllTherapists } from '../services/therapistAPI';

interface CreateAppointmentProps {
  // Props passed via URL parameters
  time?: string;
  therapistId?: string;
  therapistName?: string;
  practiceId?: string;
  practiceName?: string;
  duration?: string;
}

const CreateAppointment: React.FC = () => {
  // URL parameters
  const [urlParams, setUrlParams] = useState<CreateAppointmentProps>({});
    // Form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(25);
  
  // New patient form
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    bsn: '',
  });  // Loading and error states
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAppointmentTypes, setLoadingAppointmentTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);  // Parse URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: CreateAppointmentProps = {
      time: searchParams.get('time') || undefined,
      therapistId: searchParams.get('therapistId') || undefined,
      therapistName: decodeURIComponent(searchParams.get('therapistName') || ''),
      practiceId: searchParams.get('practiceId') || undefined,
      practiceName: decodeURIComponent(searchParams.get('practiceName') || ''),
      duration: searchParams.get('duration') || undefined,
    };
    setUrlParams(params);
    
    // Debug: Log the received parameters
    console.log('CreateAppointment received URL params:', params);
      if (params.duration) {
      setDuration(parseInt(params.duration));
    }
  }, []);

  // Validate therapist exists when URL params are loaded
  useEffect(() => {
    const validateTherapist = async () => {
      if (urlParams.therapistId) {
        try {
          await getTherapist(urlParams.therapistId);
          console.log('Therapist validation successful for ID:', urlParams.therapistId);
        } catch (error) {
          console.error('Therapist validation failed for ID:', urlParams.therapistId, error);
          setError(`Invalid therapist ID: ${urlParams.therapistId}. This therapist may not exist or may have been deleted.`);
        }
      }
    };
    
    validateTherapist();
  }, [urlParams.therapistId]);// Load appointment types on component mount
  useEffect(() => {
    const loadAppointmentTypes = async () => {
      setLoadingAppointmentTypes(true);
      try {
        const types = await getAllAppointmentTypes();
        setAppointmentTypes(types);
      } catch (error) {
        console.error('Failed to load appointment types:', error);
        // Provide fallback appointment types if API fails
        setAppointmentTypes([
          { id: '1', name: 'Consultation', description: 'Initial consultation' },
          { id: '2', name: 'Treatment', description: 'Treatment session' },
          { id: '3', name: 'Follow-up', description: 'Follow-up appointment' },
          { id: '4', name: 'Assessment', description: 'Assessment session' },
        ]);
      }
      setLoadingAppointmentTypes(false);
    };
    
    loadAppointmentTypes();
  }, []);
  // Search patients with debouncing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (patientSearchTerm.length > 1) {
        setLoadingSearch(true);
        try {
          const results = await searchPatient(patientSearchTerm);
          setPatients(results);
        } catch (error) {
          console.error('Failed to search patients:', error);
          // Don't set error state for search failures, just leave patients empty
          setPatients([]);
        }
        setLoadingSearch(false);
      } else {
        setPatients([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearchTerm]);

  const handleSubmit = async () => {
    if (!urlParams.time || !urlParams.therapistId || !urlParams.practiceId) {
      setError('Missing required appointment information');
      return;
    }

    if (!selectedPatient && !isNewPatient) {
      setError('Please select a patient or create a new one');
      return;
    }

    if (!appointmentTypeId) {
      setError('Please select an appointment type');
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      let patientId = selectedPatient?.id;

      // Create new patient if needed
      if (isNewPatient) {
        if (!newPatientData.firstName || !newPatientData.lastName) {
          setError('First name and last name are required for new patients');
          setLoadingSubmit(false);
          return;
        }

        const newPatient = await createPatient(newPatientData);
        patientId = newPatient.id;
      }

      if (!patientId) {
        setError('Failed to get patient ID');
        setLoadingSubmit(false);
        return;
      }      // Create appointment
      const selectedAppointmentType = appointmentTypes.find(type => type.id === appointmentTypeId);
      
      if (!selectedAppointmentType) {
        setError('Please select a valid appointment type');
        setLoadingSubmit(false);
        return;
      }      // Format time to ISO string if it's not already
      let formattedTime = urlParams.time!;
      try {
        // If the time is not in ISO format, try to parse and convert it
        if (!formattedTime.includes('T') && !formattedTime.endsWith('Z')) {
          // Convert "2025-06-17 10:10:00" to ISO format
          const date = new Date(formattedTime);
          if (!isNaN(date.getTime())) {
            formattedTime = date.toISOString();
          }
        }
      } catch (error) {
        console.warn('Could not format time, using original:', formattedTime);
      }

      const appointmentData: CreateAppointmentRequest = {
        patientId: patientId,
        therapistId: urlParams.therapistId!,
        practiceId: urlParams.practiceId!,
        appointmentTypeId: appointmentTypeId,
        time: formattedTime,
        duration: duration,
        notes: notes || '',
      };

      // Validate that all required fields are present
      if (!appointmentData.patientId || !appointmentData.therapistId || !appointmentData.practiceId || !appointmentData.appointmentTypeId || !appointmentData.time) {
        setError('Missing required appointment information. Please ensure all fields are filled.');
        setLoadingSubmit(false);
        return;
      }      console.log('Creating appointment with data:', appointmentData);
      
      // Log alternative format for debugging (in case backend expects different field names)
      const alternativeData = {
        PatientId: patientId,
        TherapistId: urlParams.therapistId!,
        PracticeId: urlParams.practiceId!,
        AppointmentTypeId: appointmentTypeId,
        Time: formattedTime,
        Duration: duration,
        Notes: notes || '',
      };
      console.log('Alternative format (if needed):', alternativeData);
        await createAppointment(appointmentData);
      setSuccess(true);

      // Notify parent window to refresh the schedule
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'APPOINTMENT_CREATED', 
          appointmentData: appointmentData 
        }, window.location.origin);
      }

      // Close window after success
      setTimeout(() => {
        window.close();
      }, 2000);} catch (error: any) {
      console.error('Failed to create appointment:', error);
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
        
        // Handle validation errors specifically
        if (error.response.data.errors) {
          console.error('Validation errors:', error.response.data.errors);
          const validationErrors = Object.entries(error.response.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(`Validation errors: ${validationErrors}`);
        } else {
          setError(`Failed to create appointment: ${error.response.data.title || error.response.data.message || 'Unknown error'}`);
        }
      } else {
        setError('Failed to create appointment. Please try again.');
      }
    }

    setLoadingSubmit(false);
  };

  if (success) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Appointment created successfully!
        </Alert>
        <Typography>This window will close automatically...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Create New Appointment
      </Typography>      {/* Appointment Details */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          Appointment Details
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">
              <strong>Date & Time:</strong> {urlParams.time ? format(parseISO(urlParams.time), 'PPpp') : 'Not specified'}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">
              <strong>Duration:</strong> {duration} minutes
            </Typography>
          </Box>          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">
              <strong>Therapist:</strong> {urlParams.therapistName || 'Unknown'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              ID: {urlParams.therapistId || 'Not provided'}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body1">
              <strong>Practice:</strong> {urlParams.practiceName || 'Unknown'}
            </Typography>
          </Box>
        </Box>
      </Paper>      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          {error.includes('Invalid therapist ID') && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                onClick={async () => {
                  try {
                    const allTherapists = await getAllTherapists();
                    console.log('Available therapists:', allTherapists);
                    alert(`Available therapists: ${allTherapists.map(t => `${t.name} (${t.id})`).join(', ')}`);
                  } catch (error) {
                    console.error('Failed to load therapists:', error);
                  }
                }}
              >
                Show Available Therapists
              </Button>
            </Box>
          )}
        </Alert>
      )}

      {/* Patient Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Button
            variant={!isNewPatient ? 'contained' : 'outlined'}
            onClick={() => setIsNewPatient(false)}
            sx={{ mr: 1 }}
          >
            Existing Patient
          </Button>
          <Button
            variant={isNewPatient ? 'contained' : 'outlined'}
            onClick={() => setIsNewPatient(true)}
          >
            New Patient
          </Button>
        </Box>

        {!isNewPatient ? (
          <Autocomplete
            options={patients}
            getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''}`.trim()}
            value={selectedPatient}
            onChange={(_, newValue) => setSelectedPatient(newValue)}
            inputValue={patientSearchTerm}
            onInputChange={(_, newInputValue) => setPatientSearchTerm(newInputValue)}
            loading={loadingSearch}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search for patient"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingSearch && <CircularProgress color="inherit" size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Box>
                    <Typography variant="body1">
                      {`${option.firstName || ''} ${option.lastName || ''}`.trim()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[
                        option.phoneNumber && `Tel: ${option.phoneNumber}`,
                        option.email && `Email: ${option.email}`,
                        option.bsn && `BSN: ${option.bsn}`,
                      ].filter(Boolean).join(' • ')}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 250px' }}>
              <TextField
                label="First Name *"
                value={newPatientData.firstName}
                onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                fullWidth
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <TextField
                label="Last Name *"
                value={newPatientData.lastName}
                onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                fullWidth
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <TextField
                label="Email"
                type="email"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <TextField
                label="Phone Number"
                value={newPatientData.phoneNumber}
                onChange={(e) => setNewPatientData({ ...newPatientData, phoneNumber: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <TextField
                label="Date of Birth"
                type="date"
                value={newPatientData.dateOfBirth}
                onChange={(e) => setNewPatientData({ ...newPatientData, dateOfBirth: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <TextField
                label="BSN"
                value={newPatientData.bsn}
                onChange={(e) => setNewPatientData({ ...newPatientData, bsn: e.target.value })}
                fullWidth
              />
            </Box>
          </Box>
        )}
      </Paper>      {/* Appointment Details Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Appointment Settings
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ flex: '1 1 250px' }}>            <FormControl fullWidth required>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                value={appointmentTypeId}
                onChange={(e) => setAppointmentTypeId(e.target.value)}
                label="Appointment Type"
                disabled={loadingAppointmentTypes}
              >
                {appointmentTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                    {type.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({type.description})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
              {loadingAppointmentTypes && (
                <CircularProgress size={20} sx={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 250px' }}>
            <TextField
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 25)}
              fullWidth
              inputProps={{ min: 5, max: 300, step: 5 }}
            />
          </Box>
        </Box>
        <Box>
          <TextField
            label="Notes"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            placeholder="Additional notes or comments..."
          />
        </Box>
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => window.close()}
          disabled={loadingSubmit}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loadingSubmit}
          startIcon={loadingSubmit && <CircularProgress size={20} />}
        >
          {loadingSubmit ? 'Creating...' : 'Create Appointment'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateAppointment;
