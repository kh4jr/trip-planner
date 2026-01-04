// falszywe dane do testowania

export interface Participant {
  id: string; // Używamy string, np. ID użytkownika z Auth.js
  name: string;
  email: string;
  role: 'owner' | 'member'; // Dla uprawnień
}

export interface Expense {
  id: number;
  tripId: number;
  description: string;
  amount: number; // Kwota wydatku
  paidById: string; // ID uczestnika, który zapłacił
  splitBy: string[]; // Tablica ID uczestników, na których się dzieli (lub 'Wszyscy')
  date?: string; // Data wydatku w formacie ISO (opcjonalnie)
}

// NOWY INTERFEJS: Zadanie/Element do Pakowania
export interface TripItem {
  id: number;
  tripId: number;
  description: string;
  assignedToId: string | null; // ID uczestnika lub null
  type: 'packing' | 'todo';
  isCompleted: boolean;
}
export interface Trip {
  id: number;
  name: string;
  destination: string;
  startDate: string; 
  endDate: string;   
  participants: Participant[]; 
  status: 'planning' | 'active' | 'completed';
}

export interface Activity {
    id: number;
    tripId: number;
    time: string;
    description: string;
    assignedTo?: string;
}

// Przykładowe dane Uczestników (używamy imion z MOCK_TRIPS, ale jako obiekty)
export const MOCK_PARTICIPANTS: Participant[] = [
    { id: 'u1', name: 'Ty', email: 'ja@test.com', role: 'owner' },
    { id: 'u2', name: 'Anna', email: 'anna@test.com', role: 'member' },
    { id: 'u3', name: 'Bartek', email: 'bartek@test.com', role: 'member' },
    { id: 'u4', name: 'Kasia', email: 'kasia@test.com', role: 'member' },
    { id: 'u5', name: 'Piotr', email: 'piotr@test.com', role: 'member' },
];

// ZMIANA: Zaktualizuj MOCK_TRIPS, aby używały obiektów Participant
export const MOCK_TRIPS: Trip[] = [
  {
    id: 1,
    name: "Weekend w Krakowie",
    destination: "Kraków, Polska",
    startDate: "2024-11-15",
    endDate: "2024-11-17",
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1], MOCK_PARTICIPANTS[2]],
    status: 'active',
  },
 
];

// NOWE MOCKOWANE WYDATKI
export const MOCK_EXPENSES: Expense[] = [
    {
        id: 1,
        tripId: 1,
        description: "Rezerwacja hotelu",
        amount: 300,
        paidById: 'u1', // Ty
        splitBy: ['u1', 'u2', 'u3'], // Dzielone na 3 osoby
    },
    {
        id: 2,
        tripId: 1,
        description: "Bilety do Muzeum",
        amount: 45,
        paidById: 'u2', // Anna
        splitBy: ['u1', 'u2', 'u3'],
    },
];

// NOWE MOCKOWANE ZADANIA
export const MOCK_ITEMS: TripItem[] = [
    { id: 1, tripId: 1, description: 'Paszport/ID', assignedToId: 'u1', type: 'packing', isCompleted: false },
    { id: 2, tripId: 1, description: 'Zarezerwować stolik na kolację', assignedToId: 'u2', type: 'todo', isCompleted: false },
    { id: 3, tripId: 1, description: 'Kamera', assignedToId: 'u1', type: 'packing', isCompleted: true },
];

export const MOCK_ACTIVITIES: Activity[] = [
    { id: 101, tripId: 1, time: "09:00", description: "Śniadanie w lokalnej kawiarni", assignedTo: "Anna" },
    { id: 102, tripId: 1, time: "11:00", description: "Zwiedzanie muzeum" },
    { id: 103, tripId: 1, time: "14:00", description: "Obiad w restauracji nad morzem", assignedTo: "Jan" },
    { id: 104, tripId: 1, time: "16:00", description: "Relaks na plaży" },
    { id: 105, tripId: 1, time: "19:00", description: "Kolacja i wieczorny spacer", assignedTo: "Kasia" },
    { id: 106, tripId: 2, time: "10:00", description: "Jazda na nartach", assignedTo: "Michał" },
    { id: 107, tripId: 2, time: "13:00", description: "Lunch w schronisku", assignedTo: "Ola" },
    { id: 108, tripId: 2, time: "15:00", description: "Snowboarding" },
    { id: 109, tripId: 2, time: "18:00", description: "Relaks w spa" },
    { id: 110, tripId: 2, time: "20:00", description: "Kolacja przy kominku" },
];