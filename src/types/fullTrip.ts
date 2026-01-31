import {
  Trip,
  Participant,
  Expense,
  TripItem,
  Activity,
  Note,
  TripImage,
} from "@prisma/client";

export type FullTrip = Trip & {
  participants: Participant[];
  expenses: Expense[];
  items: TripItem[];      // ← to są todos
  activities: Activity[];
  notes: Note[];
  images: TripImage[];
};
