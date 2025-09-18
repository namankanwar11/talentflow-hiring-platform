// src/components/CandidateCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom'; // <-- IMPORT ADDED
import type { Candidate } from '../lib/db';

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: candidate.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    // The main element is now a Link, and it gets the ref and style props
    // so dnd-kit can track its position and movement.
    <Link to={`/candidates/${candidate.id}`} ref={setNodeRef} style={style}>
      <div
        // The listeners and attributes for dragging remain on the inner div.
        {...attributes}
        {...listeners}
        className="p-4 mb-2 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-gray-50"
      >
        <p className="font-semibold text-gray-800">{candidate.name}</p>
        <p className="text-sm text-gray-500">{candidate.email}</p>
      </div>
    </Link>
  );
}