import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { Patient } from '../../types/Patient';
import { getAllPatients, getPatient } from '../../services/patientAPI';
import { format } from 'date-fns';

const PatientPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState<boolean>(false);
  const [openAutocomplete, setOpenAutocomplete] = useState(false);

  useEffect(() => {
    if (searchTerm.length > 1) { // Start searching after 2 characters
      setLoadingSearch(true);
      const fetchPatients = async () => {
        try {
          // In a real scenario, the API would filter by searchTerm
          const allPatients = await getAllPatients();
          // Frontend filtering for now, replace with backend search
          const filtered = allPatients.filter(
            (p) =>
              p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setPatients(filtered);
        } catch (error) {
          console.error("Failed to fetch patients:", error);
          setPatients([]);
        }
        setLoadingSearch(false);
      };
      fetchPatients();
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  const handlePatientSelect = async (event: any, value: Patient | null) => {
    if (value) {
      setLoadingPatientDetails(true);
      try {
        const patientDetails = await getPatient(value.id);
        setSelectedPatient(patientDetails);
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
        setSelectedPatient(null);
      }
      setLoadingPatientDetails(false);
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Patient Information
      </Typography>
      <Autocomplete
        open={openAutocomplete}
        onOpen={() => setOpenAutocomplete(true)}
        onClose={() => setOpenAutocomplete(false)}
        options={patients}
        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
        loading={loadingSearch}
        onInputChange={(event, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        onChange={handlePatientSelect}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Patient"
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
        <Box>
          <Typography variant="subtitle1">Name: {selectedPatient.firstName} {selectedPatient.lastName}</Typography>
          {selectedPatient.dateOfBirth && (
            <Typography variant="body2">DOB: {format(new Date(selectedPatient.dateOfBirth), 'dd/MM/yyyy')}</Typography>
          )}
          <Typography variant="body2">Contact: {selectedPatient.phoneNumber || 'N/A'}</Typography>
          <Typography variant="body2">Email: {selectedPatient.email || 'N/A'}</Typography>
          <Typography variant="body2">BSN: {selectedPatient.bsn || 'N/A'}</Typography>
          <Typography variant="body2">Address: {`${selectedPatient.address || ''} ${selectedPatient.postalCode || ''} ${selectedPatient.city || ''}`.trim() || 'N/A'}</Typography>
          {/* Display more patient details here */}
        </Box>
      )}
    </Paper>
  );
};

export default PatientPanel;
