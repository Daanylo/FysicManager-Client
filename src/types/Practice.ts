import { TherapistSimple } from "./Simple/TherapistSimple";

export interface Practice {
    id: string;
    name?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    color?: string;
    therapists?: TherapistSimple[];
}