export interface Patient {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  dateOfBirth: string; // Will store as ISO string
  medicalHistory: string;
  insuranceProvider: string;
  insuranceNumber: string;
  bsn: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  registrationDate: string; // Will store as ISO string
  appointments?: Appointment[];
}

export interface Therapist {
  id: number;
  name: string;
  email: string;
  phone: string;
  practiceId: number;
  practice?: Practice;
  specializations?: Specialization[];
  workShifts?: WorkShift[];
  appointments?: Appointment[];
}

export interface Appointment {
  id: number;
  patientId: number;
  therapistId: number;
  startTime: string; // ISO string format (e.g., "2023-01-01T09:00:00")
  endTime?: string; // Optional on API, might be calculated or implicit
  durationMinutes?: number; // Optional, as it might be inferred from start/end
  notes?: string;
  status: AppointmentStatus; // Use enum if defined, otherwise string
  type?: AppointmentType; // Add appointment type
  patient?: Patient; // Nested data is usually not sent in POST/PUT
  therapist?: Therapist; // Nested data is usually not sent in POST/PUT
}

// Define Enums if they are used as strings/numbers in the API
// Check how the API handles these enums (string names or number values)
export enum AppointmentStatus {
  Gepland = 0,
  Afgerond = 1,
  Geannuleerd = 2,
  NoShow = 3
}

export enum AppointmentType {
  FysioTherapie = 1000,
  KinderFysioTherapie = 1001,
  ErgoTherapie = 1200,
  OedeemTherapie = 1500,
  BekkenFysioTherapie = 1600,
  Intake = 1864,
  IntakeNaVerwijzing = 1870
}

// Map display names for appointment types
export const AppointmentTypeDisplayNames: Record<AppointmentType, string> = {
  [AppointmentType.FysioTherapie]: "1000 - behandeling fysiotherapie",
  [AppointmentType.KinderFysioTherapie]: "1001 - behandeling kinderfysiotherapie",
  [AppointmentType.ErgoTherapie]: "1200 - behandeling ergotherapie",
  [AppointmentType.OedeemTherapie]: "1500 - behandeling oedeemtherapie",
  [AppointmentType.BekkenFysioTherapie]: "1600 - behandeling bekkenfysiotherapie",
  [AppointmentType.Intake]: "1864 - intake",
  [AppointmentType.IntakeNaVerwijzing]: "1870 - intake na verwijzing"
};

export interface Practice {
  id: number;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  color: string;
  therapists?: Therapist[];
}

export interface Specialization {
  id: number;
  name: string;
  description?: string;
}

export interface WorkShift {
  id: number;
  therapistId: number;
  practiceId: number;
  startDateTime: string; // ISO string format
  endDateTime: string;   // ISO string format
  therapist?: Therapist;
  practice?: Practice;
}

export interface TimeSlot {
  start: string;
  end: string;
} 