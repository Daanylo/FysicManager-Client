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
import { getPatient } from '../../services/patientAPI';
import { Patient } from '../../types/Patient';
import { AppointmentType } from '../../types/AppointmentType';
import { Appointment } from '../../types/Appointment';
// import { getPractice } from '../../services/practiceAPI'; // Potentially needed for practice details if not on workshift

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

interface EnhancedAppointmentType extends AppointmentType {
  duration?: number;
  color?: string;
}

const SchedulePanel: React.FC<SchedulePanelProps> = ({ selectedDate, selectedTherapists, filteredTherapists = [] }) => {
  const theme = useTheme();
  const [therapistsData, setTherapistsData] = useState<TherapistScheduleData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Use useMemo to determine which therapists to display to prevent unnecessary re-renders
  const therapistsToShow = useMemo(() => {
    return selectedTherapists.length > 0 
      ? selectedTherapists 
      : filteredTherapists;
  }, [selectedTherapists, filteredTherapists]);

  // Keep track of therapists we've already tried to fetch data for
  const [fetchedTherapistIds, setFetchedTherapistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (therapistsToShow.length > 0 && selectedDate) {
      setLoading(true);
      setHasError(false);
      
      // Create a unique list of therapists we haven't already fetched for
      const therapistsToFetch = therapistsToShow.filter(
        therapist => !fetchedTherapistIds.has(`${therapist.id}-${format(selectedDate, 'yyyy-MM-dd')}`)
      );
      
      if (therapistsToFetch.length === 0) {
        // All therapists already fetched, nothing to do
        setLoading(false);
        return;
      }
      
      // Track the new therapist IDs we're about to fetch
      const newFetchedIds = new Set(fetchedTherapistIds);
      therapistsToFetch.forEach(therapist => {
        newFetchedIds.add(`${therapist.id}-${format(selectedDate, 'yyyy-MM-dd')}`);
      });
      setFetchedTherapistIds(newFetchedIds);
      
      // Create an array of promises for all therapists
      const fetchPromises = therapistsToFetch.map(therapist => {
        return new Promise<TherapistScheduleData>(async (resolve) => {
          try {
            const [wsData, aptData] = await Promise.all([
              getTherapistWorkshifts(therapist.id),
              getTherapistAppointments(therapist.id),
            ]);
            
            // Filter by date on the client side
            const filteredWsData = wsData.filter(ws => 
              ws.startTime && isSameDay(parseISO(ws.startTime), selectedDate)
            );
            const filteredAptData = aptData.filter(apt => 
              apt.time && isSameDay(parseISO(apt.time), selectedDate)
            );
            
            // Enhance appointments with patient data - use a timeout to prevent too many concurrent requests
            const enhancedAppointments: AppointmentSimple[] = [];
            
            for (const apt of filteredAptData) {
              try {
                // Make sure appointmentType is not null before proceeding
                if (!apt.appointmentType) {
                  apt.appointmentType = {
                    id: 'unknown',
                    name: 'Unknown Appointment',
                  } as EnhancedAppointmentType;
                }
                
                let patientInfo: Patient | null = null;
                try {
                  // Set a reasonable timeout for patient fetch
                  const patientPromise = getPatient(apt.patient.id);
                  const timeoutPromise = new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Patient fetch timeout')), 3000)
                  );
                  
                  patientInfo = await Promise.race([patientPromise, timeoutPromise]);
                } catch (error) {
                  console.log(`Unable to fetch patient ${apt.patient.id}, using placeholder`);
                  // Don't log the full error to console to reduce spam
                }
                
                enhancedAppointments.push({
                  ...apt,
                  patientId: apt.patient.id,
                  therapistId: therapist.id,
                  practiceId: apt.practice?.id || '',
                  patient: patientInfo ? {
                    id: patientInfo.id,
                    firstName: patientInfo.firstName || '',
                    lastName: patientInfo.lastName || '',
                    initials: patientInfo.initials || '',
                    email: patientInfo.email || '',
                    phoneNumber: patientInfo.phoneNumber || ''
                  } : apt.patient
                });
                
              } catch (error) {
                // Add the appointment anyway, even without patient data
                enhancedAppointments.push({
                  ...apt,
                  patientId: apt.patient.id,
                  therapistId: therapist.id,
                  practiceId: apt.practice?.id || ''
                });
              }
            }
            
            resolve({
              therapist,
              workshifts: filteredWsData,
              appointments: enhancedAppointments,
              loading: false
            });
          } catch (error) {
            console.error(`Failed to fetch data for therapist ${therapist.name}:`, error);
            setHasError(true);
            resolve({
              therapist,
              workshifts: [],
              appointments: [],
              loading: false,
              error: `Failed to load data for ${therapist.name}`
            });
          }
        });
      });
      
      // Wait for all promises to resolve
      Promise.all(fetchPromises)
        .then(results => {
          // Merge with existing data
          setTherapistsData(prev => {
            const existingTherapists = new Map(
              prev.map(data => [`${data.therapist.id}-${format(selectedDate, 'yyyy-MM-dd')}`, data])
            );
            
            results.forEach(data => {
              existingTherapists.set(`${data.therapist.id}-${format(selectedDate, 'yyyy-MM-dd')}`, data);
            });
            
            return Array.from(existingTherapists.values());
          });
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching therapist data:", error);
          setHasError(true);
          setLoading(false);
        });
    } else {
      setTherapistsData([]);
      setLoading(false);
    }
    
  // Only re-run when selectedDate changes or therapistsToShow changes (via the useMemo optimization)
  }, [selectedDate, therapistsToShow]);

  // When switching to a new date, reset the fetched therapists tracking
  useEffect(() => {
    setFetchedTherapistIds(new Set());
  }, [selectedDate]);
  
  // Create time slots once for the entire day
  const startTime = startOfDay(selectedDate);
  const endTime = addMinutes(startTime, 24 * 60 - 1); // Cover the entire day
  const timeSlotTimes = eachMinuteOfInterval(
    { start: startTime, end: endTime },
    { step: 25 }
  );

  // Function to create time slots for a therapist
  const createTherapistTimeSlots = (therapistData: TherapistScheduleData) => {
    const { workshifts, appointments } = therapistData;
    
    return timeSlotTimes.map(date => {
      let isWorkShift = false;
      let practiceColor = theme.palette.action.hover; // Default background for non-workshift
      let textColor = theme.palette.text.primary;

      // Check if this time slot is in the therapist's workshift
      for (const shift of workshifts) {
        if (shift.startTime && shift.endTime) {
          const shiftStart = parseISO(shift.startTime);
          const shiftEnd = parseISO(shift.endTime);
          if (isWithinInterval(date, { start: shiftStart, end: addMinutes(shiftEnd, -1) })) { // -1 to make interval exclusive of end
            isWorkShift = true;
            practiceColor = shift.practice?.color || theme.palette.primary.main;
            textColor = theme.palette.getContrastText(practiceColor);
            break;
          }
        }
      }

      // Check if this time slot has an appointment
      const appointment = appointments.find(apt => {
        const aptStart = parseISO(apt.time);
        const aptEnd = addMinutes(aptStart, apt.duration);
        return isWithinInterval(date, { start: aptStart, end: addMinutes(aptEnd, -1) });
      });

      return {
        time: date,
        isWorkShift,
        practiceColor,
        textColor,
        appointment,
      };
    });
  };

  if (therapistsToShow.length === 0) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p:2 }}>
        <Typography variant="h6">Please select at least one therapist or filter by practice/specialization to see schedules.</Typography>
      </Paper>
    );
  }

  // Get only the data for therapists we want to show
  const filteredTherapistsData = therapistsData.filter(data => 
    therapistsToShow.some(t => t.id === data.therapist.id)
  );

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom sx={{ 
        textAlign: 'center', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'background.paper', 
        zIndex: 1, 
        p: 1, 
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        {therapistsToShow.length === 1 
          ? `Schedule for ${therapistsToShow[0].name} on ${format(selectedDate, 'PPP')}` 
          : `Schedules for ${therapistsToShow.length} therapists on ${format(selectedDate, 'PPP')}`}
      </Typography>

      {hasError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          There was a problem loading some data. Please try again later.
        </Alert>
      )}

      {loading && filteredTherapistsData.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1}}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexGrow: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          {/* Time column for reference */}
          <Box sx={{ 
            minWidth: '60px', 
            flexShrink: 0, 
            borderRight: `1px solid ${theme.palette.divider}`, 
            overflowY: 'auto' 
          }}>
            {timeSlotTimes.map((time, index) => (
              <Box
                key={`time-${index}`}
                sx={{
                  p: 1,
                  height: '50px',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: theme.palette.background.paper,
                  zIndex: 1
                }}
              >
                <Typography variant="body2">
                  {format(time, 'HH:mm')}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Therapist columns */}
          {filteredTherapistsData.map((therapistData, therapistIndex) => {
            const timeSlots = createTherapistTimeSlots(therapistData);
            
            return (
              <Box 
                key={`therapist-${therapistData.therapist.id}`}
                sx={{ 
                  minWidth: '200px', 
                  flexGrow: 1,
                  borderRight: `1px solid ${theme.palette.divider}`, 
                  overflowY: 'auto'
                }}
              >
                {/* Therapist name header */}
                <Box sx={{ 
                  p: 1, 
                  borderBottom: `1px solid ${theme.palette.divider}`, 
                  backgroundColor: therapistData.error ? theme.palette.error.light : theme.palette.grey[100],
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="subtitle1">
                    {therapistData.therapist.name}
                    {therapistData.error && " (Error loading data)"}
                  </Typography>
                </Box>
                
                {/* Time slots for this therapist */}
                {timeSlots.map((slot, slotIndex) => (
                  <Box
                    key={`therapist-${therapistIndex}-slot-${slotIndex}`}
                    sx={{
                      p: 1,
                      height: '50px',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      backgroundColor: therapistData.error 
                        ? theme.palette.action.disabledBackground
                        : (slot.appointment ? theme.palette.info.light : slot.practiceColor),
                      color: therapistData.error
                        ? theme.palette.text.disabled
                        : (slot.appointment ? theme.palette.getContrastText(theme.palette.info.light) : slot.textColor),
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >                    {slot.appointment && !therapistData.error && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {slot.appointment.appointmentType?.name || 'Appointment'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {slot.appointment.patient ? 
                            `${slot.appointment.patient.firstName || ''} ${slot.appointment.patient.lastName || ''}` : 
                            `Patient: ${slot.appointment.patientId ? slot.appointment.patientId.substring(0, 8) + '...' : 'Unknown'}`
                          }
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};

export default SchedulePanel;
