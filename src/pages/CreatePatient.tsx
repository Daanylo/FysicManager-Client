import React, { useState } from 'react';
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
import { createPatient } from '../services/api';
import { Patient } from '../types';

// Interface for the form data matching the Patient model in the API
interface PatientFormData extends Omit<Patient, 'id' | 'appointments'> {}

const CreatePatient: React.FC = () => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    dateOfBirth: new Date().toISOString().split('T')[0], // default to today
    medicalHistory: '',
    insuranceProvider: '',
    insuranceNumber: '',
    bsn: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    registrationDate: new Date().toISOString() // default to now
  });
  
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {};
    let isValid = true;

    // Required fields validation
    const requiredFields: Array<keyof PatientFormData> = [
      'name', 'surname', 'email', 'phone', 'dateOfBirth'
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
      const result = await createPatient(formData);
      
      setSuccessMessage(`Patient ${result.name} ${result.surname} created successfully!`);
      
      setFormData({
        name: '',
        surname: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        country: '',
        dateOfBirth: new Date().toISOString().split('T')[0],
        medicalHistory: '',
        insuranceProvider: '',
        insuranceNumber: '',
        bsn: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        registrationDate: new Date().toISOString()
      });
      
      // Close window after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (error) {
      setErrorMessage('Failed to create patient. Please try again.');
      console.error('Error creating patient:', error);
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
          New Patient Registration
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
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                    disabled={isSubmitting}
                    size="small"
                    margin="dense"
                  />
                  
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    error={!!errors.surname}
                    helperText={errors.surname}
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
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
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
                    value={formData.zipCode}
                    onChange={handleChange}
                    error={!!errors.zipCode}
                    helperText={errors.zipCode}
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
            
            {/* Medical Information Section */}
            <div>
              <Typography variant="subtitle1" sx={{ mb: 1, fontSize: '0.95rem', fontWeight: 'bold' }}>
                Medical Information
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  label="Medical History"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  error={!!errors.medicalHistory}
                  helperText={errors.medicalHistory}
                  multiline
                  minRows={2}
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="Insurance Provider"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                    error={!!errors.insuranceProvider}
                    helperText={errors.insuranceProvider}
                    disabled={isSubmitting}
                    size="small"
                    margin="dense"
                  />
                  
                  <TextField
                    fullWidth
                    label="Insurance Number"
                    name="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={handleChange}
                    error={!!errors.insuranceNumber}
                    helperText={errors.insuranceNumber}
                    disabled={isSubmitting}
                    size="small"
                    margin="dense"
                  />
                </Stack>
                
                <TextField
                  fullWidth
                  label="BSN Number"
                  name="bsn"
                  value={formData.bsn}
                  onChange={handleChange}
                  error={!!errors.bsn}
                  helperText={errors.bsn}
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
              </Stack>
            </div>
            
            <Divider sx={{ my: 0.5 }} />
            
            {/* Emergency Contact */}
            <div>
              <Typography variant="subtitle1" sx={{ mb: 1, fontSize: '0.95rem', fontWeight: 'bold' }}>
                Emergency Contact
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  error={!!errors.emergencyContactName}
                  helperText={errors.emergencyContactName}
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
                
                <TextField
                  fullWidth
                  label="Emergency Contact Phone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  error={!!errors.emergencyContactPhone}
                  helperText={errors.emergencyContactPhone}
                  disabled={isSubmitting}
                  size="small"
                  margin="dense"
                />
              </Stack>
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
                Register Patient
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

export default CreatePatient; 