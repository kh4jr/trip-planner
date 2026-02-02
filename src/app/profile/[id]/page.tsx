import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import WorldMap from "@/components/WorldMap";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function FriendProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const viewerId = Number(session.user.id);
  const profileUserId = Number(params.id);

  // jeśli to mój własny profil → redirect
  if (viewerId === profileUserId) {
    redirect("/profile");
  }

  // pobierz użytkownika
  const user = await db.user.findUnique({
    where: { id: profileUserId },
  });

  if (!user) {
    notFound();
  }

  // sprawdź czy to mój znajomy
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
    notFound(); // brak dostępu
  }

  // pobierz wyjazdy znajomego
  const userTrips = await db.trip.findMany({
    where: {
      ownerId: profileUserId,
    },
    include: {
      expenses: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  const totalTrips = userTrips.length;

  const totalExpensesSum = userTrips.reduce((acc, trip) => {
    const tripSum =
      trip.expenses?.reduce((s, e) => {
        const val = Number(e.amount?.toString() || 0);
        return s + (isNaN(val) ? 0 : val);
      }, 0) || 0;

    return acc + tripSum;
  }, 0);

  const completedTrips = userTrips.filter(
    (t) => t.endDate && new Date(t.endDate) < new Date()
  ).length;

  const uniqueDestinations = new Set(
    userTrips.map((t) => t.destination).filter(Boolean)
  ).size;

  const visitedCountries = Array.from(
    new Set(userTrips.map((t) => t.destination).filter(Boolean))
  ) as string[];

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
              <WorldMap visited={visitedCountries} />
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
