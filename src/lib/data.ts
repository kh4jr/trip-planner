export interface Participant {
  id: number;      // Liczba, bo tak jest w Postgres
  name: string;
  email: string;
  role: string;
  tripId: number;
}

export interface Trip {
  id: number;
  name: string;
  destination: string;
  startDate: string; 
  endDate: string;
  participants: Participant[];
}

export interface Activity { 
  id: number; 
  tripId: number; 
  name: string; 
  category: string; 
  time: string; 
  location: string; 
  price: number; 
  participants: string[]; 
}

export interface Expense { 
  id: number; 
  tripId: number; 
  amount: number; 
  category: string; 
  description: string; 
  date: string; 
  paidBy: string; 
}

export interface TripItem { 
  id: number; 
  tripId: number; 
  name: string; 
  isCompleted: boolean; 
  category: string; 
}

export interface Note { 
  id: number; 
  tripId: number; 
  content: string; 
  date: string; 
}

export type TripFormData = Omit<Trip, 'id' | 'participants'> & {
  participants: Omit<Participant, 'id' | 'tripId'>[];
};