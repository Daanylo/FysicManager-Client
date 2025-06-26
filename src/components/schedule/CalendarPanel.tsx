import React from 'react';
import { Typography, Paper, TextField } from '@mui/material';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface CalendarPanelProps {
  onDateSelected?: (date: Date | null) => void;
  selectedDate?: Date | null;
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ onDateSelected, selectedDate: propSelectedDate }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(propSelectedDate || new Date());

  // Sync internal state with prop changes
  React.useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
    if (onDateSelected) {
      onDateSelected(newDate);
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>      <Typography variant="h6" gutterBottom>
        Datum Selecteren & Notities
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={selectedDate}
          onChange={handleDateChange}
          sx={{ backgroundColor: 'transparent'}} // Ensuring calendar background is transparent
        />
      </LocalizationProvider>      <TextField
        label="Notities"
        multiline
        rows={4}
        variant="outlined"
        sx={{ mt: 2, flexGrow: 1 }}
      />
    </Paper>
  );
};

export default CalendarPanel;
