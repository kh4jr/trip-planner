"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import TripList from "@/components/TripList";
import AuthModal from "@/components/AuthModal";
import CreateTripModal from "@/components/CreateTripModal";
import { Activity, Expense, Note, TripItem, TripInvitation, Trip, User } from "@prisma/client";
import { Session } from "next-auth";
import Link from "next/link";
import { FullTrip } from "@/types/fullTrip";

interface ReceivedTripInvite extends TripInvitation {
  trip: Trip;
  inviter: {
    name: string | null;
    email: string;
  };
}
import TripTabs from "@/components/TripTabs";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ProfileModule from "@/components/ProfileModule";
import FriendsModule from "@/components/FriendsModule";
import MessagesModule from "@/components/MessagesModule";
import NotificationsModule from "@/components/NotificationsModule";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageContext";


interface TripManagerProps {
  initialTrips: FullTrip[];
  session: Session | null;
  allAvailablePeople: {
    id: number;
    role: string;
    user: {
      id: number;
      name: string | null;
      email: string;
    };
  }[];
}

export default function TripManager({
  initialTrips,
  session,
  allAvailablePeople,
  }: TripManagerProps) {
  const { t, language } = useLanguage();
  const [trips, setTrips] = useState<FullTrip[]>(initialTrips);
  const [selectedTrip, setSelectedTrip] = useState<FullTrip | null>(
    initialTrips[0] || null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<TripItem[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "my" || tab === "all") {
      setActiveTab(tab);
    }
  }, []);

  const [currentTripParticipants, setCurrentTripParticipants] =
    useState<FullTrip["participants"]>([]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [friendsVersion, setFriendsVersion] = useState(0);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [tripInvites, setTripInvites] = useState<ReceivedTripInvite[]>([]);

  const [activeMainView, setActiveMainView] = useState<'trip' | 'profile' | 'friends' | 'messages' | 'notifications'>('trip');
  const [initialChatFriendId, setInitialChatFriendId] = useState<number | undefined>(undefined);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  useEffect(() => {
    fetchTripInvites();
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchUnreadCounts = async () => {
      try {
        const notifRes = await fetch("/api/notifications");
        if (notifRes.ok) {
          const notifications = await notifRes.json();
          const unreadNotifs = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;
          setUnreadNotificationsCount(unreadNotifs);
        }
        
        const msgRes = await fetch("/api/messages");
        if (msgRes.ok) {
          const chatsList = await msgRes.json();
          const totalUnreadMsgs = chatsList.reduce((sum: number, c: { unreadCount: number }) => sum + (c.unreadCount || 0), 0);
          setUnreadMessagesCount(totalUnreadMsgs);
        }
      } catch (err) {
        console.error("Error polling unread counts:", err);
      }
    };
    
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const fetchTripInvites = async () => {
    try {
      const res = await fetch("/api/trips/invitations");
      if (res.ok) {
        setTripInvites(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResponseTripInvite = async (invitationId: number, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch("/api/trips/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action })
      });
      if (res.ok) {
        setTripInvites((prev) => prev.filter((i) => i.id !== invitationId));
        window.location.reload();
      } else {
        const data = await res.json();
        window.alert(`Błąd: ${data.error || "Wystąpił problem"}`);
      }
    } catch (err) {
      console.error(err);
      window.alert("Wystąpił błąd");
    }
  };

  const sessionUserId = session?.user?.id
    ? Number(session.user.id)
    : null;

  const isReadOnly =
    !sessionUserId || selectedTrip?.ownerId !== sessionUserId;

  const isParticipant =
    !!sessionUserId &&
    !!selectedTrip &&
    selectedTrip.participants.some(
      (p) => p.user.id === sessionUserId || (p.user.email && p.user.email === session?.user?.email)
    );

  const allTrips: FullTrip[] = trips;

  const myTrips: FullTrip[] = trips.filter(trip =>
    trip.participants.some(
      p => p.user.email === session?.user?.email
    )
  );

  const displayedTrips: FullTrip[] =
    activeTab === "my" ? myTrips : allTrips;

  useEffect(() => {
    if (
      selectedTrip &&
      !displayedTrips.some((t) => t.id === selectedTrip.id)
    ) {
      setSelectedTrip(displayedTrips[0] || null);
    }
  }, [activeTab, displayedTrips, selectedTrip]);

  useEffect(() => {
    if (!selectedTrip) return;

    const isUserParticipant = !!sessionUserId && selectedTrip.participants.some(
      (p) => p.user.id === sessionUserId || (p.user.email && p.user.email === session?.user?.email)
    );

    if (!isUserParticipant) {
      setActivities([]);
      setExpenses([]);
      setNotes([]);
      setTodos([]);
      setCurrentTripParticipants(selectedTrip.participants || []);
      return;
    }

    fetch(`/api/activities?tripId=${selectedTrip.id}`)
      .then((res) => res.json())
      .then(setActivities)
      .catch(() => setActivities([]));

    fetch(`/api/expenses?tripId=${selectedTrip.id}`)
      .then((res) => res.json())
      .then(setExpenses)
      .catch(() => setExpenses([]));

    fetch(`/api/notes?tripId=${selectedTrip.id}`)
      .then((res) => res.json())
      .then(setNotes)
      .catch(() => setNotes(selectedTrip.notes || []));

    fetch(`/api/todo?tripId=${selectedTrip.id}`)
      .then((res) => res.json())
      .then(setTodos)
      .catch(() => setTodos(selectedTrip.items || []));

    fetch(`/api/participants?userId=${selectedTrip.ownerId}`)
      .then((res) => res.json())
      .then(setCurrentTripParticipants)
      .catch(() =>
        setCurrentTripParticipants(selectedTrip.participants || [])
      );
  }, [selectedTrip, sessionUserId, session]);

  const handleAddActivity = (a: Activity) =>
    setActivities((prev) => [...prev, a]);

  const handleDeleteActivity = async (id: number) => {
    const res = await fetch(`/api/activities?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Nie udało się usunąć aktywności");
    }

    setActivities((prev) => prev.filter((a) => a.id !== id));
  };


  const handleAddExpense = (e: Expense) =>
    setExpenses((prev) => [...prev, e]);

  const handleAddNote = (n: Note) =>
    setNotes((prev) => [...prev, n]);

  const handleAddTodo = async (content: string, category: string) => {
    if (!selectedTrip) return;
    const res = await fetch("/api/todo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        category,
        tripId: selectedTrip.id,
      }),
    });
    if (res.ok) {
      const todo = await res.json();
      setTodos((prev) => [...prev, todo]);
    }
  };

  const handleTripCreated = (newTrip: FullTrip) => {
    setTrips((prev) => [...prev, newTrip]);
    setSelectedTrip(newTrip);
    setIsCreating(false);
    setSelectedIds([]);
  };

  const handleRemoveExpense = async (id: number) => {
    const res = await fetch(`/api/expenses?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Nie udało się usunąć wydatku");
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateNote = (id: number, completed: boolean) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, isCompleted: completed } : n
      )
    );
  };

  const handleRemoveNote = async (id: number) => {
    const res = await fetch(`/api/notes?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Nie udało się usunąć notatki");
    }

    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdateTodo = (id: number, completed: boolean) => {
    setTodos(prev =>
      prev.map(t =>
        t.id === id ? { ...t, isCompleted: completed } : t
      )
    );
  };

  const handleRemoveTodo = async (id: number) => {
    const res = await fetch(`/api/todo?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Nie udało się usunąć zadania");
    }

    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const requestDeleteTrip = (id: number) => {
    setTripToDelete(id);
    setConfirmOpen(true);
  };

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;

    await fetch(`/api/trips?tripId=${tripToDelete}`, { method: "DELETE" });

    setTrips((prev) => prev.filter((t) => t.id !== tripToDelete));
    setSelectedTrip(null);
    setTripToDelete(null);
  };

  const requestLeaveTrip = () => {
    setLeaveConfirmOpen(true);
  };

  const handleLeaveTrip = async () => {
    if (!selectedTrip || !sessionUserId) return;
    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/participants/${sessionUserId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Nie udało się opuścić wyjazdu: ${data.error || "Błąd"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Wystąpił błąd");
    } finally {
      setLeaveConfirmOpen(false);
    }
  };

  return (
    <div className="!w-full !max-w-none min-h-screen bg-[#F8FAFC] !m-0 !p-0">
      { }
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent pointer-events-none" />

      { }
      <header className="fixed top-0 left-0 right-0 z-[100] !w-full bg-white/90 backdrop-blur-md border-b border-blue-50 p-6 shadow-xl shadow-blue-100/20 flex justify-between items-center transition-all">
        <Link 
          href="/" 
          className="flex items-center gap-3 group transition-transform active:scale-95">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
              <span className="text-white text-xl">✈️</span>
            </div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tighter">
            Trip<span className="text-blue-600">Planner</span>
          </h1>
        </Link>

        <div className="flex items-center space-x-6">
          <LanguageSwitcher />
          <ThemeSwitcher />
          {session ? (
            <div className="flex items-center gap-3">
              { }
              <Link 
                href="/profile" 
                className="flex items-center gap-4 bg-white/80 hover:bg-white p-2 pr-4 rounded-2xl border border-blue-50 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shadow-md border-2 border-white group-hover:scale-105 transition-transform">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-black text-blue-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">
                    {session.user?.name}
                  </p>
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider group-hover:text-blue-500">
                    {t('yourProfile')}
                  </span>
                </div>
              </Link>

              { }
              <button 
                onClick={() => signOut()} 
                className="p-2 px-3 hover:bg-red-50 rounded-xl transition-all group"
                title={t('logout')}
              >
                <span className="text-[10px] text-red-400 group-hover:text-red-600 font-black uppercase tracking-widest transition-colors">
                  {t('logout')}
                </span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsLoggingIn(true)} 
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-105"
            >
              {t('login')}
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />

      { }
      <div className="relative z-10 !w-full !max-w-none flex flex-col !items-start !pt-32 !px-4 md:!px-8">
        
        { }
        <div className="flex bg-blue-50/50 p-1.5 rounded-[1.5rem] mb-8 w-fit border border-blue-100/50 !ml-0">
          <button 
            onClick={() => {
              setActiveTab('all');
              setActiveMainView('trip');
            }}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeMainView === 'trip' && activeTab === 'all' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-100'}`}
          >
            {t('allTrips')}
          </button>
          {session && (
            <button 
              onClick={() => {
                setActiveTab('my');
                setActiveMainView('trip');
              }}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeMainView === 'trip' && activeTab === 'my' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-100'}`}
            >
              {t('myTrips')}
            </button>
          )}
        </div>

        { }
        <div className="flex flex-col lg:flex-row gap-8 !w-full !items-start !justify-start">
          
          {/* LEWo */}
          <aside className="w-full lg:w-[480px] shrink-0 lg:fixed lg:top-56 lg:z-40">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
              
              {session && (
                <div className="flex flex-col gap-2 mb-6 pb-6 border-b border-blue-100/60">
                  <button
                    onClick={() => setActiveMainView('profile')}
                    className={`w-full px-6 py-3.5 rounded-2xl text-sm font-black text-left transition-all flex items-center justify-between ${
                      activeMainView === 'profile'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 border border-blue-600'
                        : 'bg-blue-50/30 text-blue-500 hover:text-blue-600 hover:bg-blue-50/60 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">{t('myProfile')}</span>
                    <span className="text-xs font-bold opacity-60">&gt;</span>
                  </button>
                  <button
                    onClick={() => setActiveMainView('friends')}
                    className={`w-full px-6 py-3.5 rounded-2xl text-sm font-black text-left transition-all flex items-center justify-between ${
                      activeMainView === 'friends'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 border border-blue-600'
                        : 'bg-blue-50/30 text-blue-500 hover:text-blue-600 hover:bg-blue-50/60 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">{t('friends')}</span>
                    <span className="text-xs font-bold opacity-60">&gt;</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveMainView('messages');
                      setInitialChatFriendId(undefined);
                    }}
                    className={`w-full px-6 py-3.5 rounded-2xl text-sm font-black text-left transition-all flex items-center justify-between ${
                      activeMainView === 'messages'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 border border-blue-600'
                        : 'bg-blue-50/30 text-blue-500 hover:text-blue-600 hover:bg-blue-50/60 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">{t('messages')}</span>
                    {unreadMessagesCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">
                        {unreadMessagesCount}
                      </span>
                    ) : (
                      <span className="text-xs font-bold opacity-60">&gt;</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveMainView('notifications')}
                    className={`w-full px-6 py-3.5 rounded-2xl text-sm font-black text-left transition-all flex items-center justify-between ${
                      activeMainView === 'notifications'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 border border-blue-600'
                        : 'bg-blue-50/30 text-blue-500 hover:text-blue-600 hover:bg-blue-50/60 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">{t('notifications')}</span>
                    {unreadNotificationsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">
                        {unreadNotificationsCount}
                      </span>
                    ) : (
                      <span className="text-xs font-bold opacity-60">&gt;</span>
                    )}
                  </button>
                </div>
              )}

              <h2 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-6 text-left">
                {activeTab === 'my' ? t('myTrips') : t('allTrips')}
              </h2>

              <TripList
                trips={displayedTrips}
                activeTripId={selectedTrip?.id || null}
                onSelectTrip={(id) => {
                  setSelectedTrip(trips.find(t => t.id === id) || null);
                  setActiveMainView('trip');
                }}
              />

              <button 
                onClick={() => setIsCreating(true)}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                <span>+</span> {t('addTrip')}
              </button>

              {tripInvites.length > 0 && (
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-3xl p-6 text-left space-y-4 shadow-sm">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    ✉ {t('invitations')} ({tripInvites.length})
                  </h4>
                  <div className="space-y-3">
                    {tripInvites.map((invite) => (
                      <div key={invite.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-2">
                        <div>
                          <p className="text-sm font-black text-amber-900">{invite.trip.name}</p>
                          <p className="text-xs text-slate-500">{t('invitedBy')}: {invite.inviter.name || invite.inviter.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResponseTripInvite(invite.id, "ACCEPT")}
                            className="flex-1 py-2 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 transition"
                          >
                            {t('accept')}
                          </button>
                          <button
                            onClick={() => handleResponseTripInvite(invite.id, "DECLINE")}
                            className="flex-1 py-2 bg-slate-200 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-300 transition"
                          >
                            {t('decline')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* PRAWO */}
          <main className="flex-1 !w-full lg:!ml-[500px] min-w-0 !mr-0 pb-20">
            {activeMainView === 'profile' ? (
              <ProfileModule />
            ) : activeMainView === 'friends' ? (
              <FriendsModule />
            ) : activeMainView === 'messages' ? (
              <MessagesModule initialFriendId={initialChatFriendId} />
            ) : activeMainView === 'notifications' ? (
              <NotificationsModule
                onNavigateToMessages={(friendId) => {
                  setInitialChatFriendId(friendId);
                  setActiveMainView('messages');
                }}
                onNavigateToFriends={() => {
                  setActiveMainView('friends');
                }}
                onRefreshTrips={fetchTripInvites}
              />
            ) : selectedTrip ? (
              <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-100/50 border border-blue-50 p-8 md:p-10 !w-full min-h-[600px]">
                <TripTabs
                  trip={selectedTrip}
                  onDeleteTrip={requestDeleteTrip}
                  onLeaveTrip={requestLeaveTrip}
                  userName={session?.user?.name || (language === 'pl' ? 'Gość' : 'Guest')}

                  activities={activities}
                  expenses={expenses}
                  notes={notes}
                  todos={todos}

                  isReadOnly={isReadOnly}
                  isParticipant={isParticipant}

                  onAddActivity={handleAddActivity}
                  onDeleteActivity={handleDeleteActivity}

                  onAddExpense={handleAddExpense}
                  onRemoveExpense={handleRemoveExpense}

                  onAddNote={handleAddNote}
                  onToggleNote={handleUpdateNote}
                  onDeleteNote={handleRemoveNote}

                  onAddTodo={handleAddTodo}
                  onToggleTodo={handleUpdateTodo}
                  onDeleteTodo={handleRemoveTodo}
                />
              </div>
            ) : (
              <div className="h-[500px] !w-full border-4 border-dashed border-blue-50 rounded-[3.5rem] bg-blue-50/20 flex flex-col items-center justify-center text-center p-10">
                <div className="text-5xl mb-6 opacity-40">🗺️</div>
                <h3 className="text-xl font-black text-blue-900 mb-2">
                  {t('noSelectedTrip')}
                </h3>
                <p className="text-blue-300 font-bold max-w-xs">
                  {t('selectTripMessage')}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      { }
      {isCreating && (
        <CreateTripModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          allPeople={allAvailablePeople}
          selectedIds={selectedIds}      
          setSelectedIds={setSelectedIds} 
          onSuccess={handleTripCreated}   
        />
      )}

      { }
      <ConfirmModal
        open={confirmOpen}
        title={t('confirmDeleteTitle')}
        description={t('confirmDeleteDesc')}
        confirmText={t('deleteAction')}
        cancelText={t('cancel')}
        onCancel={() => {
          setConfirmOpen(false);
          setTripToDelete(null);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          handleDeleteTrip();
        }}
      />

      <ConfirmModal
        open={leaveConfirmOpen}
        title={t('confirmLeaveTitle')}
        description={t('confirmLeaveDesc')}
        confirmText={t('leaveAction')}
        cancelText={t('cancel')}
        onCancel={() => setLeaveConfirmOpen(false)}
        onConfirm={handleLeaveTrip}
      />
    </div>
  );
}