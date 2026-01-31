import React from 'react';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import WorldMap from "@/components/WorldMap";
import { Expense } from '@prisma/client';

// Interfejsy
interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: string;
}

interface ArchiveItemProps {
  title: string;
  date: string;
  cost: string;
  status: string;
  isBlue?: boolean;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userIdNumber = parseInt(session.user.id);

  const userTrips = await db.trip.findMany({
    where: { 
      ownerId: userIdNumber 
    },
    include: {
      expenses: true,
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  // --- LOGIKA STATYSTYK BEZ 'ANY' ---
  const totalTrips = userTrips.length;

  const totalExpensesSum = userTrips.reduce((acc, trip) => {
    // TypeScript wie, że e to Expense dzięki relacji w Prisma
    const tripSum = trip.expenses?.reduce((s, e) => {
      // Bezpieczna konwersja Decimal/Float na liczbę
      const val = e.amount ? Number(e.amount.toString()) : 0;
      return s + (isNaN(val) ? 0 : val);
    }, 0) || 0;
    
    return acc + tripSum;
  }, 0);

  const completedTrips = userTrips.filter(t => t.endDate && new Date(t.endDate) < new Date()).length;
  const uniqueDestinations = new Set(userTrips.map(t => t.destination).filter(Boolean)).size;

  const visitedCountries = Array.from(
    new Set(userTrips.map((trip) => trip.destination).filter(Boolean))
  ) as string[];

  return (
    <div className="!w-full min-h-screen bg-[#F8FAFC] !p-6 md:!p-12 text-left">
      <Link href="/" className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest mb-8 hover:text-blue-600 transition-all w-fit">
        <span className="text-xl">←</span> Powrót do planowania
      </Link>

      <div className="max-w-6xl !mx-0 flex flex-col gap-8">
        {/* KARTA PROFILU */}
        <section className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-blue-100/50 border border-blue-50 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black shadow-xl border-4 border-blue-50">
            {session.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black text-blue-900 mb-2">{session.user?.name}</h2>
            <p className="text-blue-400 font-bold">Aktywny podróżnik</p>
            <div className="flex gap-3 mt-4 justify-center md:justify-start">
              <span className="bg-amber-100 text-amber-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase">🏆 Eksplorer</span>
              <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase">✈️ {totalTrips} Wypraw</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* STATYSTYKI */}
          <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <StatCard title="Suma wyjazdów" value={totalTrips} sub="Wszystkie wyprawy" icon="🗺️" />
            <StatCard title="Lokalizacje" value={uniqueDestinations} sub="Odwiedzone miejsca" icon="🌍" />
            <StatCard title="Łączny budżet" value={`${totalExpensesSum.toFixed(2)} zł`} sub="Wydane łącznie" icon="💰" />
            <StatCard title="Zakończone" value={completedTrips} sub="Archiwalne" icon="📅" />
          </div>

          {/* MAPA */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-xl border border-blue-50 flex flex-col relative overflow-hidden group">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-blue-900">Mapa Odkryć</h3>
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Twoje pinezki na świecie</p>
            </div>
            
            <div className="flex-1 w-full min-h-[300px] bg-blue-50/30 rounded-[2.5rem] border-2 border-dashed border-blue-100 flex items-center justify-center overflow-hidden">
              <WorldMap visited={visitedCountries} />
            </div>

            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Odwiedzone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">W planach</span>
              </div>
            </div>
          </div>
        </div>

        {/* ARCHIWUM */}
        <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-blue-50">
          <h3 className="text-2xl font-black text-blue-900 mb-8">Archiwum wypraw</h3>
          <div className="space-y-4">
            {userTrips.length > 0 ? (
              userTrips.map((trip) => {
                const isFinished = trip.endDate && new Date(trip.endDate) < new Date();
                // Poprawione sumowanie dla pojedynczej karty
                const tripCost = trip.expenses?.reduce((s, e) => s + (Number(e.amount.toString()) || 0), 0) || 0;
                
                return (
                  <ArchiveItem 
                    key={trip.id}
                    title={trip.name} 
                    date={trip.startDate ? new Date(trip.startDate).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }) : "Brak daty"} 
                    cost={`${tripCost.toFixed(2)} zł`}
                    status={isFinished ? "ZAKOŃCZONE" : "PLANOWANE"} 
                    isBlue={!isFinished} 
                  />
                );
              })
            ) : (
              <p className="text-slate-400 font-bold py-4">Nie masz jeszcze żadnych wyjazdów.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: StatCardProps) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 text-left">
      <div className="text-3xl mb-4">{icon}</div>
      <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-blue-900">{value}</h3>
      <p className="text-[10px] text-slate-400 mt-1 font-bold">{sub}</p>
    </div>
  );
}

function ArchiveItem({ title, date, cost, status, isBlue }: ArchiveItemProps) {
  return (
    <div className={`flex items-center justify-between p-6 rounded-2xl border ${isBlue ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="text-left">
        <h4 className="font-black text-blue-900">{title}</h4>
        <p className="text-xs text-slate-400 font-bold">{date}</p>
      </div>
      <div className="text-right">
        <p className="font-black text-blue-900">{cost}</p>
        <p className={`text-[9px] font-black uppercase tracking-widest ${isBlue ? 'text-blue-500' : 'text-green-500'}`}>{status}</p>
      </div>
    </div>
  );
}