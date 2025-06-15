import { AppointmentType } from "./AppointmentType";
import { PatientSimple } from "./Simple/PatientSimple";
import { PracticeSimple } from "./Simple/PracticeSimple";
import { TherapistSimple } from "./Simple/TherapistSimple";

export interface Appointment {
    id: string;
    patient: PatientSimple;
    therapist: TherapistSimple;
    practice: PracticeSimple;
    appointmentType: AppointmentType;
    time: string;
    duration: number;
    notes: string;
}