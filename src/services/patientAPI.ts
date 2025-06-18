import axios from "axios";
import { Patient } from "../types/Patient";
import { Appointment } from "../types/Appointment";
import { config } from '../config/environment';

const API_BASE = config.apiBase + 'patient';

interface PatientFormData extends Omit<Patient, 'id' | 'appointments'> {}

// Get a single patient by ID
export async function getPatient(id: string) {
    const response = await axios.get<Patient>(`${API_BASE}/${id}`);
    return response.data;
}

export async function searchPatient(searchQuery: string) {
    const response = await axios.get<Patient[]>(`${API_BASE}/search`, {
        params: { searchQuery: searchQuery }
    });
    console.log('API response data:', response.data); // Debug log
    return response.data;
}

export async function getPatientAppointments(id: string) {
    const response = await axios.get<Appointment[]>(`${API_BASE}/${id}/appointments`);
    return response.data;
}

// Get all patients
export async function getAllPatients() {
    const response = await axios.get<Patient[]>(`${API_BASE}/all`);
    return response.data;
}
// Create a new patient
export async function createPatient(patient: Omit<Patient, "id">) {
    const response = await axios.post<Patient>(API_BASE, patient);
    return response.data;
}

// Update an existing patient
export async function updatePatient(id: string, patientFormData: PatientFormData) {
    var patient: Patient = {
        id: id,
        firstName: patientFormData.firstName,
        lastName: patientFormData.lastName,
        initials: patientFormData.initials,
        bsn: patientFormData.bsn,
        dateOfBirth: patientFormData.dateOfBirth,
        email: patientFormData.email,
        phoneNumber: patientFormData.phoneNumber,
        address: patientFormData.address,
        postalCode: patientFormData.postalCode,
        city: patientFormData.city,
        country: patientFormData.country,
    };
    const response = await axios.put<Patient>(`${API_BASE}/${id}`, patient);
    return response.data;
}

// Delete a patient by ID
export async function deletePatient(id: string) {
    const response = await axios.delete<{ Message: string; Patient: Patient }>(`${API_BASE}/${id}`);
    return response.data;
}