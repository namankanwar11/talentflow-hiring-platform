import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core';
import type { Candidate } from '../lib/db';
import { KanbanColumn } from '../components/KanbanColumn';
import { CandidateCard } from '../components/CandidateCard';

const STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"] as const;

// --- API Functions ---

async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch('/candidates');
  if (!res.ok) throw new Error('Failed to fetch candidates');
  return res.json();
}

async function updateCandidateStage(variables: { id: string, stage: string }): Promise<Candidate> {
  const { id, stage } = variables;
  const res = await fetch(`/candidates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage }),
  });
  if (!res.ok) throw new Error('Failed to update candidate stage');
  return res.json();
}

// --- Main Page Component ---

export function CandidatesPage() {
  const queryClient = useQueryClient();
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: fetchCandidates,
  });

  const updateStageMutation = useMutation({
    mutationFn: updateCandidateStage,
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['candidates'] });
      const previousCandidates = queryClient.getQueryData<Candidate[]>(['candidates']);
      
      queryClient.setQueryData<Candidate[]>(['candidates'], (old = []) => 
        old.map(c => c.id === id ? { ...c, stage: stage as Candidate['stage'] } : c)
      );
      
      return { previousCandidates };
    },
    onError: (err, variables, context) => {
      if (context?.previousCandidates) {
        queryClient.setQueryData(['candidates'], context.previousCandidates);
      }
      alert('Failed to move candidate. Change has been rolled back.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });

  const candidatesByStage = useMemo(() => {
    const grouped: Record<string, Candidate[]> = {};
    STAGES.forEach(stage => grouped[stage] = []);
    candidates.forEach(candidate => {
      // This new check ensures the candidate's stage is valid before we use it
      if (candidate.stage && grouped[candidate.stage]) {
        grouped[candidate.stage].push(candidate);
      }
    });
    return grouped;
  }, [candidates]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCandidate(null);

    if (over && active.id !== over.id) {
      const candidateId = active.id as string;
      const newStage = over.id as string;
      const oldStage = candidates.find(c => c.id === candidateId)?.stage;

      if (oldStage && newStage !== oldStage) {
        updateStageMutation.mutate({ id: candidateId, stage: newStage });
      }
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const candidate = candidates.find(c => c.id === event.active.id);
    if (candidate) {
      setActiveCandidate(candidate);
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Candidates Board</h2>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto p-4">
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              id={stage}
              title={stage.charAt(0).toUpperCase() + stage.slice(1)}
              candidates={candidatesByStage[stage]}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCandidate ? <CandidateCard candidate={activeCandidate} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}