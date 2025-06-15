import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import {
    Container,
    Paper,
    Typography,
    CircularProgress,
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    Stack, // Added Stack
    Divider, // Added Divider
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { getAppointment, updateAppointment, getPatients, getTherapists, deleteAppointment, updateAppointmentSimple } from '../services/patientAPI';
import { 
  Appointment, 
  Patient, 
  Therapist, 
  AppointmentStatus, 
  AppointmentType
} from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format, parseISO, setHours, setMinutes, setSeconds, setMilliseconds, isValid, addMinutes } from 'date-fns';
import { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const AppointmentEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate(); // Hook for navigation
    const appointmentId = parseInt(id || '0', 10);

    const [appointment, setAppointment] = useState<Partial<Appointment> | null>(null); // Use Partial for easier updates
    const [originalAppointment, setOriginalAppointment] = useState<Appointment | null>(null); // Store original for comparison/reset
    const [patients, setPatients] = useState<Patient[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Separate state for date and time parts for easier input handling
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState<number>(30);

    useEffect(() => {
        const fetchData = async () => {
            if (!appointmentId) {
                setError('Invalid Appointment ID.');
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null); // Clear previous errors
            try {
                const [appointmentData, patientsData, therapistsData] = await Promise.all([
                    getAppointment(appointmentId),
                    getPatients(),
                    getTherapists()
                ]);

                console.log('Loaded appointment data:', appointmentData);
                
                // Process the appointment data to ensure status and type are numeric enum values
                // This handles cases where the API returns string values instead of numeric enum values
                const processedAppointment = {
                    ...appointmentData,
                    // Handle string status: convert to enum value if it's a string
                    status: typeof appointmentData.status === 'string' 
                        ? AppointmentStatus[appointmentData.status as keyof typeof AppointmentStatus] 
                        : appointmentData.status,
                    // Handle string type: convert to enum value if it's a string
                    type: typeof appointmentData.type === 'string'
                        ? AppointmentType[appointmentData.type as keyof typeof AppointmentType]
                        : appointmentData.type
                };
                
                console.log('Processed appointment data:', processedAppointment);
                
                // Keep state numeric for enums
                setAppointment(processedAppointment);
                setOriginalAppointment(processedAppointment); 
                setPatients(patientsData); 
                setTherapists(therapistsData); 

                // Initialize date/time parts
                if (processedAppointment.startTime) {
                    const start = parseISO(processedAppointment.startTime);
                    setSelectedDate(start);
                    setSelectedTime(format(start, 'HH:mm'));
                }
                
                // Set duration minutes
                if (processedAppointment.durationMinutes) {
                    setDurationMinutes(processedAppointment.durationMinutes);
                } else if (processedAppointment.startTime && processedAppointment.endTime) {
                    // Calculate duration from start and end times if available
                    const start = parseISO(processedAppointment.startTime);
                    const end = parseISO(processedAppointment.endTime);
                    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                    setDurationMinutes(durationInMinutes > 0 ? durationInMinutes : 30);
                } else {
                    // Default to 30 minutes
                    setDurationMinutes(30);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load appointment details. Appointment may not exist or API is unavailable.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [appointmentId]);

    // Update startTime when date or time changes
    useEffect(() => {
        if (selectedDate && selectedTime) {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours, minutes, 0, 0);

            setAppointment(prev => prev ? {
                ...prev,
                startTime: newDate.toISOString()
            } : null);
        }
    }, [selectedDate, selectedTime]);

    // Generic handler for simple value changes
    const handleSimpleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        const { name, value } = event.target;
        if (appointment && name) {
             // Handle specific enum conversions for status/type
            let finalValue = value;
            if (name === 'status' && typeof value === 'string') {
                finalValue = AppointmentStatus[value as keyof typeof AppointmentStatus];
            } else if (name === 'type' && typeof value === 'string') {
                finalValue = AppointmentType[value as keyof typeof AppointmentType];
            }
            
            setAppointment(prev => ({
                ...prev,
                [name]: finalValue,
            }));
        }
    };

    // Dedicated handler for Select components
    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        if (appointment && name) {
            let finalValue: string | number | undefined = value;
            // Convert string enum name back to numeric value for state
            if (name === 'status') {
                finalValue = AppointmentStatus[value as keyof typeof AppointmentStatus];
            } else if (name === 'type') {
                finalValue = AppointmentType[value as keyof typeof AppointmentType];
            }
            
            setAppointment(prev => ({
                ...prev,
                [name]: finalValue,
            }));
        }
    };

    // Handlers for date/time parts
    const handleDateChange = (newDate: Date | null) => {
        setSelectedDate(newDate);
    };
    
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedTime(e.target.value);
    };
    
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setDurationMinutes(value);
            setAppointment(prev => prev ? {
                ...prev,
                durationMinutes: value
            } : null);
        }
    };

    const handleSave = async () => {
        if (!appointment || !originalAppointment) return;

        // --- Combine Date and Time ---
        let combinedStartTimeISO: string | undefined = undefined;

        try {
            const [startHour, startMinute] = selectedTime.split(':').map(Number);
            let baseStartDate = selectedDate 
                ? parseISO(format(selectedDate, 'yyyy-MM-dd') + "T00:00:00") 
                : new Date(); // Use selectedDate with null check
            if (!isValid(baseStartDate)) throw new Error("Invalid date part");

            let combinedStartDateTime = setMilliseconds(setSeconds(setMinutes(setHours(baseStartDate, startHour), startMinute), 0), 0);
            if (!isValid(combinedStartDateTime)) throw new Error("Invalid start time combination");

            // Compensate for timezone before converting to ISO string
            const timezoneOffsetMinutes = combinedStartDateTime.getTimezoneOffset();
            const adjustedStart = new Date(combinedStartDateTime.getTime() - timezoneOffsetMinutes * 60 * 1000);
            combinedStartTimeISO = adjustedStart.toISOString();

            // Prepare minimal data to update to avoid tracking conflicts
            const updateData: Partial<Appointment> = {
                id: appointmentId,
                patientId: appointment.patientId,
                therapistId: appointment.therapistId,
                startTime: combinedStartTimeISO,
                durationMinutes: durationMinutes,
                status: appointment.status,
                type: appointment.type,
                notes: appointment.notes || ''
            };
            
            // Remove navigation properties to avoid tracking conflicts
            delete updateData.patient;
            delete updateData.therapist;
            
            console.log('Sending update data:', updateData);
            
            setIsSaving(true);
            setError(null);
            setSuccessMessage(null);

            try {
                let updatedAppointmentData;
                
                // Always use the simplified update approach to avoid tracking issues
                console.log("Using simplified update approach");
                updatedAppointmentData = await updateAppointmentSimple(appointmentId, updateData);
                
                console.log("Appointment updated successfully:", updatedAppointmentData);
                
                // Update state with the returned data
                setAppointment(updatedAppointmentData);
                setOriginalAppointment(updatedAppointmentData);

                // Update date/time parts from response
                if (updatedAppointmentData.startTime) {
                    const updatedStart = parseISO(updatedAppointmentData.startTime);
                    setSelectedDate(updatedStart);
                    setSelectedTime(format(updatedStart, 'HH:mm'));
                }
                
                // Post message to parent window if this is a popup
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'APPOINTMENT_UPDATED',
                        appointment: updatedAppointmentData
                    }, '*');
                    setSuccessMessage('Appointment updated successfully!');
                    // Close window after short delay
                    setTimeout(() => window.close(), 1500);
                } else {
                    setSuccessMessage('Appointment updated successfully!');
                }
            } catch (innerError: any) {
                console.error('Error updating appointment:', innerError);
                
                // Extract more helpful error message if available
                let errorMessage = 'Please reload and try again.';
                
                if (innerError.message) {
                    errorMessage = innerError.message;
                }
                
                if (innerError.response && innerError.response.data) {
                    // Try to extract a meaningful error message from the response
                    if (typeof innerError.response.data === 'string') {
                        errorMessage = innerError.response.data;
                    } else if (innerError.response.data.message) {
                        errorMessage = innerError.response.data.message;
                    } else if (innerError.response.data.error) {
                        errorMessage = innerError.response.data.error;
                    }
                    
                    // If the error contains an Entity Framework tracking exception, show a more helpful message
                    if (errorMessage.includes('entity type') && errorMessage.includes('cannot be tracked')) {
                        errorMessage = 'Database conflict: The appointment is already being modified. Please refresh and try again.';
                    }
                }
                
                setError(`Failed to update appointment: ${errorMessage}`);
            }
        } catch (err: any) {
            console.error('Error updating appointment:', err);
            
            // Extract more helpful error message if available
            let errorMessage = 'Please try again later.';
            
            if (err.message) {
                errorMessage = err.message;
            }
            
            setError(`Failed to update appointment: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Handler for deleting the appointment
    const handleDelete = async () => {
        if (!appointmentId) return;

        if (window.confirm('Are you sure you want to permanently delete this appointment?')) {
            setDeleting(true);
            setError(null);
            setSuccessMessage(null);

            try {
                await deleteAppointment(appointmentId);
                setSuccessMessage('Appointment deleted successfully!');
                
                // Check if this is inside a popup window
                if (window.opener) {
                    // If in a popup, close this window
                    window.close();
                } else {
                    // Otherwise redirect back after a short delay
                    setSuccessMessage('Appointment deleted successfully! Redirecting...');
                    setTimeout(() => navigate(-1), 1500);
                }
            } catch (err: any) {
                console.error('Error deleting appointment:', err);
                setError(`Failed to delete appointment: ${err.message || 'Please try again.'}`);
                setDeleting(false);
            }
            // No finally block needed as success navigates away or closes window
        }
    };

    const handleCloseSnackbar = () => {
        setError(null);
        setSuccessMessage(null);
    };

    const openDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    // Show specific error if loading failed and we have no data at all
    if (error && !originalAppointment) {
        return (
            <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h5" color="error" gutterBottom>Error</Typography>
                    <Typography>{error}</Typography>
                    <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 2 }}>
                        Go Back
                    </Button>
                </Paper>
            </Container>
        );
    }

    // If loading finished but somehow appointment is still null (should be caught by error above)
    if (!appointment) {
         return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography>Appointment data could not be loaded.</Typography></Box>;
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontSize: '1.2rem' }}>
                        Edit Appointment
                    </Typography>
                    <IconButton 
                        aria-label="delete" 
                        color="error" 
                        onClick={openDeleteDialog}
                        disabled={isSaving || deleting}
                        size="small"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>

                <Box component="form" onSubmit={handleSave} noValidate>
                    <Stack spacing={1.5}>
                        {/* Patient & Therapist Section */}
                        <Stack spacing={1.5}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel id="patient-label">Patient</InputLabel>
                                <Select
                                    labelId="patient-label"
                                    name="patientId"
                                    value={patients.length > 0 ? appointment.patientId?.toString() || '' : ''}
                                    label="Patient"
                                    onChange={(e) => handleSimpleChange({ target: { name: 'patientId', value: Number(e.target.value) } } as any)}
                                    disabled={isSaving}
                                >
                                    {patients.map(patient => (
                                        <MenuItem key={patient.id} value={patient.id.toString()}>
                                            {patient.name} {patient.surname} ({patient.email})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth size="small" required>
                                <InputLabel id="therapist-label">Therapist</InputLabel>
                                <Select
                                    labelId="therapist-label"
                                    name="therapistId"
                                    value={therapists.length > 0 ? appointment.therapistId?.toString() || '' : ''}
                                    label="Therapist"
                                    onChange={(e) => handleSimpleChange({ target: { name: 'therapistId', value: Number(e.target.value) } } as any)}
                                    disabled={isSaving}
                                >
                                    {therapists.map(therapist => (
                                        <MenuItem key={therapist.id} value={therapist.id.toString()}>
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
                                    disabled={isSaving}
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
                                disabled={isSaving}
                                size="small"
                                margin="dense"
                            />
                        </Stack>
                        
                        <TextField
                            label="Duration (minutes)"
                            type="number"
                            name="durationMinutes"
                            value={durationMinutes}
                            onChange={handleDurationChange}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: 1, step: 5 }}
                            fullWidth
                            required
                            disabled={isSaving}
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
                                    value={appointment.status !== undefined ? String(appointment.status) : ''}
                                    label="Status"
                                    onChange={handleSelectChange}
                                    disabled={isSaving}
                                >
                                    {Object.values(AppointmentStatus)
                                        .filter(value => typeof value === 'string')
                                        .map((status, index) => (
                                            <MenuItem key={index} value={String(index)}>
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
                                    value={appointment.type !== undefined ? String(appointment.type) : ''}
                                    label="Type"
                                    onChange={handleSelectChange}
                                    disabled={isSaving}
                                >
                                    {Object.values(AppointmentType)
                                        .filter(value => typeof value === 'string')
                                        .map((type, index) => (
                                            <MenuItem key={index} value={String(index)}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Stack>
                        
                        <TextField
                            label="Notes"
                            name="notes"
                            value={appointment.notes || ''}
                            onChange={handleSimpleChange}
                            fullWidth
                            multiline
                            minRows={2}
                            disabled={isSaving}
                            size="small"
                            margin="dense"
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate(-1)}
                                disabled={isSaving || deleting}
                                size="small"
                            >
                                Cancel
                            </Button>
                            
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSaving || deleting}
                                startIcon={isSaving ? <CircularProgress size={16} /> : null}
                                size="small"
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={closeDeleteDialog}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title" sx={{ fontSize: '1.1rem' }}>
                    Delete Appointment
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description" sx={{ fontSize: '0.9rem' }}>
                        Are you sure you want to delete this appointment? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDialog} disabled={deleting} size="small">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : null}
                        size="small"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Snackbars for feedback */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
            
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AppointmentEditPage;
