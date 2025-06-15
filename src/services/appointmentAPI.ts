import axios from "axios";
import { Appointment } from "../types/Appointment";

const API_BASE = "http://localhost:5003/api/appointment";

// Get all appointments (with related Patient, Therapist, AppointmentType)
export async function getAllAppointments() {
    const response = await axios.get<Appointment[]>(`${API_BASE}/all`);
    return response.data;
}

// Get appointments from timespan, optionally filtered by therapistId, start, end
export async function getAppointmentsFromTimespan(params: {
    therapistId?: string;
    start?: string; // ISO string
    end?: string;   // ISO string
}) {
    const response = await axios.get<Appointment[]>(API_BASE, { params });
    return response.data;
}

// Get a single appointment by ID
export async function getAppointment(id: string) {
    const response = await axios.get<Appointment>(`${API_BASE}/${id}`);
    return response.data;
}

// Create a new appointment
export async function createAppointment(appointment: Omit<Appointment, "id">) {
    const response = await axios.post<Appointment>(API_BASE, appointment);
    return response.data;
}

// Update an existing appointment
export async function updateAppointment(id: string, appointment: Appointment) {
    const response = await axios.put<{ Message: string; Appointment: Appointment }>(`${API_BASE}/${id}`, appointment);
    return response.data;
}

// Delete an appointment by ID
export async function deleteAppointment(id: string) {
    const response = await axios.delete<{ Message: string; Appointment: Appointment }>(`${API_BASE}/${id}`);
    return response.data;
}
