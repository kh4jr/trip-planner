import React from 'react';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth'; 
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import WorldMap from "@/components/WorldMap";
import { geocode } from "@/lib/geocoder";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: string;
  href?: string;
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
      participants: {
        some: {
          userId: userIdNumber
        }
      }
    },
    include: {
      expenses: true,
      participants: {
        include: {
          user: true
        }
      }
    },
    orderBy: { startDate: 'desc' }
  });

  const totalTrips = userTrips.length;

  const totalExpensesSum = userTrips.reduce((acc, trip) => {
    const participant = trip.participants.find(p => p.userId === userIdNumber);
    const participantName = participant?.name || "";
    const fallbackName = session.user?.name || "";

    const userPaidExpenses = trip.expenses?.filter(
      (e) => e.paidBy === participantName || e.paidBy === fallbackName
    ) || [];
    const tripSum = userPaidExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return acc + tripSum;
  }, 0);

  const completedTrips = userTrips.filter(
    t => t.endDate && new Date(t.endDate) < new Date()
  ).length;

  const uniqueDestinations = new Set(
    userTrips.map(t => t.destination || t.location).filter(Boolean)
  ).size;

  const visitedCountries = new Set<string>();
  const plannedCountries = new Set<string>();
  const uniquePinsMap = new Map<string, [number, number]>();

  for (const trip of userTrips) {
    const name = trip.destination || trip.location || "";
    if (!name) continue;

    const resolved = await geocode(name);
    if (resolved) {
      uniquePinsMap.set(name, resolved.coordinates);
      const isFinished = trip.endDate && new Date(trip.endDate) < new Date();
      if (isFinished) {
        visitedCountries.add(resolved.countryCode);
      } else {
        plannedCountries.add(resolved.countryCode);
      }
    }
  }

  for (const code of visitedCountries) {
    plannedCountries.delete(code);
  }

  const mapPins = Array.from(uniquePinsMap.entries()).map(([name, coords]) => ({
    name,
    coordinates: coords,
  }));

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] px-6 md:px-10 text-left">
      <div className="w-full max-w-none flex flex-col gap-10">

        <Link
          href="/"
          className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest mb-8 hover:text-blue-600 transition-all w-fit"
        >
          <span className="text-xl">←</span> Powrót do planowania
        </Link>

        <div className="flex flex-col gap-10">

          {/* KARTA PROFILU */}
          <section className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-blue-100/50 border border-blue-50 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black shadow-xl border-4 border-blue-50">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black text-blue-900 mb-2">
                {session.user?.name}
              </h2>
              <p className="text-blue-400 font-bold">Aktywny podróżnik</p>
              <div className="flex gap-3 mt-4 justify-center md:justify-start">
                <span className="bg-amber-100 text-amber-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase">
                  🏆 Eksplorer
                </span>
                <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-xl text-xs font-black uppercase">
                  ✈️ {totalTrips} Wypraw
                </span>
              </div>

              {/* Milestone progress bar */}
              <div className="mt-6 max-w-md mx-auto md:mx-0">
                <div className="flex justify-between items-center mb-2 gap-4">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Poziom 2</span>
                  <span className="text-xs font-bold text-slate-400">Następny poziom przy 3 wyprawach</span>
                </div>
                <div className="w-full bg-blue-100/50 h-3 rounded-full overflow-hidden p-0.5 border border-blue-100 shadow-inner">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500 shadow-md shadow-blue-200" 
                    style={{ width: `${Math.min(100, (totalTrips / 3) * 100)}%` }} 
                  />
                </div>
                <p className="text-[10px] font-bold text-blue-400 mt-2">
                  {totalTrips >= 3 
                    ? "Gratulacje! Osiągnąłeś najwyższy poziom podróżnika! 🎉" 
                    : `Zrealizuj jeszcze ${3 - totalTrips} wyprawę, aby awansować na kolejny poziom! 🚀`
                  }
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
              <StatCard title="Suma wyjazdów" value={totalTrips} sub="Wszystkie wyprawy" icon="🗺️" href="/?tab=my" />
              <StatCard title="Lokalizacje" value={uniqueDestinations} sub="Odwiedzone miejsca" icon="🌍" href="/?tab=my" />
              <StatCard title="Łączny budżet" value={`${totalExpensesSum.toFixed(2)} zł`} sub="Wydane łącznie" icon="💰" />
              <StatCard title="Zakończone" value={completedTrips} sub="Archiwalne" icon="📅" />
            </div>

            <div className="xl:col-span-8 bg-white rounded-[3rem] p-8 shadow-2xl border border-blue-50 flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-blue-900">Mapa Odkryć</h3>
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">
                  Twoje pinezki na świecie
                </p>
              </div>

              <div className="flex-1 w-full min-h-[420px] lg:min-h-[500px] bg-blue-50/30 rounded-[2.5rem] border-2 border-dashed border-blue-100 flex items-center justify-center overflow-hidden">
                <WorldMap 
                  visited={Array.from(visitedCountries)} 
                  planned={Array.from(plannedCountries)} 
                  pins={mapPins} 
                />
              </div>

              <div className="flex gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-200" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Odwiedzone
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-200 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    W planach
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-blue-50">
            <h3 className="text-2xl font-black text-blue-900 mb-8">
              Archiwum wypraw
            </h3>
            <div className="space-y-4">
              {userTrips.length > 0 ? (
                userTrips.map((trip) => {
                  const isFinished =
                    trip.endDate && new Date(trip.endDate) < new Date();

                  const tripCost =
                    trip.expenses?.reduce(
                      (s, e) => s + (Number(e.amount.toString()) || 0),
                      0
                    ) || 0;

                  return (
                    <ArchiveItem
                      key={trip.id}
                      title={trip.name}
                      date={
                        trip.startDate
                          ? new Date(trip.startDate).toLocaleDateString(
                              'pl-PL',
                              { month: 'long', year: 'numeric' }
                            )
                          : "Brak daty"
                      }
                      cost={`${tripCost.toFixed(2)} zł`}
                      status={isFinished ? "ZAKOŃCZONE" : "PLANOWANE"}
                      isBlue={!isFinished}
                    />
                  );
                })
              ) : (
                <p className="text-slate-400 font-bold py-4">
                  Nie masz jeszcze żadnych wyjazdów.
                </p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, href }: StatCardProps) {
  const card = (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-blue-100 cursor-pointer h-full">
      <div className="text-3xl mb-4">{icon}</div>
      <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">
        {title}
      </p>
      <h3 className="text-3xl font-black text-blue-900">{value}</h3>
      <p className="text-[10px] text-slate-400 mt-1 font-bold">{sub}</p>
    </div>
  );

  if (href) {
    return <Link href={href} className="block no-underline">{card}</Link>;
  }
  return card;
}

function ArchiveItem({ title, date, cost, status, isBlue }: ArchiveItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-6 rounded-2xl border ${
        isBlue
          ? 'bg-blue-50 border-blue-100'
          : 'bg-slate-50 border-slate-100'
      }`}
    >
      <div className="text-left">
        <h4 className="font-black text-blue-900">{title}</h4>
        <p className="text-xs text-slate-400 font-bold">{date}</p>
      </div>
      <div className="text-right">
        <p className="font-black text-blue-900">{cost}</p>
        <p
          className={`text-[9px] font-black uppercase tracking-widest ${
            isBlue ? 'text-blue-500' : 'text-green-500'
          }`}
        >
          {status}
        </p>
      </div>
    </div>
  );
}
