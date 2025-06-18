import { Workshift } from '../types/Workshift';
import { config } from '../config/environment';

const API_BASE = config.apiBase + 'workshift';

export interface CreateWorkshiftRequest {
  startTime: string;
  endTime: string;
  therapistId: string;
  practiceId: string;
}

export interface UpdateWorkshiftRequest {
  id: string;
  startTime: string;
  endTime: string;
  therapistId: string;
  practiceId: string;
}

export const getAllWorkshifts = async (): Promise<Workshift[]> => {
  const response = await fetch(`${API_BASE}/all`);
  if (!response.ok) {
    throw new Error('Failed to fetch workshifts');
  }
  return response.json();
};

export const getWorkshiftById = async (id: string): Promise<Workshift> => {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch workshift');
  }
  return response.json();
};

export const createWorkshift = async (workshift: CreateWorkshiftRequest): Promise<Workshift> => {
  const response = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workshift),
  });
  if (!response.ok) {
    throw new Error('Failed to create workshift');
  }
  return response.json();
};

export const updateWorkshift = async (workshift: UpdateWorkshiftRequest): Promise<Workshift> => {
  const response = await fetch(`${API_BASE}/${workshift.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startTime: workshift.startTime,
      endTime: workshift.endTime,
      therapistId: workshift.therapistId,
      practiceId: workshift.practiceId
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to update workshift');
  }
  return response.json();
};

export const deleteWorkshift = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete workshift');
  }
};
