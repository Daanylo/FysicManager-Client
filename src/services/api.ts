import axios from 'axios';
import { Patient, Therapist, Appointment, Practice, Specialization, WorkShift } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Patient endpoints
export const getPatients = async (): Promise<Patient[]> => {
  const response = await api.get('/Patients');
  return response.data;
};

export const getPatient = async (id: number): Promise<Patient> => {
  const response = await api.get(`/Patients/${id}`);
  return response.data;
};

export const createPatient = async (patientData: Omit<Patient, 'id' | 'appointments'>): Promise<Patient> => {
  // Set registration date if not provided
  if (!patientData.registrationDate) {
    patientData.registrationDate = new Date().toISOString();
  }
  
  const response = await api.post('/Patients', patientData);
  return response.data;
};

export const updatePatient = async (id: number, patientData: Partial<Patient>): Promise<Patient> => {
  try {
    // Create a clean payload with only the necessary fields
    // Explicitly include only the properties from the Patient model
    const payload = {
      id: id, // Ensure the ID is included and matches
      name: patientData.name,
      surname: patientData.surname,
      email: patientData.email,
      phone: patientData.phone,
      address: patientData.address,
      city: patientData.city,
      zipCode: patientData.zipCode,
      country: patientData.country,
      dateOfBirth: patientData.dateOfBirth,
      medicalHistory: patientData.medicalHistory,
      insuranceProvider: patientData.insuranceProvider,
      insuranceNumber: patientData.insuranceNumber,
      bsn: patientData.bsn,
      emergencyContactName: patientData.emergencyContactName,
      emergencyContactPhone: patientData.emergencyContactPhone,
      registrationDate: patientData.registrationDate
    };
    
    // Remove undefined properties that might cause issues with the backend model binding
    Object.keys(payload).forEach(key => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });
    
    console.log('Updating patient with payload:', payload);
    const response = await api.put(`/Patients/${id}`, payload);
    return response.data || payload as Patient;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const searchPatients = async (query: string): Promise<Patient[]> => {
  // Encoding the query to handle special characters
  const encodedQuery = encodeURIComponent(query);
  // The API endpoint should support searching across multiple fields
  const response = await api.get(`/Patients?search=${encodedQuery}&searchFields=name,email,phone,id,bsn,surname`);
  return response.data;
};

// Practice endpoints
export const getPractices = async (): Promise<Practice[]> => {
  const response = await api.get('/Practices');
  return response.data;
};

export const getPractice = async (id: number): Promise<Practice> => {
  const response = await api.get(`/Practices/${id}`);
  return response.data;
};

export const createPractice = async (practiceData: Omit<Practice, 'id'>): Promise<Practice> => {
  const response = await api.post('/Practices', practiceData);
  return response.data;
};

export const updatePractice = async (id: number, practiceData: Practice): Promise<void> => {
  try {
    // Create a clean payload without any potential circular references
    const payload = {
      id: practiceData.id,
      name: practiceData.name,
      address: practiceData.address,
      city: practiceData.city,
      zipCode: practiceData.zipCode,
      country: practiceData.country,
      phone: practiceData.phone,
      email: practiceData.email,
      website: practiceData.website,
      color: practiceData.color || 'gray' // Ensure color has a default value
    };
    
    console.log('Updating practice with payload:', payload);
    await api.put(`/Practices/${id}`, payload);
  } catch (error: any) {
    console.error('Practice update error details:', error.response?.data);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
    throw error;
  }
};

export const deletePractice = async (id: number): Promise<void> => {
  await api.delete(`/Practices/${id}`);
};

// Specialization endpoints
export const getSpecializations = async (): Promise<Specialization[]> => {
  const response = await api.get('/Specializations');
  return response.data;
};

export const getSpecialization = async (id: number): Promise<Specialization> => {
  const response = await api.get(`/Specializations/${id}`);
  return response.data;
};

export const createSpecialization = async (specializationData: Omit<Specialization, 'id'>): Promise<Specialization> => {
  const response = await api.post('/Specializations', specializationData);
  return response.data;
};

export const updateSpecialization = async (id: number, specializationData: Specialization): Promise<void> => {
  await api.put(`/Specializations/${id}`, specializationData);
};

export const deleteSpecialization = async (id: number): Promise<void> => {
  await api.delete(`/Specializations/${id}`);
};

// Therapist endpoints
export const getTherapists = async (): Promise<Therapist[]> => {
  const response = await api.get('/Therapists');
  return response.data;
};

export const getTherapist = async (id: number): Promise<Therapist> => {
  const response = await api.get(`/Therapists/${id}`);
  return response.data;
};

export const getTherapistsByPractice = async (practiceId: number): Promise<Therapist[]> => {
  const response = await api.get(`/Therapists/ByPractice/${practiceId}`);
  return response.data;
};

export const createTherapist = async (therapistData: Omit<Therapist, 'id'>): Promise<Therapist> => {
  const response = await api.post('/Therapists', therapistData);
  return response.data;
};

export const updateTherapist = async (id: number, therapistData: Therapist): Promise<void> => {
  await api.put(`/Therapists/${id}`, therapistData);
};

export const deleteTherapist = async (id: number): Promise<void> => {
  await api.delete(`/Therapists/${id}`);
};

// WorkShift endpoints
export const getWorkShifts = async (): Promise<WorkShift[]> => {
  const response = await api.get('/WorkShifts');
  return response.data;
};

export const getWorkShift = async (id: number): Promise<WorkShift> => {
  const response = await api.get(`/WorkShifts/${id}`);
  return response.data;
};

export const getWorkShiftsByTherapist = async (therapistId: number): Promise<WorkShift[]> => {
  const response = await api.get(`/WorkShifts/ByTherapist/${therapistId}`);
  return response.data;
};

export const createWorkShift = async (workShiftData: Omit<WorkShift, 'id'>): Promise<WorkShift> => {
  try {
    // Instead of updating the therapist object with a new workshift, just create a standalone workshift
    const payload = {
      startDateTime: workShiftData.startDateTime,
      endDateTime: workShiftData.endDateTime,
      therapistId: workShiftData.therapistId,
      practiceId: workShiftData.practiceId
    };
    
    console.log('Creating work shift with payload:', payload);
    
    // Use POST directly to the Therapist's workshifts endpoint
    const response = await api.post(`/Therapists/${workShiftData.therapistId}/WorkShifts`, payload);
    return response.data;
  } catch (error: any) {
    console.error('WorkShift creation error details:', error.response?.data);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
    throw error;
  }
};

export const updateWorkShift = async (
  therapistId: number,
  shiftId: number,
  workShift: WorkShift
): Promise<WorkShift> => {
  try {
    console.log('Updating work shift:', { 
      therapistId, 
      shiftId, 
      workShift: { 
        startDateTime: workShift.startDateTime,
        endDateTime: workShift.endDateTime,
        practiceId: workShift.practiceId 
      } 
    });
    
    // Create a clean payload with only the necessary fields
    const payload = {
      startDateTime: workShift.startDateTime,
      endDateTime: workShift.endDateTime,
      practiceId: workShift.practiceId
    };
    
    const response = await api.put<WorkShift>(
      `/Therapists/${therapistId}/WorkShifts/${shiftId}`,
      payload
    );
    
    console.log('Work shift updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating work shift:', error);
    
    // Log detailed error information
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // For validation errors (400), show more detailed information
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.errors
          ? Object.entries(error.response.data.errors)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
          : typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
            
        throw new Error(`Validation failed: ${errorMessage}`);
      }
    }
    
    throw error;
  }
};

