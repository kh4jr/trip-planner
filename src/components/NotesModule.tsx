"use client";
import { useState } from 'react';
import { Note } from '@/lib/data';

interface NotesModuleProps {
    tripId: number;
    notes: Note[];
    onAddNote: (note: Note) => void;
}

export default function NotesModule({ tripId, notes, onAddNote }: NotesModuleProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!content) return;

      const newNote: Note = {
        id: Date.now(),
        tripId: tripId,
        content: content,
        date: new Date().toLocaleString()
      };

      onAddNote(newNote);
      setContent('');
      setIsAdding(false);
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">Notatki z podróży</h3>
            
            <div className="grid gap-4">
                {notes.map(note => (
                    <div key={note.id} className="p-4 border rounded-lg shadow-sm bg-yellow-50">
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        <span className="text-xs text-gray-400 mt-2 block">{note.date}</span>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <form onSubmit={handleSubmit} className="border p-4 rounded-lg bg-white space-y-3">
                    <textarea 
                        className="w-full p-2 border rounded h-24" 
                        placeholder="Treść notatki..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Zapisz</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-200 px-4 py-2 rounded">Anuluj</button>
                    </div>
                </form>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                    + Dodaj nową notatkę
                </button>
            )}
        </div>
    );
}