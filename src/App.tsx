import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScheduleView from './pages/ScheduleView';
import CreateAppointment from './pages/CreateAppointment';
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<ScheduleView />} />
          <Route path="/schedule" element={<ScheduleView />} />
          <Route path="/create-appointment" element={<CreateAppointment />} />
          {/* Add more routes here as you develop more views */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
