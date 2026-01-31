import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

// 1. Definiujemy sztywny interfejs dla body - koniec z domysłami
interface TripRequestBody {
  name?: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  destination?: string;
  participantIds?: (number | string)[]; 
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Konwersja ID z sesji na Number - bezpiecznie i bez any
    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;

    if (!sessionUserId || !session?.user?.email) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    // Pobieramy dane z body i od razu je typujemy
    const body: TripRequestBody = await req.json();
    const { 
      name, title, description, startDate, endDate, 
      location, destination, participantIds 
    } = body;

    const dbUser = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Użytkownik nie istnieje w bazie" }, { status: 404 });
    }

    
  const newTrip = await db.trip.create({
      data: {
        name: name || title || "Nowy wyjazd",
        description: description || "",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location || "Brak lokalizacji",
        destination: destination || location || "Brak lokalizacji",
        userId: sessionUserId, // Twój ID jako organizatora
          participants: {
            connect: [
              // Łączymy istniejącego uczestnika (Ciebie) po jego unikalnym userId
              { userId: sessionUserId }, 
              // Łączymy resztę wybranych osób po ich ID (klucz główny z tabeli Participant)
              ...(participantIds || [])
                .map((id: string | number) => ({ id: Number(id) }))
                .filter((p) => p.id !== sessionUserId) 
            ]
          }
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(newTrip);
  } catch (error: unknown) {
    // 3. Obsługa błędów bez any - sprawdzamy typ błędu
    const message = error instanceof Error ? error.message : "Nieznany błąd serwera";
    console.error("DEBUG API ERROR:", message); 
    
    return NextResponse.json(
      { error: "Błąd serwera", details: message }, 
      { status: 500 }
    );
  }
}