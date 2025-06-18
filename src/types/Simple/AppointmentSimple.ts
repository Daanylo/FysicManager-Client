import { AppointmentType } from "../AppointmentType";
import { PatientSimple } from "./PatientSimple";
import { PracticeSimple } from "./PracticeSimple";
import { TherapistSimple } from "./TherapistSimple";

export interface AppointmentSimple {
    id: string;
    description: string;
    patientId: string;
    therapistId: string;
    practiceId: string;
    appointmentTypeId: string;
    time: string;
    duration: number;
    notes: string;
    patient?: PatientSimple;
    appointmentType?: AppointmentType;
}