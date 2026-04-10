export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

export interface PetPost {
  id: string;
  creator: UserProfile;
  name: string;
  images: string[];
  age: string;
  breed: string;
  medical_history: string;
  behavior: string;
  personality: string;
  location: string;
  status: 'for adoption' | 'adopted';
  created_at: string;
  isSaved?: boolean;
}

export interface LostFoundPost {
  id: string;
  reporter: UserProfile;
  report_type: 'lost' | 'found';
  pet_type: string;
  description: string;
  last_seen_location: string;
  incident_date: string;
  images: string[];
  status: 'active' | 'resolved';
}