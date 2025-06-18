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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { Patient } from '../types/Patient';
import { Appointment } from '../types/Appointment';
import { AppointmentType } from '../types/AppointmentType';
import { searchPatient, createPatient } from '../services/patientAPI';
import { updateAppointment, deleteAppointment, getAppointment, UpdateAppointmentRequest } from '../services/appointmentAPI';
import { getAllAppointmentTypes } from '../services/appointmentTypeAPI';
import { getTherapist, getAllTherapists } from '../services/therapistAPI';

interface EditAppointmentProps {
  // Props passed via URL parameters
  appointmentId?: string;
}

const EditAppointment: React.FC = () => {
  // URL parameters
  const [urlParams, setUrlParams] = useState<EditAppointmentProps>({});
  
  // Form state
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(25);
  
  // Loading and error states
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingAppointmentTypes, setLoadingAppointmentTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Parse URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: EditAppointmentProps = {
      appointmentId: searchParams.get('appointmentId') || undefined,
    };
    setUrlParams(params);
    
    console.log('EditAppointment received URL params:', params);
  }, []);

  // Load appointment data when URL params are available
  useEffect(() => {
    const loadAppointment = async () => {
      if (!urlParams.appointmentId) {
        setError('Geen afspraak ID opgegeven');
        setLoadingAppointment(false);
        return;
      }

      try {
        const appointmentData = await getAppointment(urlParams.appointmentId);
        setAppointment(appointmentData);
        
        // Pre-fill form with appointment data
        setDescription(appointmentData.description || '');
        setNotes(appointmentData.notes || '');
        setDuration(appointmentData.duration || 25);
        setAppointmentTypeId(appointmentData.appointmentType?.id || '');
        
        // Set patient data
        if (appointmentData.patient) {
          setSelectedPatient(appointmentData.patient);
          setPatientSearchTerm(`${appointmentData.patient.firstName || ''} ${appointmentData.patient.lastName || ''}`.trim());
        }
        
        console.log('Loaded appointment:', appointmentData);
      } catch (error) {
        console.error('Failed to load appointment:', error);
        setError('Kan afspraak niet laden. De afspraak bestaat mogelijk niet meer.');
      }
      
      setLoadingAppointment(false);
    };

    if (urlParams.appointmentId) {
      loadAppointment();
    }
  }, [urlParams.appointmentId]);

  // Load appointment types on component mount
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
          setPatients([]);
        }
        setLoadingSearch(false);
      } else {
        setPatients([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearchTerm]);

  const handleUpdate = async () => {
    if (!appointment || !urlParams.appointmentId) {
      setError('Geen afspraak om bij te werken');
      return;
    }

    if (!selectedPatient) {
      setError('Selecteer een patiënt');
      return;
    }

    if (!appointmentTypeId) {
      setError('Selecteer een afspraak type');
      return;
    }    if (!description.trim()) {
      setError('Voer een beschrijving in voor de afspraak');
      return;
    }

    if (!appointmentTypeId) {
      setError('Selecteer een afspraak type');
      return;
    }

    setLoadingSubmit(true);
    setError(null);    try {
      // Validate that we have all required data from the original appointment
      if (!appointment.therapist?.id) {
        setError('Therapeut informatie ontbreekt');
        setLoadingSubmit(false);
        return;
      }

      if (!appointment.practice?.id) {
        setError('Praktijk informatie ontbreekt');
        setLoadingSubmit(false);
        return;
      }

      if (!appointment.time) {
        setError('Afspraak tijd ontbreekt');
        setLoadingSubmit(false);
        return;
      }

      const updatedAppointment: UpdateAppointmentRequest = {
        patientId: selectedPatient.id,
        therapistId: appointment.therapist.id,  
        practiceId: appointment.practice.id,
        appointmentTypeId: appointmentTypeId,
        time: appointment.time,
        duration: duration,
        notes: notes || '',
        description: description.trim(),
      };

      console.log('Updating appointment with data:', updatedAppointment);

      await updateAppointment(urlParams.appointmentId, updatedAppointment);
      setSuccess(true);

      // Notify parent window to refresh the schedule
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'APPOINTMENT_UPDATED', 
          appointmentId: urlParams.appointmentId,
          appointmentData: updatedAppointment 
        }, window.location.origin);
      }

      // Close window after success
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to update appointment:', error);
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
        setError(`Kan afspraak niet bijwerken: ${error.response.data.title || error.response.data.message || 'Onbekende fout'}`);
      } else {
        setError('Kan afspraak niet bijwerken. Probeer het opnieuw.');
      }
    }

    setLoadingSubmit(false);
  };

  const handleDelete = async () => {
    if (!urlParams.appointmentId) {
      setError('Geen afspraak om te verwijderen');
      return;
    }

    setLoadingDelete(true);
    setError(null);

    try {
      await deleteAppointment(urlParams.appointmentId);
      
      // Notify parent window to refresh the schedule
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'APPOINTMENT_DELETED', 
          appointmentId: urlParams.appointmentId 
        }, window.location.origin);
      }

      // Close dialog and window
      setDeleteDialogOpen(false);
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to delete appointment:', error);
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
        setError(`Kan afspraak niet verwijderen: ${error.response.data.title || error.response.data.message || 'Onbekende fout'}`);
      } else {
        setError('Kan afspraak niet verwijderen. Probeer het opnieuw.');
      }
    }

    setLoadingDelete(false);
  };

  if (loadingAppointment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Afspraak laden...</Typography>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Afspraak succesvol bijgewerkt!
        </Alert>
        <Typography>Dit venster sluit automatisch...</Typography>
      </Box>
    );
  }

  if (!appointment) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Afspraak niet gevonden
        </Alert>
        <Button onClick={() => window.close()}>Sluiten</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 700, mx: 'auto', minHeight: '100vh', overflowY: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Afspraak Bewerken
      </Typography>

      {/* Appointment Details */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          Afspraak Details
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ flex: '1 1 180px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Datum & Tijd:</strong> {appointment.time ? format(parseISO(appointment.time), 'PPpp') : 'Niet opgegeven'}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 120px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Duur:</strong> {duration} minuten
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 180px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Therapeut:</strong> {appointment.therapist?.name || 'Onbekend'}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 180px' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              <strong>Praktijk:</strong> {appointment.practice?.name || 'Onbekend'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Patient Selection */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          Patiënt Informatie
        </Typography>

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
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={key} {...otherProps}>
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
        />
      </Paper>

      {/* Appointment Details Form */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          Afspraak Instellingen
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ flex: '1 1 250px' }}>
            <FormControl fullWidth required>
              <InputLabel>Afspraak Type</InputLabel>
              <Select
                value={appointmentTypeId}
                onChange={(e) => setAppointmentTypeId(e.target.value)}
                label="Afspraak Type"
                disabled={loadingAppointmentTypes}
              >
                {appointmentTypes.map((type) => (
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
              </Select>
              {loadingAppointmentTypes && (
                <CircularProgress size={16} sx={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 150px' }}>
            <TextField
              label="Duur (minuten)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 25)}
              fullWidth
              size="small"
              inputProps={{ min: 5, max: 300, step: 5 }}
            />
          </Box>
        </Box>
        
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
          <TextField
            label="Notities"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            size="small"
            placeholder="Aanvullende notities of opmerkingen..."
          />
        </Box>
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'space-between', pt: 1 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loadingSubmit}
          size="small"
        >
          Verwijderen
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => window.close()}
            disabled={loadingSubmit}
            size="small"
          >
            Annuleren
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={loadingSubmit}
            size="small"
            startIcon={loadingSubmit && <CircularProgress size={16} />}
          >
            {loadingSubmit ? 'Bezig met bijwerken...' : 'Afspraak Bijwerken'}
          </Button>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Afspraak Verwijderen
        </DialogTitle>
        <DialogContent>
          <Typography>
            Weet je zeker dat je deze afspraak wilt verwijderen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Beschrijving:</strong> {description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Patiënt:</strong> {selectedPatient ? `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim() : 'Onbekend'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Datum & Tijd:</strong> {appointment.time ? format(parseISO(appointment.time), 'PPpp') : 'Niet opgegeven'}
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={loadingDelete}
          >
            Annuleren
          </Button>
          <Button 
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loadingDelete}
            startIcon={loadingDelete && <CircularProgress size={16} />}
          >
            {loadingDelete ? 'Verwijderen...' : 'Verwijderen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditAppointment;
