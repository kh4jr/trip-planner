import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import WorldMap from "@/components/WorldMap";
import { geocode } from "@/lib/geocoder";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FriendProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const viewerId = Number(session.user.id);
  const profileUserId = Number(resolvedParams.id);

  if (viewerId === profileUserId) {
    redirect("/profile");
  }

  const user = await db.user.findUnique({
    where: { id: profileUserId },
  });

  if (!user) {
    notFound();
  }

  const friendship = await db.friend.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { userId: viewerId, friendId: profileUserId },
        { userId: profileUserId, friendId: viewerId },
      ],
    },
  });

  if (!friendship) {
    notFound(); 
  }

  const userTrips = await db.trip.findMany({
    where: {
      participants: {
        some: {
          userId: profileUserId,
        },
      },
    },
    include: {
      expenses: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  const totalTrips = userTrips.length;

  const totalExpensesSum = userTrips.reduce((acc, trip) => {
    const participant = trip.participants.find(p => p.userId === profileUserId);
    const participantName = participant?.name || "";
    const fallbackName = user.name || "";

    const userPaidExpenses = trip.expenses?.filter(
      (e) => e.paidBy === participantName || e.paidBy === fallbackName
    ) || [];
    const tripSum = userPaidExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return acc + tripSum;
  }, 0);

  const completedTrips = userTrips.filter(
    (t) => t.endDate && new Date(t.endDate) < new Date()
  ).length;

  const uniqueDestinations = new Set(
    userTrips.map((t) => t.destination || t.location).filter(Boolean)
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
    <div className="!w-full min-h-screen bg-[#F8FAFC] !p-6 md:!p-12 text-left">
      <Link
        href="/"
        className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest mb-8 hover:text-blue-600 transition-all w-fit"
      >
        <span className="text-xl">←</span> Powrót do planowania
      </Link>

      <div className="max-w-6xl !mx-0 flex flex-col gap-8">
        {/* KARTA PROFILU */}
        <section className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-blue-100/50 border border-blue-50 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black shadow-xl border-4 border-blue-50">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black text-blue-900 mb-2">
              {user.name}
            </h2>
            <p className="text-blue-400 font-bold">Znajomy podróżnik</p>
            <div className="flex gap-3 mt-4 justify-center md:justify-start">
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
                  ? "Osiągnął najwyższy poziom podróżnika! 🎉" 
                  : `Zrealizuje jeszcze ${3 - totalTrips} wyprawę, aby awansować na kolejny poziom! 🚀`
                }
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* STATYSTYKI */}
          <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <StatCard title="Wyjazdy" value={totalTrips} sub="Łącznie" icon="🗺️" />
            <StatCard
              title="Lokalizacje"
              value={uniqueDestinations}
              sub="Odwiedzone"
              icon="🌍"
            />
            <StatCard
              title="Budżet"
              value={`${totalExpensesSum.toFixed(2)} zł`}
              sub="Łącznie"
              icon="💰"
            />
            <StatCard
              title="Zakończone"
              value={completedTrips}
              sub="Wyjazdy"
              icon="📅"
            />
          </div>

          {/* MAPA */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-xl border border-blue-50">
            <h3 className="text-2xl font-black text-blue-900 mb-6">
              Mapa Odkryć
            </h3>
            <div className="w-full min-h-[300px] bg-blue-50/30 rounded-[2.5rem] border-2 border-dashed border-blue-100 flex items-center justify-center overflow-hidden">
              <WorldMap 
                visited={Array.from(visitedCountries)} 
                planned={Array.from(plannedCountries)} 
                pins={mapPins} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: string;
}) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 text-left">
      <div className="text-3xl mb-4">{icon}</div>
      <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">
        {title}
      </p>
      <h3 className="text-3xl font-black text-blue-900">{value}</h3>
      <p className="text-[10px] text-slate-400 mt-1 font-bold">{sub}</p>
    </div>
  );
}
