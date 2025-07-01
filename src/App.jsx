import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { uploadData, getUrl } from 'aws-amplify/storage';

import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { listNotes } from './graphql/queries';

Amplify.configure(outputs);

const client = generateClient();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const noteData = await client.graphql({ query: listNotes });
      const notesWithImages = await Promise.all(
        noteData.data.listNotes.items.map(async (note) => {
          if (note.image) {
            const imageUrl = await getUrl({ key: note.image });
            return { ...note, imageUrl: imageUrl.url };
          }
          return note;
        })
      );
      setNotes(notesWithImages);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  }

  async function createNote(event) {
    event.preventDefault();
    const { name, description, image } = formData;
    if (!name || !description) return;

    try {
      let imageName;
      if (image) {
        imageName = `${Date.now()}-${image.name}`;
        await uploadData({ key: imageName, data: image }).result;
      }

      await client.graphql({
        query: createNoteMutation,
        variables: { input: { name, description, image: imageName } },
      });

      setFormData({ name: '', description: '', image: null });
      fetchNotes();
    } catch (err) {
      console.error('Error creating note:', err);
    }
  }

  async function deleteNote(id) {
    try {
      await client.graphql({
        query: deleteNoteMutation,
        variables: { input: { id } },
      });
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main className="max-w-2xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Hello, {user.username}! Notes App</h1>
          <form onSubmit={createNote} className="mb-8">
            <input
              type="text"
              placeholder="Note name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border p-2 w-full mb-2"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border p-2 w-full mb-2"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              className="mb-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Note
            </button>
          </form>

          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border p-4 rounded shadow">
                <h2 className="font-bold text-xl">{note.name}</h2>
                <p>{note.description}</p>
                {note.imageUrl && (
                  <img src={note.imageUrl} alt={note.name} className="mt-2 max-h-48 object-contain" />
                )}
                <button
                  onClick={() => deleteNote(note.id)}
                  className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete Note
                </button>
              </div>
            ))}
          </div>

          <button onClick={signOut} className="mt-8 underline text-blue-600">
            Sign out
          </button>
        </main>
      )}
    </Authenticator>
  );
}

