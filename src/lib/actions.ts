// src/lib/actions.ts
'use server'

import { prisma } from './db'
import { revalidatePath } from 'next/cache'
import { TripFormData } from './data'
// Używamy 'type' i aliasów, aby uniknąć błędów 'Duplicate identifier'
import type { Trip as PrismaTrip } from '@prisma/client'

export async function createTrip(data: TripFormData) {
  try {
    const trip = await prisma.trip.create({
      data: {
        name: data.name,
        destination: data.destination,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        participants: {
          create: data.participants.map((p) => ({
            name: p.name,
            email: p.email || '',
            role: p.role || 'member'
          }))
        }
      }
    })
    revalidatePath('/')
    return trip;
  } catch (error) {
    console.error("Szczegółowy błąd bazy:", error);
    throw new Error("Nie udało się zapisać w PostgreSQL");
  }
}