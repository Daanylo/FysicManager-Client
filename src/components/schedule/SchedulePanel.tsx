import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  useTheme,
  Alert,
} from '@mui/material';
import {
  format,
  addMinutes,
  startOfDay,
  eachMinuteOfInterval,
  isWithinInterval,
  parseISO,
  isSameDay,
} from 'date-fns';
import { AppointmentSimple } from '../../types/Simple/AppointmentSimple';
import { WorkshiftSimple } from '../../types/Simple/WorkshiftSimple';
import { Therapist } from '../../types/Therapist';
import { getTherapistWorkshifts, getTherapistAppointments } from '../../services/therapistAPI';
import { AppointmentType } from '../../types/AppointmentType';

interface SchedulePanelProps {
  selectedDate: Date;
  selectedTherapists: Therapist[];
  filteredTherapists?: Therapist[];
}

interface TherapistScheduleData {
  therapist: Therapist;
  workshifts: WorkshiftSimple[];
  appointments: AppointmentSimple[];
  loading: boolean;
  error?: string;
}

interface TimeSlot {
  time: Date;
  isWorkShift: boolean;
  practiceColor: string;
  textColor: string;
  appointment?: AppointmentSimple;
}

const SchedulePanel: React.FC<SchedulePanelProps> = ({ selectedDate, selectedTherapists, filteredTherapists = [] }) => {
  const theme = useTheme();
  const [scheduleData, setScheduleData] = useState<Map<string, TherapistScheduleData>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Determine which therapists to display
  const therapistsToShow = useMemo(() => {
    return selectedTherapists.length > 0 ? selectedTherapists : filteredTherapists;
  }, [selectedTherapists, filteredTherapists]);

  // Use a stable key to track which therapists and dates we've loaded
  const dataKey = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const therapistIds = therapistsToShow.map(t => t.id).sort().join(',');
    return `${dateStr}-${therapistIds}`;
  }, [selectedDate, therapistsToShow]);

  // Fetch data
  useEffect(() => {
    // If no therapists, don't fetch
    if (!therapistsToShow.length) {
      setScheduleData(new Map()); // Clear existing data
      setLoading(false); // Ensure loading is false
      setError(null); // Clear any previous errors
      return;
    }
    
    // Start loading
    setLoading(true);
    setError(null);
    
    // Abort controller to cancel requests if component unmounts or dependencies change
    const abortController = new AbortController();
    
    // For each therapist, fetch their workshifts and appointments
    const fetchTherapistData = async () => {
      const newScheduleData = new Map<string, TherapistScheduleData>();
      let anyErrors = false;
      
      // Fetch data for each therapist
      for (const therapist of therapistsToShow) {
        try {
          // Fetch workshifts and appointments
          const workshiftsPromise = getTherapistWorkshifts(therapist.id);
          const appointmentsPromise = getTherapistAppointments(therapist.id);
          
          const [allWorkshifts, allAppointments] = await Promise.all([
            workshiftsPromise,
            appointmentsPromise
          ]);
            // Filter for the selected date
          const workshifts = allWorkshifts.filter(ws => 
            ws.startTime && isSameDay(parseISO(ws.startTime), selectedDate)
          );
          
          const appointmentsForDate = allAppointments.filter(apt => 
            apt.time && isSameDay(parseISO(apt.time), selectedDate)
          );
          
          // Ensure appointments conform to AppointmentSimple interface
          const appointments: AppointmentSimple[] = appointmentsForDate.map(apt => ({
            id: apt.id,
            patientId: apt.patient?.id || '',
            therapistId: therapist.id,
            practiceId: apt.practice?.id || '',
            appointmentType: apt.appointmentType,
            time: apt.time,
            duration: apt.duration,
            notes: apt.notes || '',
            patient: apt.patient
          }));
          
          // Store the data
          newScheduleData.set(therapist.id, {
            therapist,
            workshifts,
            appointments,
            loading: false
          });
        } catch (err) {
          console.error(`Error fetching data for therapist ${therapist.name}:`, err);
          anyErrors = true;
          
          // Store an error state for this therapist
          newScheduleData.set(therapist.id, {
            therapist,
            workshifts: [],
            appointments: [],
            loading: false,
            error: `Failed to load data`
          });
        }
      }
      
      if (anyErrors) {
        setError('Some data could not be loaded. Please try again later.');
      }
      
      // Update state
      setScheduleData(newScheduleData);
      setLoading(false);
    };
    
    fetchTherapistData();
    
    // Cleanup
    return () => {
      abortController.abort();
    };
  }, [dataKey]); // Only re-run when dataKey changes (selectedDate or therapistsToShow changes)  // Create time slots from 6:00 to 22:00 with 25-minute intervals
  const timeSlots = useMemo(() => {
    const startTime = addMinutes(startOfDay(selectedDate), 6 * 60); // 6:00 AM
    const endTime = addMinutes(startOfDay(selectedDate), 22 * 60); // 10:00 PM
    return eachMinuteOfInterval(
      { start: startTime, end: endTime },
      { step: 25 } // 25-minute intervals
    );
  }, [selectedDate]);

  // Calculate current time indicator position
  const currentTimeIndicator = useMemo(() => {
    const now = new Date();
    
    // Only show indicator if the selected date is today
    if (!isSameDay(now, selectedDate)) {
      return null;
    }
    
    const startTime = addMinutes(startOfDay(selectedDate), 6 * 60); // 6:00 AM
    const endTime = addMinutes(startOfDay(selectedDate), 22 * 60); // 10:00 PM
    
    // Only show if current time is within schedule hours
    if (now < startTime || now > endTime) {
      return null;
    }
    
    // Calculate position as percentage from start of schedule
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const currentMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    const percentage = (currentMinutes / totalMinutes) * 100;
    
    return {
      percentage,
      time: format(now, 'HH:mm')
    };
  }, [selectedDate]);
  // Create schedule for a therapist
  const createTherapistTimeSlots = (therapistData: TherapistScheduleData): TimeSlot[] => {
    const { workshifts, appointments } = therapistData;
    
    return timeSlots.map(date => {
      let isWorkShift = false;
      let practiceColor = theme.palette.background.default; // Default background for non-workshift
      let textColor = theme.palette.text.primary;
      let currentWorkshift: WorkshiftSimple | undefined;

      // Check if this time slot is in the therapist's workshift
      for (const shift of workshifts) {
        if (shift.startTime && shift.endTime) {
          try {
            const shiftStart = parseISO(shift.startTime);
            const shiftEnd = parseISO(shift.endTime);
            if (isWithinInterval(date, { start: shiftStart, end: addMinutes(shiftEnd, -1) })) {
              isWorkShift = true;
              currentWorkshift = shift;
              
              // Use practice color if available, otherwise use a default work color
              if (shift.practice?.color) {
                practiceColor = shift.practice.color;
                textColor = theme.palette.getContrastText(practiceColor);
              } else {
                practiceColor = theme.palette.primary.light;
                textColor = theme.palette.getContrastText(theme.palette.primary.light);
              }
              break;
            }
          } catch (err) {
            console.error('Error parsing shift time:', err);
          }
        }
      }

      // Check if this time slot has an appointment
      let appointment: AppointmentSimple | undefined;
      try {
        appointment = appointments.find(apt => {
          if (!apt.time || !apt.duration) return false;
          const aptStart = parseISO(apt.time);
          const aptEnd = addMinutes(aptStart, apt.duration);
          return isWithinInterval(date, { start: aptStart, end: addMinutes(aptEnd, -1) });
        });
      } catch (err) {
        console.error('Error finding appointment for time slot:', err);
      }

      return {
        time: date,
        isWorkShift,
        practiceColor,
        textColor,
        appointment,
      };
    });
  };
  
  // Render "no therapists selected" state
  if (therapistsToShow.length === 0) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p:2 }}>
        <Typography variant="h6">Please select at least one therapist or filter by practice/specialization to see schedules.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1}}>
          <CircularProgress />
        </Box>      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {/* Header row with therapist names */}
          <Box sx={{ 
            display: 'flex', 
            position: 'sticky', 
            top: 0, 
            zIndex: 3,
            backgroundColor: theme.palette.background.paper,
            borderBottom: `2px solid ${theme.palette.divider}`
          }}>
            {/* Empty space for time column */}
            <Box sx={{ 
              minWidth: '80px', 
              flexShrink: 0, 
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.grey[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
              height: '60px'
            }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                Time
              </Typography>
            </Box>
            
            {/* Therapist name headers */}
            {therapistsToShow.map((therapist) => {
              const therapistData = scheduleData.get(therapist.id);
              const hasError = !!therapistData?.error;
              
              return (
                <Box 
                  key={`header-${therapist.id}`}
                  sx={{ 
                    minWidth: '200px', 
                    flexGrow: 1,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    backgroundColor: hasError ? theme.palette.error.light : theme.palette.grey[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1,
                    height: '60px'
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                    {therapist.name}
                    {hasError && " (Error)"}
                  </Typography>
                </Box>
              );
            })}
          </Box>          {/* Scrollable content area */}
          <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'auto', maxHeight: 'calc(100vh - 200px)', position: 'relative' }}>
            {/* Current time indicator line */}
            {currentTimeIndicator && (
              <Box
                sx={{
                  position: 'absolute',
                  top: `${currentTimeIndicator.percentage}%`,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: theme.palette.error.main,
                  zIndex: 10,
                  pointerEvents: 'none',
                  '&::before': {
                    content: `"${currentTimeIndicator.time}"`,
                    position: 'absolute',
                    left: '4px',
                    top: '-12px',
                    backgroundColor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap'
                  }
                }}
              />
            )}{/* Time column */}
            <Box sx={{ 
              minWidth: '80px', 
              flexShrink: 0, 
              borderRight: `1px solid ${theme.palette.divider}`, 
              position: 'sticky',
              left: 0,
              backgroundColor: theme.palette.background.paper,
              zIndex: 2
            }}>
              {timeSlots.map((time, index) => (
                <Box
                  key={`time-${index}`}
                  sx={{
                    height: '50px',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    position: 'relative'
                  }}
                >
                  {/* Time label positioned at the top border/divider line */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 'normal',
                      color: theme.palette.text.primary,
                      position: 'absolute',
                      top: '-8px', // Position at the divider line
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: theme.palette.background.paper,
                      px: 0.5,
                      zIndex: 1
                    }}
                  >
                    {format(time, 'HH:mm')}
                  </Typography>
                </Box>
              ))}</Box>
            
            {/* Therapist columns container - single scroll for all */}
            <Box sx={{ display: 'flex', flexGrow: 1, minWidth: 0 }}>
              {therapistsToShow.map((therapist) => {
                const therapistData = scheduleData.get(therapist.id) || {
                  therapist,
                  workshifts: [],
                  appointments: [],
                  loading: false,
                  error: undefined
                };
                const therapistTimeSlots = createTherapistTimeSlots(therapistData);
                const hasError = !!therapistData.error;
                
                return (
                  <Box 
                    key={`therapist-${therapist.id}`}
                    sx={{ 
                      minWidth: '200px', 
                      flexGrow: 1,
                      borderRight: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Time slots for this therapist */}
                    <Box sx={{ flexGrow: 1 }}>                      {therapistTimeSlots.map((slot, slotIndex) => (
                        <Box
                          key={`slot-${slotIndex}`}
                          sx={{
                            p: 0.5,
                            height: '50px',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            backgroundColor: hasError 
                              ? theme.palette.action.disabledBackground
                              : (slot.appointment ? theme.palette.info.light : slot.practiceColor),
                            color: hasError
                              ? theme.palette.text.disabled
                              : (slot.appointment ? theme.palette.getContrastText(theme.palette.info.light) : slot.textColor),
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            cursor: slot.appointment ? 'pointer' : 'default',
                            '&:hover': slot.appointment ? {
                              backgroundColor: theme.palette.info.dark,
                              color: theme.palette.getContrastText(theme.palette.info.dark)
                            } : {}
                          }}
                        >
                          {slot.appointment && !hasError && (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.7rem', lineHeight: 1.2 }}>
                                {slot.appointment.appointmentType?.name || 'Appointment'}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                                {slot.appointment.patient?.firstName || slot.appointment.patient?.lastName ? 
                                  `${slot.appointment.patient?.firstName || ''} ${slot.appointment.patient?.lastName || ''}` : 
                                  `Patient ${slot.appointment.patientId ? '#' + slot.appointment.patientId.substring(0, 4) : ''}`
                                }
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SchedulePanel;
