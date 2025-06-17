import axios from "axios";
import { AppointmentType } from "../types/AppointmentType";

const API_BASE = "http://localhost:5003/api/appointmenttype";

// Get all appointment types
export async function getAllAppointmentTypes(): Promise<AppointmentType[]> {
    const response = await axios.get<AppointmentType[]>(`${API_BASE}/all`);
    return response.data;
}

// Get a single appointment type by ID
export async function getAppointmentType(id: string): Promise<AppointmentType> {
    const response = await axios.get<AppointmentType>(`${API_BASE}/${id}`);
    return response.data;
}

// Create a new appointment type
export async function createAppointmentType(appointmentType: Omit<AppointmentType, "id">): Promise<AppointmentType> {
    const response = await axios.post<AppointmentType>(API_BASE, appointmentType);
    return response.data;
}

// Update an appointment type
export async function updateAppointmentType(id: string, appointmentType: Partial<AppointmentType>): Promise<AppointmentType> {
    const response = await axios.put<AppointmentType>(`${API_BASE}/${id}`, appointmentType);
    return response.data;
}

// Delete an appointment type
export async function deleteAppointmentType(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/${id}`);
}
