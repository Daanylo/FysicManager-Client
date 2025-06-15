import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { getPatient, updatePatient } from '../services/patientAPI';
import { Patient } from '../types/Patient';

// Interface for the form data matching the Patient model in the API
interface PatientFormData extends Omit<Patient, 'id' | 'appointments'> {}

const EditPatient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = id || '';
  
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    dateOfBirth: new Date().toISOString().split('T')[0],
    bsn: '',
  });
  
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load patient data
  useEffect(() => {
    const loadPatient = async () => {
      
      try {
        const patient = await getPatient(patientId);
        
        // Format date of birth for HTML date input (YYYY-MM-DD)
        const formattedDateOfBirth = patient.dateOfBirth 
          ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
          : '';
          
        setFormData({
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          email: patient.email || '',
          phoneNumber: patient.phoneNumber || '',
          address: patient.address || '',
          city: patient.city || '',
          postalCode: patient.postalCode || '',
          country: patient.country || '',
          dateOfBirth: formattedDateOfBirth,
          bsn: patient.bsn || '',
        });
      } catch (error) {
        console.error('Error loading patient:', error);
        setErrorMessage('Failed to load patient information');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatient();
  }, [patientId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {};
    let isValid = true;

    // Required fields validation
    const requiredFields: Array<keyof PatientFormData> = [
      'firstName', 'lastName'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
        isValid = false;
      }
    });

    // Email validation
    if (formData.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      await updatePatient(patientId, formData);
      setSuccessMessage('Patient updated successfully!');
      
      // Close window after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (error) {
      console.error('Error updating patient:', error);
      setErrorMessage('Failed to update patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  const handleSnackbarClose = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        py: 2, 
        height: '100vh', 
        overflow: 'auto' 
      }}
    >
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ fontSize: '1.2rem', mb: 1 }}>
          Edit Patient
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
          <Stack spacing={1.5}>
            {/* Personal Information */}
            <div>
              <Typography variant="subtitle1" sx={{ mb: 1, fontSize: '0.95rem', fontWeight: 'bold' }}>
                Personal Information
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="name"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    required
                    disabled={isSubmitting}
                    size="small"
                    margin="dense"
                  />
                  
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="surname"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    required
                    disabled={isSubmitting}
                    size="small"
                    margin="dense"
                  />
                </Stack>
                
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
                
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  required
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
                
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
              </Stack>
            </div>
            
            <Divider sx={{ my: 0.5 }} />
            
            {/* Address Section */}
            <div>
              <Typography variant="subtitle1" sx={{ mb: 1, fontSize: '0.95rem', fontWeight: 'bold' }}>
                Address
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={!!errors.address}
                  helperText={errors.address}
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={!!errors.city}
                    helperText={errors.city}
                    disabled={isSubmitting}
                    size="small"
                    margin="dense"
                  />
                  
                  <TextField
                    fullWidth
                    label="Zip Code"
                    name="zipCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    error={!!errors.postalCode}
                    helperText={errors.postalCode}
                    disabled={isSubmitting}
                    size="small"
                    margin="dense"
                  />
                </Stack>
                
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  error={!!errors.country}
                  helperText={errors.country}
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
              </Stack>
            </div>
            
            <Divider sx={{ my: 0.5 }} />
            {/* BSN Section */}
            <div>
              <Typography variant="subtitle1" sx={{ mb: 1, fontSize: '0.95rem', fontWeight: 'bold' }}>
                BSN (Burgerservicenummer)
              </Typography>
              <TextField
                fullWidth
                label="BSN"
                name="bsn"
                value={formData.bsn}
                onChange={handleChange}
                error={!!errors.bsn}
                helperText={errors.bsn}
                disabled={isSubmitting}
                size="small"
                margin="dense"
              />
            </div>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button 
                type="button" 
                variant="outlined" 
                onClick={handleClose}
                disabled={isSubmitting}
                size="small"
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
                size="small"
              >
                Save Changes
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
      
      {/* Success and Error Snackbars */}
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
      
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditPatient; 