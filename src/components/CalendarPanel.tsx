import React, { useState } from 'react';
import { Paper, Box, Typography, IconButton } from '@mui/material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface CalendarPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

// Update the order of week days to start with Monday
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarPanel: React.FC<CalendarPanelProps> = ({ selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateChange(date);
    setCurrentMonth(startOfMonth(date));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Adjust startOfWeek and endOfWeek to use Monday as the start day
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  return (
    <Paper sx={{ 
      height: 'auto',
      display: 'flex', 
      flexDirection: 'column', 
      p: 1.5,
      overflow: 'visible'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1
      }}>
        <IconButton onClick={handlePrevMonth} size="small">
          <ArrowBackIcon fontSize="small"/>
        </IconButton>
        <Typography variant="body1" fontWeight="bold">
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>
        <IconButton onClick={handleNextMonth} size="small">
          <ArrowForwardIcon fontSize="small"/>
        </IconButton>
      </Box>

      {/* Weekday headers */}
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 0.5 }}>
        {weekDays.map(day => (
          <Typography 
            key={day}
            variant="caption" 
            sx={{ 
              width: '14.28%', // Ensure 7 columns
              textAlign: 'center', 
              fontWeight: 'bold',
              fontSize: '0.65rem',
            }}
          >
            {day.toUpperCase()}
          </Typography>
        ))}
      </Box>
        
      {/* Calendar days grid using flexbox */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const today = isToday(day);

          return (
            <Box 
              key={day.toISOString()} 
              sx={{ width: '14.28%', display: 'flex', justifyContent: 'center', mb: 0.5 }} // Each day takes 1/7th width
            >
              <Box
                onClick={() => handleDateClick(day)}
                sx={{
                  height: 28,
                  width: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'primary.main' : (today ? 'rgba(45, 142, 126, 0.2)' : 'transparent'),
                  color: isSelected ? 'white' : (isCurrentMonth ? 'text.primary' : 'text.disabled'),
                  fontWeight: isSelected || today ? 'bold' : 'normal',
                  border: today && !isSelected ? `1px solid rgba(45, 142, 126, 0.5)` : 'none',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                {format(day, 'd')}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default CalendarPanel; 