"use client";

import { useEffect, useState, useRef } from "react";
import Skeleton from "@/components/ui/Skeleton";

type Contact = {
  id: number;
  name: string | null;
  email: string;
};

type Chat = {
  contact: Contact;
  lastMessage: {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
};

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
};

export default function MessagesModule({ initialFriendId }: { initialFriendId?: number }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Poll for chats & active message history updates
  useEffect(() => {
    loadChats();
    const interval = setInterval(() => {
      loadChats(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeContact) return;
    loadMessages(activeContact.id, false);
    const interval = setInterval(() => {
      loadMessages(activeContact.id, false);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async (showLoading = true) => {
    if (showLoading) setLoadingChats(true);
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setChats(data);

        // If an initial friend id is passed and no active contact is set yet
        if (initialFriendId && !activeContact && data.length > 0) {
          const matchingChat = data.find((c: Chat) => c.contact.id === initialFriendId);
          if (matchingChat) {
            setActiveContact(matchingChat.contact);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoadingChats(false);
    }
  };

  const loadMessages = async (friendId: number, showLoading = true) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?friendId=${friendId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setActiveContact(contact);
    loadMessages(contact.id, true);
    // Reset unread count locally for instant responsiveness
    setChats((prev) =>
      prev.map((c) => (c.contact.id === contact.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeContact.id,
          content: text,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
        loadChats(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="bg-white rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-100/50 overflow-hidden w-full min-h-[600px] h-[650px] flex flex-col md:flex-row text-left">
      {/* Sidebar: Chats list */}
      <div className="w-full md:w-[320px] bg-slate-50/50 border-r border-blue-50 flex flex-col shrink-0">
        <div className="p-6 border-b border-blue-50">
          <h2 className="text-lg font-black text-blue-900 leading-none">Rozmowy</h2>
          <p className="text-xs text-blue-300 font-bold mt-1">Czatuj ze swoimi znajomymi</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingChats && chats.length === 0 ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center p-6 text-slate-400 font-bold text-sm">
              Dodaj znajomych w sekcji &quot;Znajomi&quot;, aby rozpocząć pisanie wiadomości.
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeContact?.id === chat.contact.id;
              const hasUnread = chat.unreadCount > 0;
              return (
                <button
                  key={chat.contact.id}
                  onClick={() => handleSelectContact(chat.contact)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-white border-slate-100 hover:bg-slate-50 text-blue-900"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}
                    >
                      {chat.contact.name
                        ? chat.contact.name.charAt(0).toUpperCase()
                        : chat.contact.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className={`text-sm font-black truncate leading-tight`}>
                        {chat.contact.name || "Użytkownik"}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          isActive ? "text-blue-100" : "text-slate-400"
                        } font-semibold`}
                      >
                        {chat.lastMessage ? chat.lastMessage.content : "Brak wiadomości"}
                      </p>
                    </div>
                  </div>

                  {hasUnread && !isActive && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main pane: Active chat room */}
      <div className="flex-1 flex flex-col bg-white">
        {activeContact ? (
          <>
            {/* Active chat header */}
            <div className="p-6 border-b border-blue-50 flex items-center gap-4 bg-slate-50/20">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shadow-md">
                {activeContact.name
                  ? activeContact.name.charAt(0).toUpperCase()
                  : activeContact.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-black text-blue-900 leading-tight">
                  {activeContact.name || "Użytkownik"}
                </h3>
                <p className="text-xs text-blue-400 font-bold">{activeContact.email}</p>
              </div>
            </div>

            {/* Messages box */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/10"
            >
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-sm font-bold text-slate-400">Ładowanie wiadomości...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <div className="text-4xl mb-2">💬</div>
                  <span className="text-sm font-bold text-slate-400">Napisz pierwszą wiadomość!</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId !== activeContact.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[70%] flex flex-col">
                        <div
                          className={`p-4 rounded-[1.5rem] text-sm font-semibold leading-relaxed shadow-sm ${
                            isMe
                              ? "bg-blue-600 text-white rounded-tr-none shadow-blue-100"
                              : "bg-white border border-slate-100 text-blue-900 rounded-tl-none"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span
                          className={`text-[9px] font-bold text-slate-400 mt-1 px-1 ${
                            isMe ? "text-right" : "text-left"
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} className="p-4 border-t border-blue-50 flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Napisz wiadomość..."
                className="flex-1 border border-slate-200 focus:border-blue-500 p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-md transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center"
              >
                Wyślij
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-55">
            <div className="text-6xl mb-6">📬</div>
            <h3 className="text-lg font-black text-blue-950 mb-2">Brak wybranej rozmowy</h3>
            <p className="text-slate-400 text-sm font-bold max-w-xs">
              Wybierz znajomego z listy po lewej stronie, aby rozpocząć bezpieczną rozmowę.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
