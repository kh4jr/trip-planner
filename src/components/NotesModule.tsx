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
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !content) return;

      const newNote = {
    id: Date.now(),
    tripId: tripId, // <--- TO MUSI TU BYĆ!
    title: title,
    content: content,
    createdAt: new Date().toLocaleString()
};

      onAddNote(newNote);
      setTitle('');
      setContent('');
      setIsAdding(false);
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold">Notatki z podróży</h3>
            
            <div className="grid gap-4">
                {notes.filter(n => n.tripId === tripId).map(note => (
                    <div key={note.id} className="p-4 border rounded-lg shadow-sm bg-yellow-50">
                        <h4 className="font-bold border-b mb-2">{note.title}</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        <span className="text-xs text-gray-400 mt-2 block">{note.createdAt}</span>
                    </div>
                ))}
            </div>

            <div className="mt-8 space-y-4">
                {notes.map(note => (
                    <div key={note.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded shadow-sm">
                        <h4 className="font-bold text-lg">{note.title}</h4>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{note.content}</p>
                        <div className="text-xs text-gray-400 mt-2">{note.createdAt}</div>
                    </div>
                ))}
            </div>

            {isAdding ? (
                
                <form onSubmit={handleSubmit} className="border p-4 rounded-lg bg-white space-y-3">
                    <input 
                        className="w-full p-2 border rounded" 
                        placeholder="Tytuł notatki..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea 
                        className="w-full p-2 border rounded h-24" 
                        placeholder="Treść..."
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
                    onClick={() => setIsAdding(true)} // Poprawione na true w docelowym kodzie
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                    + Dodaj nową notatkę
                </button>
            )}
        </div>
    );
}