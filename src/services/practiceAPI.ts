import axios from "axios";
import { Practice } from "../types/Practice";

const API_BASE = "/api/practice";

// Get all practices
export async function getAllPractices() {
    const response = await axios.get<Practice[]>(API_BASE);
    return response.data;
}

// Get a single practice by ID
export async function getPractice(id: string) {
    const response = await axios.get<Practice>(`${API_BASE}/${id}`);
    return response.data;
}

// Create a new practice
export async function createPractice(practice: Omit<Practice, "id">) {
    const response = await axios.post<Practice>(API_BASE, practice);
    return response.data;
}

// Update an existing practice
export async function updatePractice(id: string, practice: Practice) {
    const response = await axios.put<Practice>(`${API_BASE}/${id}`, practice);
    return response.data;
}

// Delete a practice by ID
export async function deletePractice(id: string) {
    const response = await axios.delete<{ Message: string; Practice: Practice }>(`${API_BASE}/${id}`);
    return response.data;
}
