import { AppointmentType } from "../AppointmentType";
import { PatientSimple } from "./PatientSimple";
import { PracticeSimple } from "./PracticeSimple";
import { TherapistSimple } from "./TherapistSimple";

export interface AppointmentSimple {
    id: string;
    patient: PatientSimple;
    therapist: TherapistSimple;
    practice: PracticeSimple;
    appointmentType: AppointmentType;
    time: string;
    duration: number;
    notes: string;
}