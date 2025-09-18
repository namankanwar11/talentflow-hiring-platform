// src/components/KanbanColumn.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Candidate } from '../lib/db';
import { CandidateCard } from './CandidateCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  candidates: Candidate[];
}

export function KanbanColumn({ id, title, candidates }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-gray-100 rounded-lg">
      <h3 className="p-4 text-lg font-semibold text-gray-700 border-b">{title}</h3>
      <div ref={setNodeRef} className="flex-grow p-4 overflow-y-auto">
        <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {candidates.map(candidate => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}