export interface TherapistSimple {
    id: string;
    name?: string;
    phoneNumber?: string;
    email?: string;
    specializationIds?: string[];
    practiceIds?: string[];
    workshiftIds?: string[];
}