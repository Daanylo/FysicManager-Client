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
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [description, setDescription] = useState('');
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
      const types = await getAllAppointmentTypes();
      setAppointmentTypes(types);
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

  const handleSubmit = async () => {    if (!urlParams.time || !urlParams.therapistId || !urlParams.practiceId) {
      setError('Verplichte afspraak informatie ontbreekt');
      return;
    }

    if (!selectedPatient && !isNewPatient) {
      setError('Selecteer een patiënt of maak een nieuwe aan');
      return;
    }    if (!appointmentTypeId) {
      setError('Selecteer een afspraak type');
      return;
    }

    if (!description.trim()) {
      setError('Voer een beschrijving in voor de afspraak');
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      let patientId = selectedPatient?.id;

      // Create new patient if needed
      if (isNewPatient) {
        if (!newPatientData.firstName || !newPatientData.lastName) {
          setError('Voornaam en achternaam zijn verplicht voor nieuwe patiënten');
          setLoadingSubmit(false);
          return;
        }

        const newPatient = await createPatient(newPatientData);
        patientId = newPatient.id;
      }

      if (!patientId) {
        setError('Kan geen patiënt ID verkrijgen');
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
      }      const appointmentData: CreateAppointmentRequest = {
        patientId: patientId,
        therapistId: urlParams.therapistId!,
        practiceId: urlParams.practiceId!,
        appointmentTypeId: appointmentTypeId,
        time: formattedTime,
        duration: duration,
        notes: notes || '',
        description: description.trim(), // Use the user-provided description
      };      // Validate that all required fields are present
      if (!appointmentData.patientId || !appointmentData.therapistId || !appointmentData.practiceId || !appointmentData.appointmentTypeId || !appointmentData.time || !appointmentData.description) {
        setError('Missing required appointment information. Please ensure all fields are filled.');
        setLoadingSubmit(false);
        return;
      }console.log('Creating appointment with data:', appointmentData);
        // Log alternative format for debugging (in case backend expects different field names)
      const alternativeData = {
        PatientId: patientId,
        TherapistId: urlParams.therapistId!,
        PracticeId: urlParams.practiceId!,
        AppointmentTypeId: appointmentTypeId,
        Time: formattedTime,
        Duration: duration,
        Notes: notes || '',
        Description: description.trim(),
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
          Afspraak succesvol aangemaakt!
        </Alert>
        <Typography>Dit venster sluit automatisch...</Typography>
      </Box>
    );
  }return (
    <Box sx={{ p: 2, maxWidth: 700, mx: 'auto', minHeight: '100vh', overflowY: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Nieuwe Afspraak Maken
      </Typography>{/* Appointment Details */}      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          Afspraak Details
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ flex: '1 1 180px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Datum & Tijd:</strong> {urlParams.time ? format(parseISO(urlParams.time), 'PPpp') : 'Niet opgegeven'}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Duur:</strong> {duration} minuten
            </Typography>
          </Box>          <Box sx={{ flex: '1 1 180px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Therapeut:</strong> {urlParams.therapistName || 'Onbekend'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              ID: {urlParams.therapistId || 'Niet opgegeven'}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 180px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Praktijk:</strong> {urlParams.practiceName || 'Onbekend'}
            </Typography>
          </Box>
        </Box>
      </Paper>      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {error.includes('Invalid therapist ID') && (
            <Box sx={{ mt: 1 }}>              <Button
                size="small"
                sx={{ fontSize: '0.75rem' }}
                onClick={async () => {
                  try {
                    const allTherapists = await getAllTherapists();
                    console.log('Available therapists:', allTherapists);
                    alert(`Beschikbare therapeuten: ${allTherapists.map(t => `${t.name} (${t.id})`).join(', ')}`);
                  } catch (error) {
                    console.error('Failed to load therapists:', error);
                  }
                }}
              >
                Toon Beschikbare Therapeuten
              </Button>
            </Box>
          )}
        </Alert>
      )}      {/* Patient Selection */}      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          Patiënt Informatie
        </Typography>

        <Box sx={{ mb: 1.5 }}>
          <Button
            variant={!isNewPatient ? 'contained' : 'outlined'}
            onClick={() => setIsNewPatient(false)}
            sx={{ mr: 1, fontSize: '0.8rem', py: 0.5 }}
            size="small"
          >
            Bestaande Patiënt
          </Button>
          <Button
            variant={isNewPatient ? 'contained' : 'outlined'}
            onClick={() => setIsNewPatient(true)}
            sx={{ fontSize: '0.8rem', py: 0.5 }}
            size="small"
          >
            Nieuwe Patiënt
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
            loading={loadingSearch}            renderInput={(params) => (
              <TextField
                {...params}
                label="Zoek naar patiënt"
                variant="outlined"
                fullWidth
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingSearch && <CircularProgress color="inherit" size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (                <Box component="li" key={key} {...otherProps}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {`${option.firstName || ''} ${option.lastName || ''}`.trim()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
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
          />        ) : (          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                label="Voornaam *"
                value={newPatientData.firstName}
                onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                fullWidth
                required
                size="small"
              />
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                label="Achternaam *"
                value={newPatientData.lastName}
                onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                fullWidth
                required
                size="small"
              />
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                label="E-mail"
                type="email"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                fullWidth
                size="small"
              />
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                label="Telefoonnummer"
                value={newPatientData.phoneNumber}
                onChange={(e) => setNewPatientData({ ...newPatientData, phoneNumber: e.target.value })}
                fullWidth
                size="small"
              />
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                label="Geboortedatum"
                type="date"
                value={newPatientData.dateOfBirth}
                onChange={(e) => setNewPatientData({ ...newPatientData, dateOfBirth: e.target.value })}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                label="BSN"
                value={newPatientData.bsn}
                onChange={(e) => setNewPatientData({ ...newPatientData, bsn: e.target.value })}
                fullWidth
                size="small"
              />
            </Box>
          </Box>
        )}
      </Paper>      {/* Appointment Details Form */}      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          Afspraak Instellingen
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ flex: '1 1 250px' }}>            <FormControl fullWidth required>              <InputLabel>Afspraak Type</InputLabel>
              <Select
                value={appointmentTypeId}
                onChange={(e) => setAppointmentTypeId(e.target.value)}
                label="Afspraak Type"
                disabled={loadingAppointmentTypes}
              >                {appointmentTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {type.name}
                      </Typography>
                      {type.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {type.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>              {loadingAppointmentTypes && (
                <CircularProgress size={16} sx={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 150px' }}>            <TextField
              label="Duur (minuten)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 25)}
              fullWidth
              size="small"
              inputProps={{ min: 5, max: 300, step: 5 }}
            />
          </Box>        </Box>
        
        <Box sx={{ mb: 1.5 }}>
          <TextField
            label="Beschrijving *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            placeholder="Beschrijf het doel van de afspraak..."
            required
          />
        </Box>
        
        <Box>
          <TextField            label="Notities"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            size="small"
            placeholder="Aanvullende notities of opmerkingen..."
          />
        </Box>
      </Paper>      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>        <Button
          variant="outlined"
          onClick={() => window.close()}
          disabled={loadingSubmit}
          size="small"
        >
          Annuleren
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loadingSubmit}
          size="small"
          startIcon={loadingSubmit && <CircularProgress size={16} />}
        >
          {loadingSubmit ? 'Bezig met aanmaken...' : 'Afspraak Aanmaken'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateAppointment;
