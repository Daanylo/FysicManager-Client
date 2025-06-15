import React, { useState, useEffect } from 'react';
import { CssBaseline, Box, ThemeProvider, createTheme, Alert, Snackbar } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import FilterBar from './components/FilterBar';
import PatientPanel from './components/PatientPanel';
import ScheduleView from './components/ScheduleView';
import CalendarPanel from './components/CalendarPanel';
import CreatePatient from './pages/CreatePatient';
import EditPatient from './pages/EditPatient';
import AppointmentEditPage from './pages/AppointmentEditPage';
import CreateAppointmentPage from './pages/CreateAppointmentPage';
import AdminPage from './pages/AdminPage';
import { getTherapists, getTherapistsByPractice } from './services/patientAPI';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2d8e7e',
    },
    secondary: {
      main: '#c2cd05',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

// Main dashboard component
const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTherapistIds, setSelectedTherapistIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development (remove when backend is ready)
  useEffect(() => {
    // This is a fallback if the API calls fail
    const mockTherapistIds = [1, 2]; // Mock therapist IDs
    
    const fetchTherapists = async () => {
      try {
        const therapists = await getTherapists();
        console.log('Available therapists:', therapists);
        
        if (therapists.length > 0) {
          // Select all available therapists by default
          const allTherapistIds = therapists.map(t => t.id);
          console.log('Selecting all therapist IDs:', allTherapistIds);
          
          setSelectedTherapistIds(allTherapistIds);
        } else {
          // Use mock data if API returned empty results
          console.info('No therapists returned from API, using mock IDs');
          setSelectedTherapistIds(mockTherapistIds);
        }
      } catch (error) {
        console.error('Failed to fetch therapists:', error);
        setError('Failed to load therapists. Using demo mode with mock data.');
        
        // Use mock data in case of API error
        setSelectedTherapistIds(mockTherapistIds);
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    };
    
    fetchTherapists();
  }, []);

  const handlePracticesChange = async (practiceIds: number[]) => {
    if (practiceIds.length > 0) {
      try {
        // Get therapists for the selected practices
        const therapists = await Promise.all(
          practiceIds.map(id => getTherapistsByPractice(id))
        );
        
        // Flatten the array and remove duplicates
        const allTherapists = therapists.flat();
        const uniqueTherapistIds = Array.from(new Set(allTherapists.map(t => t.id)));
        
        setSelectedTherapistIds(uniqueTherapistIds);
      } catch (error) {
        console.error('Error fetching therapists by practice:', error);
        setError('Failed to load therapists for the selected practices.');
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    } else {
      // If no practices selected, clear therapist selection
      setSelectedTherapistIds([]);
    }
  };

  const handleSpecializationsChange = (specializationIds: number[]) => {
    // Filter therapists based on selected specializations
    // This would typically be an API call, but since we don't have a specific endpoint
    // in the controllers for this, we'll just log it for now
    console.log('Selected specializations:', specializationIds);
  };

  const handlePatientSelect = (patientId: number) => {
    console.log('Patient selected in Dashboard:', patientId); // Keep log for potential future use
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewInSchedule = (appointmentDate: Date, therapistId: number) => {
    // Set the selected date to the appointment date
    setSelectedDate(appointmentDate);
    
    // Make sure the therapist is selected
    if (!selectedTherapistIds.includes(therapistId)) {
      setSelectedTherapistIds(prev => [...prev, therapistId]);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        {/* Top Navigation Bar */}
        <NavBar />
        
        {/* Filters Bar */}
        <FilterBar 
          onPracticesChange={handlePracticesChange}
          onSpecializationsChange={handleSpecializationsChange}
        />
        
        {/* Main Content Area */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          p: 2, 
          gap: 2,
          overflow: 'hidden' 
        }}>
          {/* Left Panel - Patient Information */}
          <Box sx={{ width: '25%', overflow: 'hidden' }}>
            <PatientPanel 
              onPatientSelect={handlePatientSelect} 
              onViewInSchedule={handleViewInSchedule}
            />
          </Box>
          
          {/* Middle Panel - Schedule View */}
          <Box sx={{ width: '50%', overflow: 'hidden' }}>
            <ScheduleView 
              selectedTherapistIds={selectedTherapistIds}
              selectedDate={selectedDate}
            />
          </Box>
          
          {/* Right Panel - Calendar */}
          <Box sx={{ width: '25%', overflow: 'hidden' }}>
            <CalendarPanel 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </Box>
        </Box>
      </Box>
      
      {/* Error Notification */}
      <Snackbar 
        open={error !== null} 
        autoHideDuration={5000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="warning" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-patient" element={<CreatePatient />} />
          <Route path="/edit-patient/:id" element={<EditPatient />} />
          <Route path="/appointments/edit/:id" element={<AppointmentEditPage />} />
          <Route path="/appointment/create" element={<CreateAppointmentPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
