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

interface SchedulePanelProps {
  selectedDate: Date;
  selectedTherapists: Therapist[];
  filteredTherapists?: Therapist[];
  refreshTrigger?: number; // Optional prop to trigger data refresh
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
  isAppointmentStart?: boolean; // New property to mark the start of an appointment
  appointmentDuration?: number; // New property to store the duration in slots
  workshift?: WorkshiftSimple;
  therapist: Therapist;
}

const SchedulePanel: React.FC<SchedulePanelProps> = ({ selectedDate, selectedTherapists, filteredTherapists = [], refreshTrigger }) => {
  const theme = useTheme();
  const [scheduleData, setScheduleData] = useState<Map<string, TherapistScheduleData>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which therapists to display
  const therapistsToShow = useMemo(() => {
    return selectedTherapists.length > 0 ? selectedTherapists : filteredTherapists;
  }, [selectedTherapists, filteredTherapists]);

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
          );          // Ensure appointments conform to AppointmentSimple interface
          const appointments: AppointmentSimple[] = appointmentsForDate.map(apt => ({
            id: apt.id,
            description: apt.description || '',
            patientId: apt.patient?.id || '',
            therapistId: apt.therapist?.id,
            practiceId: apt.practice?.id || '',
            appointmentTypeId: apt.appointmentType.id,
            time: apt.time,
            duration: apt.duration,
            notes: apt.notes || '',
            patient: apt.patient,
            appointmentType: apt.appointmentType
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

    fetchTherapistData();    // Cleanup
    return () => {
      abortController.abort();
    };
  }, [selectedDate, therapistsToShow, refreshTrigger]); // Add refreshTrigger to dependencies// Create time slots from 6:00 to 22:00 with 25-minute intervals
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

    // Calculate position based on time slots (25-minute intervals)
    const timeSlotHeight = 35; // Height of each time slot in pixels
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const currentMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    const pixelPosition = (currentMinutes / totalMinutes) * (timeSlots.length * timeSlotHeight);

    return {
      pixelPosition,
      time: format(now, 'HH:mm')
    };
  }, [selectedDate, timeSlots.length]);  // Create schedule for a therapist
  const createTherapistTimeSlots = (therapistData: TherapistScheduleData): TimeSlot[] => {
    const { workshifts, appointments, therapist } = therapistData;

    const slots = timeSlots.map(date => {
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
                practiceColor = shift.practice.color + '30';
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
      }      return {
        time: date,
        isWorkShift,
        practiceColor,
        textColor,
        appointment: undefined as AppointmentSimple | undefined,
        isAppointmentStart: false,
        appointmentDuration: 0,
        workshift: currentWorkshift,
        therapist,
      };
    });

    // Now handle appointments - mark appointment starts and calculate durations
    appointments.forEach(apt => {
      if (!apt.time || !apt.duration) return;
      
      try {
        const aptStart = parseISO(apt.time);
        const aptDurationMinutes = apt.duration;
        
        // Find the slot that corresponds to the appointment start time
        const startSlotIndex = slots.findIndex(slot => 
          Math.abs(slot.time.getTime() - aptStart.getTime()) < 12.5 * 60 * 1000 // Within 12.5 minutes
        );
        
        if (startSlotIndex !== -1) {
          // Calculate how many 25-minute slots this appointment spans
          const durationInSlots = Math.ceil(aptDurationMinutes / 25);
          
          // Mark the start slot
          slots[startSlotIndex].appointment = apt;
          slots[startSlotIndex].isAppointmentStart = true;
          slots[startSlotIndex].appointmentDuration = durationInSlots;
          
          // Mark the remaining slots as part of this appointment (but not the start)
          for (let i = 1; i < durationInSlots && startSlotIndex + i < slots.length; i++) {
            slots[startSlotIndex + i].appointment = apt;
            slots[startSlotIndex + i].isAppointmentStart = false;
            slots[startSlotIndex + i].appointmentDuration = 0; // Only the start slot has the full duration
          }
        }
      } catch (err) {
        console.error('Error processing appointment for time slots:', err);
      }
    });

    return slots;
  };
  const handleTimeSlotClick = (slot: TimeSlot) => {
    // Only allow clicking on empty workshift slots (not appointments)
    if (!slot.appointment && slot.isWorkShift && slot.workshift) {
      const timeString = format(slot.time, 'yyyy-MM-dd HH:mm:ss');
      const therapistId = slot.therapist.id;
      const therapistName = encodeURIComponent(slot.therapist.name || '');
      const practiceId = slot.workshift.practice?.id || '';
      const practiceName = encodeURIComponent(slot.workshift.practice?.name || '');
      
      // Create URL parameters for the appointment creation form
      const params = new URLSearchParams({
        time: timeString,
        therapistId: therapistId,
        therapistName: therapistName,
        practiceId: practiceId,
        practiceName: practiceName,
        duration: '25' // Default duration matching the time slot interval
      });
      
      // Open a new popup window for appointment creation
      const appointmentUrl = `/create-appointment?${params.toString()}`;
      
      const popup = window.open(
        appointmentUrl,
        'createAppointment',
        'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );
      
      if (popup) {
        popup.focus();
      } else {
        // Fallback if popup was blocked
        alert('Please enable popups for this site to create appointments.');
      }
    }
  };

  const handleAppointmentClick = (slot: TimeSlot) => {
    // Handle clicking on existing appointments for editing/deleting
    if (slot.appointment) {
      const appointmentId = slot.appointment.id;
      
      // Create URL parameters for the appointment editing form
      const params = new URLSearchParams({
        appointmentId: appointmentId,
      });
      
      // Open a new popup window for appointment editing
      const editUrl = `/edit-appointment?${params.toString()}`;
      
      const popup = window.open(
        editUrl,
        'editAppointment',
        'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );
      
      if (popup) {
        popup.focus();
      } else {
        // Fallback if popup was blocked
        alert('Please enable popups for this site to edit appointments.');
      }
    }  };

  // Function to get appointment colors based on appointment type
  const getAppointmentColors = (slot: TimeSlot) => {
    if (!slot.appointment) {
      return {
        backgroundColor: slot.practiceColor,
        textColor: slot.textColor,
        hoverBackgroundColor: slot.workshift?.practice?.color 
          ? `${slot.workshift.practice.color}60` 
          : theme.palette.primary.main,
        hoverTextColor: theme.palette.getContrastText(
          slot.workshift?.practice?.color || theme.palette.primary.main
        )
      };
    }

    // Use appointment type color if available
    const appointmentTypeColor = slot.appointment.appointmentType?.color;
    if (appointmentTypeColor) {
      return {
        backgroundColor: appointmentTypeColor,
        textColor: theme.palette.getContrastText(appointmentTypeColor),
        hoverBackgroundColor: appointmentTypeColor + 'DD', // Slightly darker on hover
        hoverTextColor: theme.palette.getContrastText(appointmentTypeColor)
      };
    }

    // Fallback to theme colors
    return {
      backgroundColor: theme.palette.secondary.light,
      textColor: theme.palette.getContrastText(theme.palette.secondary.light),
      hoverBackgroundColor: theme.palette.secondary.dark,
      hoverTextColor: theme.palette.getContrastText(theme.palette.secondary.dark)
    };
  };

  // Render "no therapists selected" state
  if (therapistsToShow.length === 0) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {/* Header row with therapist names */}
          <Box sx={{
            display: 'flex',
            position: 'sticky',
            top: 0,
            zIndex: 3,
            backgroundColor: theme.palette.background.paper,
            borderBottom: `2px solid ${theme.palette.divider}`
          }}>            {/* Empty space for time column */}
            <Box sx={{
              minWidth: '80px',
              flexShrink: 0,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.grey[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
                    width: `calc((100% - 80px) / ${therapistsToShow.length})`,
                    minWidth: '200px',
                    borderRight: `1px solid ${theme.palette.divider}`,
                    backgroundColor: hasError ? theme.palette.error.light : theme.palette.grey[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
          <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'auto', maxHeight: 'calc(100vh - 200px)', position: 'relative' }}>            {/* Current time indicator line */}
            {currentTimeIndicator && (
              <Box
                sx={{
                  position: 'absolute',
                  top: `${currentTimeIndicator.pixelPosition}px`,
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
            }}>              {timeSlots.map((time, index) => (
              <Box
                key={`time-${index}`}
                sx={{
                  height: '35px',
                  minHeight: '35px',
                  maxHeight: '35px',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  boxSizing: 'border-box'
                }}
              >
                {/* Time label positioned at the top border/divider line */}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.7rem',
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
                  >                    {/* Time slots for this therapist */}
                    <Box sx={{ flexGrow: 1 }}>                        {therapistTimeSlots.map((slot, slotIndex) => {
                        const appointmentColors = getAppointmentColors(slot);                          // If this slot is part of an appointment but not the start, render a clickable workshift slot
                        if (slot.appointment && !slot.isAppointmentStart) {
                          return (
                            <Box
                              key={`spacer-${slotIndex}`}
                              sx={{
                                height: '35px',
                                minHeight: '35px',
                                maxHeight: '35px',
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                backgroundColor: slot.isWorkShift ? slot.practiceColor : theme.palette.background.default,
                                cursor: slot.isWorkShift ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.7,
                                '&:hover': slot.isWorkShift ? {
                                  opacity: 1,
                                  backgroundColor: slot.workshift?.practice?.color 
                                    ? `${slot.workshift.practice.color}60` 
                                    : theme.palette.primary.main,
                                  transform: 'scale(1.02)',
                                  boxShadow: theme.shadows[2],
                                } : {}
                              }}
                              onClick={() => slot.isWorkShift ? handleTimeSlotClick(slot) : undefined}
                            >
                              {slot.isWorkShift && (
                                <Typography variant="caption" sx={{ 
                                  fontSize: '0.55rem',
                                  fontWeight: 'bold',
                                  textAlign: 'center',
                                  color: 'inherit',
                                  opacity: 0.8
                                }}>
                                  Click to create
                                </Typography>
                              )}
                            </Box>
                          );
                        }                        
                        // Calculate the exact height based on appointment duration
                        const baseSlotHeight = 35; // 25 minutes = 35px
                        const baseDuration = 25; // Base duration in minutes
                        const actualDuration = slot.appointment?.duration || baseDuration;
                        const slotHeight = slot.appointmentDuration && slot.appointmentDuration > 1 
                          ? `${(actualDuration / baseDuration) * baseSlotHeight}px`
                          : '35px';
                        return (                          <Box
                            key={`slot-${slotIndex}`}
                            sx={{
                              height: slotHeight,
                              minHeight: slotHeight,
                              maxHeight: slotHeight,
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              backgroundColor: hasError
                                ? theme.palette.action.disabledBackground
                                : appointmentColors.backgroundColor,
                              color: hasError
                                ? theme.palette.text.disabled
                                : appointmentColors.textColor,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              cursor: hasError 
                                ? 'default' 
                                : slot.appointment 
                                  ? 'pointer' 
                                  : slot.isWorkShift 
                                    ? 'pointer' 
                                    : 'default',
                              overflow: 'hidden',
                              boxSizing: 'border-box',
                              transition: 'all 0.2s ease-in-out',
                              position: 'relative',
                              zIndex: slot.appointment ? 2 : 1, // Appointment blocks on top
                              '&:hover': hasError 
                                ? {} 
                                : slot.appointment 
                                  ? {
                                      backgroundColor: appointmentColors.hoverBackgroundColor,
                                      color: appointmentColors.hoverTextColor,
                                      transform: 'scale(1.02)',
                                      boxShadow: theme.shadows[2],
                                      zIndex: 3,
                                    }
                                  : slot.isWorkShift 
                                    ? {
                                        backgroundColor: appointmentColors.hoverBackgroundColor,
                                        color: appointmentColors.hoverTextColor,
                                        transform: 'scale(1.02)',
                                        boxShadow: theme.shadows[2],
                                      }
                                    : {}
                            }}
                            onClick={() => slot.appointment ? handleAppointmentClick(slot) : handleTimeSlotClick(slot)} // Handle clicks based on slot type
                          >
                            {slot.appointment && !hasError && (                              <Box sx={{ 
                                overflow: 'hidden',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                height: '100%',
                                position: 'relative',
                                padding: slot.appointmentDuration && slot.appointmentDuration > 1 ? '6px' : '2px 4px',
                                '&:hover .edit-hint': {
                                  opacity: 1,
                                }
                              }}>                                <Typography variant="body2" sx={{ 
                                  fontWeight: 'bold', 
                                  fontSize: slot.appointmentDuration && slot.appointmentDuration > 1 ? '0.75rem' : '0.68rem', 
                                  lineHeight: slot.appointmentDuration && slot.appointmentDuration > 1 ? 1.3 : 1.1,
                                  marginBottom: slot.appointmentDuration && slot.appointmentDuration > 1 ? '2px' : '0px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: slot.appointmentDuration && slot.appointmentDuration > 1 ? 2 : 1,
                                  WebkitBoxOrient: 'vertical',
                                }}>
                                  {slot.appointment.description || 'Appointment'}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  fontSize: slot.appointmentDuration && slot.appointmentDuration > 1 ? '0.65rem' : '0.58rem', 
                                  lineHeight: slot.appointmentDuration && slot.appointmentDuration > 1 ? 1.2 : 1.1,
                                  marginBottom: slot.appointmentDuration && slot.appointmentDuration > 1 ? '2px' : '0px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: slot.appointmentDuration && slot.appointmentDuration > 1 ? 2 : 1,
                                  WebkitBoxOrient: 'vertical',
                                }}>
                                  {slot.appointment.patient?.firstName || slot.appointment.patient?.lastName ?
                                    `${slot.appointment.patient?.firstName || ''} ${slot.appointment.patient?.lastName || ''}` :
                                    `Patient ${slot.appointment.patientId ? '#' + slot.appointment.patientId.substring(0, 4) : ''}`
                                  }
                                </Typography>
                                {slot.appointmentDuration && slot.appointmentDuration > 1 && (
                                  <Typography variant="caption" sx={{ 
                                    fontSize: '0.6rem', 
                                    lineHeight: 1,
                                    opacity: 0.8,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    Duration: {slot.appointment.duration} min
                                  </Typography>
                                )}
                                <Typography 
                                  className="edit-hint"
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: '0.5rem', 
                                    fontWeight: 'bold',
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '4px',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    color: 'inherit',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    padding: '1px 3px',
                                    borderRadius: '2px',
                                    pointerEvents: 'none'
                                  }}
                                >
                                  EDIT
                                </Typography>
                              </Box>
                            )}
                            
                            {!slot.appointment && slot.isWorkShift && !hasError && (
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                width: '100%',
                                opacity: 0.6,
                                '&:hover': {
                                  opacity: 1,
                                }
                              }}>
                                <Typography variant="caption" sx={{ 
                                  fontSize: '0.6rem',
                                  fontWeight: 'bold',
                                  textAlign: 'center',
                                  color: 'inherit'
                                }}>
                                  Click to create appointment
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
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
