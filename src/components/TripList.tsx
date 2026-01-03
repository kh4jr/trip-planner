// src/components/TripList.tsx

import { Trip } from "@/lib/data";

interface TripListProps {
  trips: Trip[];
  onSelect: (trip: Trip) => void;
  selectedId: number | undefined;
}

export default function TripList({ trips, onSelect, selectedId }: TripListProps) {
  return (
    <ul className="space-y-2">
      {trips.map((trip) => (
        <li 
          key={trip.id}
          // Styl zaznaczonego wyjazdu
          className={`p-3 rounded-lg cursor-pointer transition duration-150 ease-in-out 
            ${trip.id === selectedId 
                ? 'bg-blue-100 border-l-4 border-blue-600 font-semibold text-blue-800' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`
          }
          onClick={() => onSelect(trip)}
        >
          <div className="text-lg">{trip.name}</div>
          <div className="text-sm text-gray-500">{trip.destination}</div>
        </li>
      ))}
    </ul>
  );
}