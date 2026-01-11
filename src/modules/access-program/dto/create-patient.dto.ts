export class CreatePatientDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dob?: string; // Date of birth
  gender?: string;
  patientId?: string; // Reference ID
  programId: number; // Program ID (links to product)
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}