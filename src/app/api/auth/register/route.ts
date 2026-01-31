import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    // 1. Sprawdź czy użytkownik już istnieje
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Użytkownik o tym mailu już istnieje" }, { status: 400 });
    }

    // 2. Zahashuj hasło (nigdy nie trzymaj czystego tekstu!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Zapisz w bazie
    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "Konto założone!", user: { email: newUser.email } }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: "Błąd serwera" }, { status: 500 });
  }
}