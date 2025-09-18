// src/pages/CandidateProfilePage.tsx
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import type { Candidate } from '../lib/db';

interface TimelineEvent {
  event: string;
  date: string;
  stage: string;
}

async function fetchCandidate(id: string): Promise<Candidate> {
  const res = await fetch(`/candidates/${id}`);
  if (!res.ok) throw new Error('Failed to fetch candidate');
  return res.json();
}

async function fetchTimeline(id: string): Promise<TimelineEvent[]> {
  const res = await fetch(`/candidates/${id}/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: candidate, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => fetchCandidate(id!),
    enabled: !!id, // Only run the query if the id exists
  });

  const { data: timeline, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => fetchTimeline(id!),
    enabled: !!id,
  });

  if (isLoadingCandidate) {
    return <p>Loading candidate...</p>;
  }

  if (!candidate) {
    return <p>Candidate not found.</p>;
  }

  return (
    <div>
      <Link to="/candidates" className="text-sm text-gray-600 hover:underline mb-4 inline-block">&larr; Back to Candidates Board</Link>
      <div className="p-6 bg-white border rounded-lg shadow-sm mb-8">
        <h2 className="text-3xl font-bold">{candidate.name}</h2>
        <p className="text-lg text-gray-600">{candidate.email}</p>
        <p className="mt-2 text-md capitalize">Current Stage: <span className="font-semibold bg-gray-100 px-2 py-1 rounded-full">{candidate.stage}</span></p>
      </div>

      <h3 className="text-2xl font-bold mb-4">Timeline</h3>
      <div className="p-6 bg-white border rounded-lg shadow-sm">
        {isLoadingTimeline ? <p>Loading timeline...</p> : (
          <ul className="space-y-4">
            {timeline?.map((event, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                  <div className="flex-grow w-px bg-gray-300"></div>
                </div>
                <div>
                  <p className="font-semibold">{event.event}</p>
                  <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}