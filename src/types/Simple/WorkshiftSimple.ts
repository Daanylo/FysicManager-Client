import { PracticeSimple } from "./PracticeSimple";
import { TherapistSimple } from "./TherapistSimple";

export interface WorkshiftSimple {
    id: string;
    startTime?: string; // ISO string format
    endTime?: string; // ISO string format
    therapist: TherapistSimple;
    practice: PracticeSimple  
}