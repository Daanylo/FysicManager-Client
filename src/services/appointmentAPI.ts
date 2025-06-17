import axios from "axios";
import { Appointment } from "../types/Appointment";
import { PatientSimple } from "../types/Simple/PatientSimple";
import { TherapistSimple } from "../types/Simple/TherapistSimple";
import { PracticeSimple } from "../types/Simple/PracticeSimple";
import { AppointmentSimple } from "../types/Simple/AppointmentSimple";

const API_BASE = "http://localhost:5003/api/appointment";

// Interface for creating appointments with simple IDs
export interface CreateAppointmentRequest {
    patientId: string;
    therapistId: string;
    practiceId: string;
    appointmentTypeId: string;
    time: string;
    duration: number;
    notes: string;
}

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

export async function getAppointmentPatient(appointmentId: string) {
    const response = await axios.get<PatientSimple>(`${API_BASE}/${appointmentId}/patient`);
    return response.data;
}

export async function getAppointmentTherapist(appointmentId: string) {
    const response = await axios.get<TherapistSimple>(`${API_BASE}/${appointmentId}/therapist`);
    return response.data;
}

export async function getAppointmentPractice(practiceId: string) {
    const response = await axios.get<PracticeSimple>(`${API_BASE}/${practiceId}/practice`);
    return response.data;
}

// Create a new appointment
export async function createAppointment(appointment: CreateAppointmentRequest) {
    const response = await axios.post(API_BASE, appointment);
    return response.data;
}

// Update an existing appointment
export async function updateAppointment(id: string, appointment: Appointment) {
    const response = await axios.put(`${API_BASE}/${id}`, appointment);
    return response.data;
}

// Delete an appointment by ID
export async function deleteAppointment(id: string) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
}
