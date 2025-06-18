import axios from "axios";
import { Therapist } from "../types/Therapist";
import { TherapistSimple } from "../types/Simple/TherapistSimple";
import { WorkshiftSimple } from "../types/Simple/WorkshiftSimple";
import { AppointmentSimple } from "../types/Simple/AppointmentSimple";
import { Appointment } from "../types/Appointment";
import { config } from '../config/environment';

const API_BASE = config.apiBase + 'therapist';

// Get all therapists
export async function getAllTherapists() {
    const response = await axios.get<Therapist[]>(`${API_BASE}/all`);
    return response.data;
}

// Get a single therapist by ID
export async function getTherapist(id: string) {
    const response = await axios.get<Therapist>(`${API_BASE}/${id}`);
    return response.data;
}

// Get workshifts for a therapist
export async function getTherapistWorkshifts(id: string) {
    const response = await axios.get<WorkshiftSimple[]>(`${API_BASE}/${id}/workshifts`);
    return response.data;
}

export async function getTherapistAppointments(id: string) {
    const response = await axios.get<Appointment[]>(`${API_BASE}/${id}/appointments`);
    return response.data;
}

// Create a new therapist
export async function createTherapist(therapist: Omit<TherapistSimple, "id">) {
    const response = await axios.post<Therapist>(API_BASE, therapist);
    return response.data;
}

// Update an existing therapist
export async function updateTherapist(id: string, therapist: TherapistSimple) {
    const response = await axios.put<{ Message: string; Therapist: Therapist }>(`${API_BASE}/${id}`, therapist);
    return response.data;
}

// Delete a therapist by ID
export async function deleteTherapist(id: string) {
    const response = await axios.delete<{ Message: string; Therapist: Therapist }>(`${API_BASE}/${id}`);
    return response.data;
}