export const deleteWorkShift = async (id: number, therapistId: number): Promise<void> => {
  try {
    // Delete directly using the therapist's workshifts endpoint
    await api.delete(`/Therapists/${therapistId}/WorkShifts/${id}`);
  } catch (error: any) {
    console.error('WorkShift deletion error details:', error.response?.data);
    throw error;
  }
};

// Appointment endpoints
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await api.get('/Appointments');
  return response.data;
};

export const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
  const response = await api.post('/Appointments', appointmentData);
  return response.data;
};

export const getAppointmentsByDate = async (date: string): Promise<Appointment[]> => {
  const response = await api.get(`/Appointments/ByDate/${date}`);
  return response.data;
};

export const getAppointmentsByTherapist = async (therapistId: number): Promise<Appointment[]> => {
  const response = await api.get(`/Appointments/ByTherapist/${therapistId}`);
  return response.data;
};

export const getAppointmentsByPatient = async (patientId: number): Promise<Appointment[]> => {
  const response = await api.get(`/Appointments/ByPatient/${patientId}`);
  return response.data;
};

export const getAppointment = async (id: number): Promise<Appointment> => {
  // Add a cache-busting query parameter to ensure we get fresh data
  const response = await api.get(`/Appointments/${id}?_=${new Date().getTime()}`);
  console.log(`Successfully fetched appointment ${id}:`, response.data);
  return response.data;
};

// Add the updateAppointment function
export const updateAppointment = async (id: number, appointment: Partial<Appointment>): Promise<Appointment> => {
  try {
    // Make a shallow copy of the appointment object
    const appointmentCopy = { ...appointment };
    
    // Remove nested objects that might cause tracking conflicts
    delete appointmentCopy.patient;
    delete appointmentCopy.therapist;

    const response = await api.put<Appointment>(`/Appointments/${id}`, appointmentCopy);
    return response.data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Add the deleteAppointment function
export const deleteAppointment = async (id: number): Promise<void> => {
  await api.delete(`/Appointments/${id}`);
  console.log(`Successfully deleted appointment ${id} via API.`);
};

// Add a direct update function for fields as an alternative approach
export const updateAppointmentField = async (
  id: number, 
  fieldName: string, 
  value: any
): Promise<boolean> => {
  try {
    // Make a request to update a single field
    await api.post(`/Appointments/UpdateField/${id}`, {
      field: fieldName,
      value: value
    });
    console.log(`Successfully updated field ${fieldName} for appointment ${id}`);
    // Return true to indicate success
    return true;
  } catch (error) {
    console.error(`Failed to update field ${fieldName} for appointment ${id}:`, error);
    return false;
  }
};

// In the updateAppointmentSimple function, use the correct endpoint with proper error handling
export const updateAppointmentSimple = async (id: number, appointment: Partial<Appointment>): Promise<Appointment> => {
  try {
    // Make a shallow copy of the appointment object
    const appointmentCopy = { ...appointment };
    
    // Remove nested objects that might cause tracking conflicts
    delete appointmentCopy.patient;
    delete appointmentCopy.therapist;

    // Use the SimpleUpdate endpoint from the API controller with the correct case
    const response = await api.post<Appointment>(`/Appointments/SimpleUpdate/${id}`, appointmentCopy);
    return response.data;
  } catch (error) {
    console.error('Error updating appointment (simple):', error);
    throw error;
  }
}; 