export type UserRole = 'student' | 'landlord';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

