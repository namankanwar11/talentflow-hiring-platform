import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { Job } from '../lib/db';
import { JobForm } from '../components/JobForm';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableJobItem } from '../components/SortableJobItem';

// --- API Functions ---
async function fetchJobs(status: StatusFilter): Promise<Job[]> {
  let url = '/jobs';
  if (status !== 'all') {
    url += `?status=${status}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
}

async function createJob(newJobData: Partial<Job>): Promise<Job> {
  const res = await fetch('/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newJobData),
  });
  if (!res.ok) throw new Error('Failed to create job');
  return res.json();
}

async function updateJob(variables: { id: string; data: Partial<Job> }): Promise<Job> {
  const { id, data } = variables;
  const res = await fetch(`/jobs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update job');
  return res.json();
}

async function reorderJob({ id, fromOrder, toOrder }: { id: string; fromOrder: number; toOrder: number }) {
  const res = await fetch(`/jobs/${id}/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromOrder, toOrder }),
  });
  if (!res.ok) throw new Error('Failed to reorder job');
  return res.json();
}
// --- End API Functions ---

type StatusFilter = 'all' | 'active' | 'archived';

export function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [, setEditingJob] = useState<Job | null>(null);
  const [jobItems, setJobItems] = useState<Job[]>([]);
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false); // For debugging

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn: () => fetchJobs(statusFilter),
  });

  useEffect(() => {
    if (jobs) {
      setJobItems(jobs);
    }
  }, [jobs]);

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowCreateForm(false);
    },
    onError: (err) => {
      console.error("Failed to create job:", err);
      alert(`Failed to create job: ${err.message}`);
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: updateJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setEditingJob(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderJob,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['jobs', statusFilter] });
      const previousJobs = queryClient.getQueryData<Job[]>(['jobs', statusFilter]);
      setJobItems((prevItems) => arrayMove(prevItems, variables.fromOrder, variables.toOrder));
      return { previousJobs };
    },
    onError: (err, variables, context) => {
      if (context?.previousJobs) {
        setJobItems(context.previousJobs);
        alert('Failed to reorder job. The change has been rolled back.');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', statusFilter] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = jobItems.findIndex((item) => item.id === active.id);
      const newIndex = jobItems.findIndex((item) => item.id === over.id);
      reorderMutation.mutate({ id: active.id as string, fromOrder: oldIndex, toOrder: newIndex });
    }
  }

  const handleOpenEditModal = (jobId: string) => {
    const jobToEdit = jobs?.find((j) => j.id === jobId);
    if (jobToEdit) setEditingJob(jobToEdit);
  };

  const FilterButton = ({ value, label }: { value: StatusFilter; label: string }) => (
    <button
      onClick={() => setStatusFilter(value)}
      className={`px-3 py-1 text-sm font-medium rounded-md ${
        statusFilter === value ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Jobs</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg shadow-sm hover:bg-gray-900"
        >
          <Plus size={16} />
          <span>Create Job</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="my-8 p-6 bg-white border rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Create a New Job</h3>
          <JobForm
            onSubmit={(data) => createJobMutation.mutate(data)}
            onDone={() => setShowCreateForm(false)}
            isPending={createJobMutation.isPending}
            initialData={null}
          />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 p-4 bg-white border rounded-lg shadow-sm">
        <span className="text-sm font-semibold text-gray-700">Filter by status:</span>
        <FilterButton value="all" label="All" />
        <FilterButton value="active" label="Active" />
        <FilterButton value="archived" label="Archived" />
      </div>

      <div className="p-4 bg-white border rounded-lg shadow-sm">
        {isLoading && <p className="text-gray-500">Loading jobs...</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={jobItems} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-gray-200">
              {jobItems.map((job) => (
                <SortableJobItem key={job.id} job={job} onEdit={handleOpenEditModal} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}