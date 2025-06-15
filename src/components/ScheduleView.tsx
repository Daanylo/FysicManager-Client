import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, CircularProgress, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Therapist, Appointment, TimeSlot, Patient, AppointmentStatus, AppointmentType, WorkShift } from '../types';
import { getTherapist, getTherapistWorkshifts } from '../services/therapistAPI';
import { getAllPatients } from '../services/patientAPI';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format, parseISO, addMinutes } from 'date-fns';

interface ScheduleViewProps {
  selectedTherapists: Therapist[];
  selectedDate: Date;
}

// Define the hours to display in the schedule
const SCHEDULE_START_HOUR = 6; // 6:00
const SCHEDULE_END_HOUR = 21; // 21:00
const HOUR_HEIGHT = 60; // 60px per hour

const ScheduleView: React.FC<ScheduleViewProps> = ({ selectedTherapists, selectedDate }) => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Generate time slots
  const timeSlots: TimeSlot[] = [];
  for (let hour = SCHEDULE_START_HOUR; hour < SCHEDULE_END_HOUR; hour++) {
    timeSlots.push({ 
      start: `${hour.toString().padStart(2, '0')}:00`, 
      end: `${hour.toString().padStart(2, '0')}:30` 
    });
    timeSlots.push({ 
      start: `${hour.toString().padStart(2, '0')}:30`, 
      end: `${(hour + 1).toString().padStart(2, '0')}:00` 
    });
  }

  // Load patients for the appointment form (still needed for updating state after creation)
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientData = await getAllPatients();
        setPatients(patientData);
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    loadPatients();
  }, []);

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (selectedTherapists.length > 0) {
          // Always load all selected therapists first
          const therapistsData = await Promise.all(
            selectedTherapists.map(therapist => getTherapist(therapist.id))
          );
          setTherapists(therapistsData);
          console.log('Loaded selected therapists:', therapistsData.map((t) => t.name));
          
          // Load work shifts for all therapists
          const allWorkShifts = await Promise.all(
            selectedTherapists.map(async (therapist) => {
              try {
                return await getTherapistWorkshifts(therapist.id);
              } catch (error) {
                console.error(`Error loading work shifts for therapist ${therapist.name}:`, error);
                return [];
              }
            })
          );
          
          // Flatten the array of work shifts
          const flattenedWorkShifts = allWorkShifts.flat();
          
          // Filter work shifts for the selected date
          const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
          const filteredWorkShifts = flattenedWorkShifts.filter((shift) => {
            if (!shift.startTime || !shift.endTime) return false;
            const shiftStartDate = format(new Date(shift.startTime), 'yyyy-MM-dd');
            const shiftEndDate = format(new Date(shift.endTime), 'yyyy-MM-dd');
            return shiftStartDate === selectedDateStr || shiftEndDate === selectedDateStr;
          });
          
          setWorkShifts(filteredWorkShifts);
          console.log('Filtered work shifts for selected date:', filteredWorkShifts);
          
          // Format the date for API call
          const dateString = format(selectedDate, 'yyyy-MM-dd');
          console.log(`Fetching appointments for date: ${dateString}`);
          
          try {
            // Try to get appointments by date
            const appointmentsData = await getAppointmentsByDate(dateString);
            console.log('Appointments fetched by date:', appointmentsData);
            
            // Filter for the selected therapists
            const filteredAppointments = appointmentsData.filter((app: { therapistId: number; }) => 
              selectedTherapists.includes(app.therapistId)
            );
            
            console.log('Filtered appointments:', filteredAppointments);
            
            setAppointments(filteredAppointments);
          } catch (error) {
            console.error('Error getting appointments by date, trying individual therapist fetches:', error);
            
            // If getting by date fails, try getting appointments for each therapist
            const allAppointments: Appointment[] = [];
            
            for (const therapistId of selectedTherapists.map(t => t.id)) {
              try {
                const therapistAppointments = await getAppointmentsByTherapist(therapistId);
                
                // Filter by date
                const filteredAppointments = therapistAppointments.filter((app: { startTime: string | number | Date; }) => {
                  const appDate = new Date(app.startTime);
                  return (
                    appDate.getFullYear() === selectedDate.getFullYear() &&
                    appDate.getMonth() === selectedDate.getMonth() &&
                    appDate.getDate() === selectedDate.getDate()
                  );
                });
                
                allAppointments.push(...filteredAppointments);
              } catch (therapistError) {
                console.error(`Error fetching appointments for therapist ${therapistId}:`, therapistError);
              }
            }
            
            console.log('Appointments fetched by therapist (fallback):', allAppointments);
            setAppointments(allAppointments);
          }
          setHasData(true);
        } else {
          setTherapists([]);
          setAppointments([]);
          setWorkShifts([]);
        }
      } catch (error) {
        console.error('Error fetching schedule data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedTherapists, selectedDate]); // Don't include patients and therapists here

  // Separate effect for appointment update messages
  useEffect(() => {
    // Setup message listener for when edit popup sends updates
    const handleAppointmentUpdated = (event: MessageEvent) => {
      // Make sure the message is from our popup
      if (event.data?.type === 'APPOINTMENT_UPDATED' && event.data?.appointment) {
        console.log('Received updated appointment data:', event.data.appointment);
        
        // Update the appointment in the state
        setAppointments(prev => 
          prev.map(app => 
            app.id === event.data.appointment.id 
              ? {
                  ...event.data.appointment,
                  patient: patients.find(p => p.id === event.data.appointment.patientId),
                  therapist: therapists.find(t => t.id === event.data.appointment.therapistId)
                }
              : app
          )
        );
      }
    };

    // Add event listener for appointment updates
    window.addEventListener('message', handleAppointmentUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleAppointmentUpdated);
    };
  }, [patients, therapists]); // Only depend on patients and therapists for this effect

  // Separate effect for newly created appointments
  useEffect(() => {
    const handleAppointmentCreated = (event: MessageEvent) => {
      // Make sure the message is from our popup
      if (event.data?.type === 'APPOINTMENT_CREATED' && event.data?.appointment) {
        console.log('Received created appointment data:', event.data.appointment);
        
        // Add the new appointment to the state (with patient and therapist objects)
        const newAppointment: Appointment = {
          ...event.data.appointment,
          patient: patients.find(p => p.id === event.data.appointment.patientId),
          therapist: therapists.find(t => t.id === event.data.appointment.therapistId)
        };
        
        setAppointments(prev => [...prev, newAppointment]);
      }
    };

    // Add event listener for appointment creation
    window.addEventListener('message', handleAppointmentCreated);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleAppointmentCreated);
    };
  }, [patients, therapists]);

  // Helper function to find the practice color for a work shift
  const getPracticeColor = (practiceId: number | undefined) => {
    if (!practiceId) return 'rgba(0, 0, 0, 0.04)'; // Default background for no practice
    
    const therapist = therapists.find(t => t.practice?.id === practiceId);
    if (therapist?.practice?.color) {
      // Return the color with low opacity
      return `${therapist.practice.color}33`; // 33 is 20% opacity in hex
    }
    
    return 'rgba(0, 0, 0, 0.04)'; // Fallback
  };

  // Function to check if a time slot is within a work shift
  const getWorkShiftForTimeSlot = (timeSlot: TimeSlot, therapistId: number) => {
    // Convert time slot to Date objects for the selected date
    const slotStartStr = `${format(selectedDate, 'yyyy-MM-dd')}T${timeSlot.start}:00`;
    const slotEndStr = `${format(selectedDate, 'yyyy-MM-dd')}T${timeSlot.end}:00`;
    
    const slotStart = new Date(slotStartStr);
    const slotEnd = new Date(slotEndStr);
    
    // Find any work shift that overlaps with this time slot
    return workShifts.find(shift => {
      if (shift.therapistId !== therapistId) return false;
      
      const shiftStart = new Date(shift.startDateTime);
      const shiftEnd = new Date(shift.endDateTime);
      
      // Check if the slot overlaps with the shift
      return (
        (slotStart >= shiftStart && slotStart < shiftEnd) || // Slot start is within shift
        (slotEnd > shiftStart && slotEnd <= shiftEnd) || // Slot end is within shift
        (slotStart <= shiftStart && slotEnd >= shiftEnd) // Shift is completely within slot
      );
    });
  };

  const getPositionAndHeight = (startDate: Date, endDate: Date) => {
    // Use getHours() and getMinutes() directly from the Date objects
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    const scheduleStartMinutes = SCHEDULE_START_HOUR * 60;
    
    const top = ((startMinutes - scheduleStartMinutes) / 60) * HOUR_HEIGHT;
    
    // Calculate the natural height for the time slot
    const naturalHeight = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
    
    // Minimum height to fit all information (3 lines of text plus padding)
    const minHeight = 36; 
    
    // If the natural height is less than our minimum, make room by shrinking slightly
    // but don't allow it to overflow into the next time slot
    let calculatedHeight;
    
    if (naturalHeight < minHeight) {
      // For short appointments (like 30 min), cap the height at 98% of the slot height
      // to prevent overlapping with the next slot
      calculatedHeight = Math.min(minHeight, naturalHeight * 0.98);
    } else {
      // For longer appointments, use the natural height
      calculatedHeight = naturalHeight;
    }

    return { top, height: calculatedHeight };
  };

  const handleTimeSlotClick = (timeSlot: TimeSlot, therapistId: number) => {
    // Calculate default duration (30 minutes)
    const durationMinutes = 30;

    // Prepare appointment data to pass to the popup window
    const initialData = {
      startTime: timeSlot.start,
      durationMinutes: durationMinutes,
      therapistId: therapistId,
      patientId: null,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status: AppointmentStatus.Gepland.toString(),
      type: AppointmentType.FysioTherapie.toString(),
      notes: '',
    };

    // Store the initial data in localStorage so the popup can access it
    localStorage.setItem('newAppointmentData', JSON.stringify(initialData));
    
    // Define popup window dimensions and position (centered)
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    // Open the popup window without storing the reference
    window.open(
      `/appointment/create`, 
      'CreateAppointment',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
    
    // Setup message listener for when the popup is done
    window.addEventListener('message', function handleAppointmentCreated(event) {
      // Make sure the message is from our popup
      if (event.data?.type === 'APPOINTMENT_CREATED' && event.data?.appointment) {
        console.log('Received created appointment data:', event.data.appointment);
        
        // Add the new appointment to the state (with patient and therapist objects)
        const newAppointment: Appointment = {
          ...event.data.appointment,
          patient: patients.find(p => p.id === event.data.appointment.patientId),
          therapist: therapists.find(t => t.id === event.data.appointment.therapistId)
        };
        
        setAppointments(prev => [...prev, newAppointment]);
        
        // Remove this event listener once we've handled the response
        window.removeEventListener('message', handleAppointmentCreated);
      }
    });
  };

  // Handler to open the edit view in a new tab
  const handleEditAppointment = (appointmentId: number) => {
    // Define popup window dimensions and position (centered)
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    // Open the popup window
    window.open(
      `/appointments/edit/${appointmentId}`, 
      `EditAppointment_${appointmentId}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  // Handler to delete an appointment
  const handleDeleteAppointment = async (appointment: Appointment) => {
    // Confirmation dialog
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(appointment.id);
        // Remove appointment from local state
        setAppointments(prev => prev.filter(app => app.id !== appointment.id));
        console.log(`Appointment ${appointment.id} deleted successfully.`);
        
        // If this is an edit page in a popup window, close it after deletion
        if (window.opener && window.location.pathname.includes(`/appointments/edit/${appointment.id}`)) {
          window.close();
        }
      } catch (error) {
        console.error(`Error deleting appointment ${appointment.id}:`, error);
        // Optionally show an error message to the user
        alert('Failed to delete appointment. Please try again.');
      }
    }
  };

  const renderAppointment = (appointment: Appointment, therapistIndex: number, totalTherapists: number) => {
    // Create Date objects directly from the ISO strings
    // These Date objects represent the correct point in time (UTC)
    const startTimeDate = new Date(appointment.startTime);
    let endTimeDate: Date;

    // Always calculate endTime from durationMinutes
    if (appointment.durationMinutes) {
      endTimeDate = addMinutes(startTimeDate, appointment.durationMinutes);
    } else {
      // Fallback: Assume a default duration if not provided
      console.warn(`Appointment ID ${appointment.id} missing durationMinutes. Assuming 30 min duration.`);
      endTimeDate = addMinutes(startTimeDate, 30); 
    }

    // Format for display (this converts UTC to local time)
    const displayStartTime = format(startTimeDate, 'HH:mm');
    const displayEndTime = format(endTimeDate, 'HH:mm');
    
    // Pass the Date objects (holding the correct absolute time) to getPositionAndHeight
    const { top, height } = getPositionAndHeight(startTimeDate, endTimeDate);
    
    const columnWidth = 100 / totalTherapists;
    const left = therapistIndex * columnWidth;
    
    // Get appointment type display name
    const typeDisplay = appointment.type !== undefined 
      ? AppointmentType[Number(appointment.type)] || appointment.type
      : 'N/A';
    
    const patientName = appointment.patient?.name || `Patient ID: ${appointment.patientId}`;
    
    return (
      <Box
        key={appointment.id}
        sx={{
          position: 'absolute',
          top: `${top}px`,
          left: `${left}%`,
          width: `calc(${columnWidth}% - 4px)`,
          height: `${height}px`,
          backgroundColor: 'primary.light',
          borderRadius: 1,
          p: '2px',
          pl: '4px',
          pr: '26px',
          overflow: 'hidden',
          color: 'white',
          fontSize: '0.65rem',
          fontWeight: 'medium',
          border: '1px solid',
          borderColor: 'primary.main',
          zIndex: 1,
          boxSizing: 'border-box',
          '&:hover .appointment-actions': {
             opacity: 1,
          },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: height < 31 ? 'center' : 'space-between'
        }}
      >
        {/* Top row - time */}
        <Typography variant="caption" component="div" noWrap sx={{ 
          lineHeight: 1, 
          fontSize: '0.62rem', 
          margin: 0,
          padding: 0
        }}>
          {displayStartTime}-{displayEndTime}
        </Typography>
        
        {/* Middle - patient name */}
        <Typography variant="caption" component="div" noWrap sx={{ 
          lineHeight: 1.1, 
          fontWeight: 'bold',
          fontSize: '0.68rem',
          margin: 0,
          padding: 0
        }}>
          {patientName}
        </Typography>
        
        {/* Only show type for appointments with enough height */}
        {height >= 29 && (
          <Typography variant="caption" component="div" noWrap sx={{ 
            lineHeight: 1, 
            fontSize: '0.62rem', 
            fontStyle: 'italic',
            margin: 0,
            padding: 0,
            textAlign: 'right'
          }}>
            {typeDisplay}
          </Typography>
        )}

        <Box 
          className="appointment-actions"
          sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            p: 0,
            display: 'flex',
            flexDirection: 'row',
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '0 4px 0 4px',
          }}
        >
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); handleEditAppointment(appointment.id); }}
            sx={{ color: 'white', p: '1px' }}
            aria-label="edit appointment"
          >
            <EditIcon fontSize="inherit" sx={{ fontSize: '0.9rem' }} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(appointment.id); }}
            sx={{ color: 'white', p: '1px' }}
            aria-label="delete appointment"
          >
            <DeleteIcon fontSize="inherit" sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Box>
      </Box>
    );
  };

  // Render the schedule column headers
  const renderColumnHeaders = () => {
    if (isLoading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%', 
          p: 2 
        }}>
          <Typography variant="body2">Loading schedule...</Typography>
        </Box>
      );
    }

    if (selectedTherapists.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%', 
          p: 2 
        }}>
          <Typography variant="body2">Select therapists to view their schedule</Typography>
        </Box>
      );
    }

    // Always use the selectedTherapistIds to determine which therapists to show,
    // even if there are no appointments for some of them
    return (
      <Box sx={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
        {/* Time column header */}
        <Box sx={{ 
          width: '60px', 
          borderRight: '1px solid #ddd',
          p: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Typography variant="body2" fontWeight="bold">Time</Typography>
        </Box>
        
        {/* Therapist column headers */}
        {therapists.map((therapist) => (
          <Box key={therapist.id} sx={{ 
            flex: 1, 
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #ddd',
            '&:last-child': {
              borderRight: 'none'
            }
          }}>
            <Typography variant="body2" fontWeight="bold">
              {therapist.name}
            </Typography>
            {therapist.specializations && therapist.specializations.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {therapist.specializations[0].name}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  // Initial loading with no previous data
  if (isLoading && !hasData) {
    return (
      <Paper sx={{ 
        height: 'calc(100vh - 128px)', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}
        >
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // No therapists selected
  if (!isLoading && therapists.length === 0) {
    return (
      <Paper sx={{ 
        height: 'calc(100vh - 128px)', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 3,
            color: 'text.secondary'
          }}
        >
          <Typography variant="body1">
            Select therapists to view their schedule
          </Typography>
        </Box>
      </Paper>
    );
  }

  // We have data to display (either loading with previous data or new data)
  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Loading overlay */}
      {isLoading && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10
          }}
        >
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              p: 3,
              boxShadow: 3
            }}
          >
            <CircularProgress sx={{ mb: 1 }} />
            <Typography variant="body2">Loading schedule...</Typography>
          </Box>
        </Box>
      )}

      {/* Header with column headers */}
      {renderColumnHeaders()}

      {/* Schedule content */}
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        overflowY: 'auto'
      }}>
        <Box sx={{ 
          position: 'relative', 
          height: `${(SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * HOUR_HEIGHT}px`,
          display: 'flex'
        }}>
          {/* Time column */}
          <Box sx={{ 
            width: '60px', 
            position: 'relative',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            {timeSlots.map((slot, index) => (
              <React.Fragment key={`time-${slot.start}`}>
                {/* Time line */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: `${(index / 2) * HOUR_HEIGHT}px`,
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                  }}
                />
                {/* Time label */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    position: 'absolute',
                    top: `${(index / 2) * HOUR_HEIGHT - 10}px`,
                    width: '100%',
                    textAlign: 'center',
                    color: 'text.secondary',
                    fontSize: '0.7rem'
                  }}
                >
                  {slot.start}
                </Typography>
              </React.Fragment>
            ))}
          </Box>

          {/* Appointments area */}
          <Box sx={{ 
            flex: 1, 
            position: 'relative'
          }}>
            {/* Time lines - horizontal grid lines across all therapists */}
            {timeSlots.map((slot, index) => (
              <Box 
                key={`line-${slot.start}`}
                sx={{ 
                  position: 'absolute',
                  top: `${(index / 2) * HOUR_HEIGHT}px`,
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                  zIndex: 0
                }}
              />
            ))}

            {/* Vertical dividers between therapists */}
            {therapists.slice(0, -1).map((_, index) => (
              <Divider 
                key={`divider-${index}`}
                orientation="vertical" 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${((index + 1) / therapists.length) * 100}%`,
                  zIndex: 0
                }}
              />
            ))}

            {/* Work shift visualization */}
            {timeSlots.map((slot, slotIndex) => (
              therapists.map((therapist, therapistIdx) => {
                const workShift = getWorkShiftForTimeSlot(slot, therapist.id);
                
                return (
                  <Box
                    key={`slot-${therapist.id}-${slot.start}`}
                    onClick={() => handleTimeSlotClick(slot, therapist.id)}
                    sx={{
                      position: 'absolute',
                      top: `${(slotIndex / 2) * HOUR_HEIGHT}px`,
                      left: `${(therapistIdx / therapists.length) * 100}%`,
                      width: `${100 / therapists.length}%`,
                      height: `${HOUR_HEIGHT / 2}px`,
                      cursor: 'pointer',
                      backgroundColor: workShift ? getPracticeColor(workShift.practiceId) : 'transparent',
                      '&:hover': {
                        backgroundColor: workShift ? 
                          `${getPracticeColor(workShift.practiceId).slice(0, -2)}66` : // Darken on hover
                          'rgba(0, 0, 0, 0.04)',
                      },
                      zIndex: 0
                    }}
                  />
                );
              })
            ))}

            {/* Appointments */}
            {appointments.map(appointment => {
              const therapistIndex = therapists.findIndex(t => t.id === appointment.therapistId);
              if (therapistIndex >= 0) {
                return renderAppointment(appointment, therapistIndex, therapists.length);
              }
              return null;
            })}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ScheduleView; 