import {
  Trip,
  Participant,
  Expense,
  TripItem,
  Activity,
  Note,
  TripImage,
  Todo,
} from "@prisma/client";

export type FullTrip = Trip & {
  participants: Participant[];
  expenses: Expense[];
  items: TripItem[];
  activities: Activity[];
  notes: Note[];
  images: TripImage[];
  todos: Todo[];
};
