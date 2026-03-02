export type UserRole = 'student' | 'landlord' | 'investor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

