export const translations = {
  pl: {
    // Header
    appName: "TripPlanner",
    yourProfile: "Twój profil",
    logout: "Wyloguj",
    login: "Zaloguj się",
    
    // Main Tabs
    allTrips: "Wszystkie wyjazdy",
    myTrips: "Moje wyjazdy",
    
    // Sidebar
    myProfile: "👤 Mój profil",
    friends: "👥 Znajomi",
    messages: "💬 Wiadomości",
    notifications: "🔔 Powiadomienia",
    
    // Invites
    invitations: "Zaproszenia do wyjazdów",
    accept: "Akceptuj",
    decline: "Odrzuć",
    noInvitations: "Brak nowych zaproszeń",
    invitedBy: "Zaprasza",
    
    // Trip tabs & content
    plan: "Plan wyjazdu",
    tasks: "Lista zadań / Ekwipunek",
    expenses: "Wydatki",
    notes: "Notatki / Linki",
    participants: "Uczestnicy",
    groupChat: "Wiadomości grupowe",
    photos: "Zdjęcia",
    
    // Buttons & actions
    addTrip: "Nowy Wyjazd",
    deleteTrip: "Usuń wyjazd",
    leaveTrip: "Opuść wyjazd",
    exportPdf: "Eksportuj do PDF",
    exportDocx: "Eksportuj do DOCX",
    confirmDelete: "Czy na pewno chcesz usunąć ten wyjazd?",
    confirmLeave: "Czy na pewno chcesz opuścić ten wyjazd?",
    
    // No selected trip
    noSelectedTrip: "Brak wybranego celu",
    selectTripMessage: "Wybierz wyjazd z listy po lewej stronie, aby zarządzać planem.",

    // Confirm modals
    confirmDeleteTitle: "Usunąć wyjazd?",
    confirmDeleteDesc: "Ta operacja jest nieodwracalna. Wszystkie dane wyjazdu zostaną usunięte.",
    confirmLeaveTitle: "Opuścić wyjazd?",
    confirmLeaveDesc: "Czy na pewno chcesz opuścić ten wyjazd? Nie będziesz mieć już dostępu do jego szczegółów.",
    cancel: "Anuluj",
    deleteAction: "Usuń",
    leaveAction: "Opuść"
  },
  en: {
    // Header
    appName: "TripPlanner",
    yourProfile: "Your profile",
    logout: "Log out",
    login: "Log in",
    
    // Main Tabs
    allTrips: "All trips",
    myTrips: "My trips",
    
    // Sidebar
    myProfile: "👤 My Profile",
    friends: "👥 Friends",
    messages: "💬 Messages",
    notifications: "🔔 Notifications",
    
    // Invites
    invitations: "Trip invitations",
    accept: "Accept",
    decline: "Decline",
    noInvitations: "No new invitations",
    invitedBy: "Invited by",
    
    // Trip tabs & content
    plan: "Trip plan",
    tasks: "Tasks / Packing list",
    expenses: "Expenses",
    notes: "Notes / Links",
    participants: "Participants",
    groupChat: "Group chat",
    photos: "Photos",
    
    // Buttons & actions
    addTrip: "New Trip",
    deleteTrip: "Delete trip",
    leaveTrip: "Leave trip",
    exportPdf: "Export to PDF",
    exportDocx: "Export to DOCX",
    confirmDelete: "Are you sure you want to delete this trip?",
    confirmLeave: "Are you sure you want to leave this trip?",
    
    // No selected trip
    noSelectedTrip: "No destination selected",
    selectTripMessage: "Select a trip from the list on the left to manage the plan.",

    // Confirm modals
    confirmDeleteTitle: "Delete trip?",
    confirmDeleteDesc: "This operation is irreversible. All trip data will be deleted.",
    confirmLeaveTitle: "Leave trip?",
    confirmLeaveDesc: "Are you sure you want to leave this trip? You will no longer have access to its details.",
    cancel: "Cancel",
    deleteAction: "Delete",
    leaveAction: "Leave"
  }
};

export type Language = "pl" | "en";
export type TranslationKey = keyof typeof translations.pl;
