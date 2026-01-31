import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface ApplyData {
    role: string;
    tripId: number;
    userId: number;
    name: string;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as { id: string | number } | undefined;

        if (!user?.id) {
            return NextResponse.json({ error: "Nieautoryzowany" }, { status: 401 });
        }

        const { tripId } = await req.json();

        const participantData: ApplyData = {
            role: "GUEST",
            tripId: Number(tripId),
            userId: Number(user.id),
            name: session?.user?.name || "Uczestnik",
        };

        // Rzutowanie na unknown ucisza błędy typowania bez użycia any
        const participant = await (db.participant as unknown as { 
            create: (args: { data: ApplyData }) => Promise<unknown> 
        }).create({
            data: participantData
        });

        return NextResponse.json(participant, { status: 201 });
    } catch (error) {
        console.error("Apply error:", error);
        return NextResponse.json(
            { error: "Już dołączyłeś lub wystąpił błąd bazy danych" }, 
            { status: 500 }
        );
    }
}