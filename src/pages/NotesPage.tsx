import React, { useState, useEffect } from 'react';
import { Save, FileText } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  useEffect(() => {
    if (autoSaveEnabled && notes && user) {
      const timer = setTimeout(() => {
        saveNotes();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [notes, autoSaveEnabled, user]);

  const loadNotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('id, content, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading notes:', error);
        return;
      }

      if (data && data.length > 0) {
        // Get the most recent note
        const mostRecentNote = data[0];
        setNotes(mostRecentNote.content || '');
        setExistingNoteId(mostRecentNote.id);
        
        // If there are multiple notes, we should clean up duplicates
        if (data.length > 1) {
          console.log('Found multiple notes, keeping the most recent one');
          // Optionally, you could delete the older notes here
          // const olderNoteIds = data.slice(1).map(note => note.id);
          // await supabase.from('user_notes').delete().in('id', olderNoteIds);
        }
      } else {
        setNotes('');
        setExistingNoteId(null);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNotes = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (existingNoteId) {
        // Update existing note
        const { error } = await supabase
          .from('user_notes')
          .update({
            content: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNoteId);

        if (error) {
          console.error('Error updating notes:', error);
          return;
        }
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('user_notes')
          .insert({
            user_id: user.id,
            content: notes,
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating notes:', error);
          return;
        }

        if (data) {
          setExistingNoteId(data.id);
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = () => {
    saveNotes();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" />
              My Notes
            </h1>
            <p className="text-gray-600">Write down your thoughts and ideas</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autosave"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autosave" className="ml-2 text-sm text-gray-700">
                Auto-save
              </label>
            </div>
            <button
              onClick={handleManualSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {lastSaved && (
          <div className="mb-4 text-sm text-gray-500">
            Last saved: {lastSaved.toLocaleString()}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Start writing your notes here..."
            className="w-full h-96 p-6 border-none resize-none focus:outline-none focus:ring-0"
            style={{ minHeight: '500px' }}
          />
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          {autoSaveEnabled ? 'Auto-save is enabled' : 'Auto-save is disabled - remember to save manually'}
        </div>
      </main>
    </div>
  );
};

export default NotesPage;