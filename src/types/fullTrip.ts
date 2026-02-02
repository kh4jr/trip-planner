import {
  Trip,
  Expense,
  TripItem,
  Note,
  TripImage,
} from "@prisma/client";

export type Activity = {
  id: number;
  name: string;
  time: Date;
  tripId: number;
};

export type FullTrip = Trip & {
  participants: {
    id: number;
    role: string;
    user: {
      id: number;
      name: string | null;
      email: string;
    };
  }[];

  expenses: Expense[];
  items: TripItem[];
  activities: Activity[];
  notes: Note[];
  images: TripImage[];
};
