import { Specialization } from "./Specialization";
import { PracticeSimple } from "./Simple/PracticeSimple";
import { WorkshiftSimple } from "./Simple/WorkshiftSimple";

export interface Therapist {
    id: string;
    name?: string;
    phoneNumber?: string;
    email?: string;
    specializations?: Specialization[];
    practices?: PracticeSimple[];
    workshifts?: WorkshiftSimple[];
}