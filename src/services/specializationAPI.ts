import axios from "axios";
import { Specialization } from "../types/Specialization";

const API_BASE = "http://localhost:5003/api/specialization";

// Get all specializations
export async function getAllSpecializations() {
    const response = await axios.get<Specialization[]>(`${API_BASE}/all`);
    return response.data;
}

// Get a single specialization by ID
export async function getSpecialization(id: string) {
    const response = await axios.get<Specialization>(`${API_BASE}/${id}`);
    return response.data;
}

export async function getSpecializationTherapists(id: string) {
    const response = await axios.get<{ id: string; name: string }[]>(`${API_BASE}/${id}/therapists`);
    return response.data;
}

// Create a new specialization
export async function createSpecialization(specialization: Omit<Specialization, "id">) {
    const response = await axios.post<Specialization>(API_BASE, specialization);
    return response.data;
}

// Update an existing specialization
export async function updateSpecialization(id: string, specialization: Specialization) {
    const response = await axios.put<Specialization>(`${API_BASE}/${id}`, specialization);
    return response.data;
}

// Delete a specialization by ID
export async function deleteSpecialization(id: string) {
    const response = await axios.delete<void>(`${API_BASE}/${id}`);
    return response.status;
}
