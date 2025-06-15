import { PracticeSimple } from "./Simple/PracticeSimple";
import { TherapistSimple } from "./Simple/TherapistSimple";

export interface Workshift {
    id: string;
    startTime?: string; // ISO string format
    endTime?: string; // ISO string format
    therapist: TherapistSimple;
    practice: PracticeSimple  
}