// pages/participants.js
"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';

interface Participant {
  name: string;
  image: string;
  email: string;
  currentProfession: string;
  investmentField: string;
  isScanned: boolean;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchParticipants() {
      try {
        const response = await fetch('/api/all');
        if (!response.ok) {
          throw new Error('Failed to fetch participants');
        }
        const data = await response.json();
        console.log(data);
        setParticipants(data.data);
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        setLoading(false);
      }
    }

    fetchParticipants();
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-xl">Loading participants...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Event Participants</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6 text-center">Event Participants</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.map((participant) => {
          return (
            <div 
              key={participant.name} 
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow"
            >
              <img 
                src={participant.image} 
                alt={`${participant.name}'s profile`} 
                className=" rounded-lg mb-4"
              />
              <h2 className="text-xl text-black font-semibold mb-2">{participant.name}</h2>
              <p className="text-gray-600 mb-2">
                <strong>Email:</strong> {participant.email}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Profession:</strong> {participant.currentProfession}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>Investment Interest:</strong> {participant.investmentField}
              </p>
              <div className="mt-4 text-sm">
                <span className={`px-3 py-1 rounded-full ${
                  participant.isScanned ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {participant.isScanned ? 'Checked In' : 'Not Checked In'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
