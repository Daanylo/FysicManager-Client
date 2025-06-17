import { AppointmentType } from "../AppointmentType";
import { PatientSimple } from "./PatientSimple";
import { PracticeSimple } from "./PracticeSimple";
import { TherapistSimple } from "./TherapistSimple";

export interface AppointmentSimple {
    id: string;
    patientId: string;
    therapistId: string;
    practiceId: string;
    appointmentType: AppointmentType;
    time: string;
    duration: number;
    notes: string;
    patient?: PatientSimple;
}