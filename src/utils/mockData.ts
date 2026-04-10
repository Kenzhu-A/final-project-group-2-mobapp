import { UserProfile, PetPost, LostFoundPost } from '../types';

export const MOCK_USER: UserProfile = { id: 'u1', full_name: 'Olongapo Animal Rescue', email: 'rescue@olongapo.com' };

export const INITIAL_PETS: PetPost[] = [
  {
    id: 'p1', creator: MOCK_USER, name: 'Bella', images: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800'],
    age: '2 Years', breed: 'Beagle Mix', medical_history: 'Fully vaccinated.', behavior: 'Great with kids.',
    personality: 'Playful.', location: 'Olongapo City', status: 'for adoption', created_at: new Date().toISOString(), isSaved: false,
  },
  {
    id: 'p2', creator: { id: 'u2', full_name: 'Local Shelter', email: 'shelter@subic.com' }, name: 'Oliver', images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800'],
    age: '6 Months', breed: 'Domestic Shorthair', medical_history: 'Dewormed.', behavior: 'Litter trained.',
    personality: 'Curious.', location: 'Subic Bay', status: 'for adoption', created_at: new Date().toISOString(), isSaved: true,
  },
];

export const MOCK_LOST_FOUND: LostFoundPost[] = [
  {
    id: 'lf1', reporter: { id: 'u3', full_name: 'Juan Dela Cruz', email: 'juan@test.com' },
    report_type: 'lost', pet_type: 'dog', description: 'Wearing a blue collar. Very timid.',
    last_seen_location: 'Near SM Olongapo Downtown', incident_date: 'Oct 24, 2023',
    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800'],
    status: 'active'
  },
  {
    id: 'lf2', reporter: MOCK_USER,
    report_type: 'found', pet_type: 'cat', description: 'Orange tabby, very vocal. No collar.',
    last_seen_location: 'Gordon College Campus', incident_date: 'Oct 25, 2023',
    images: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=800'],
    status: 'active'
  }
];