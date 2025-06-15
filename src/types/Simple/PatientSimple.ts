export interface PatientSimple {
    id: string;
    firstName?: string;
    lastName?: string;
    initials?: string;
    bsn?: string;
    dateOfBirth?: string; // ISO string format
    email?: string;
    phoneNumber?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
}