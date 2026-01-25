import { FullTrip } from './TripTabs';

interface TripListProps {
  trips: FullTrip[];
  activeTripId: number | null; // Sprawdź czy tu jest ID
  onSelectTrip: (id: number) => void;
}

export default function TripList({ trips, activeTripId, onSelectTrip }: TripListProps) {
  return (
    <div className="flex flex-col gap-2">
      {trips.map(trip => (
        <div 
          key={trip.id}
          onClick={() => onSelectTrip(trip.id)}
          className={`p-3 rounded-xl cursor-pointer transition ${
            activeTripId === trip.id ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {trip.name}
        </div>
      ))}
    </div>
  );
}