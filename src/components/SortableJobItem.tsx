import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, ClipboardList } from 'lucide-react';
import type { Job } from '../lib/db';
import { Link } from 'react-router-dom';

const StatusBadge = ({ status }: { status: 'active' | 'archived' }) => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
  if (status === 'active') {
    return <span className={`${baseClasses} bg-green-100 text-green-800`}>Active</span>;
  }
  return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Archived</span>;
};

export function SortableJobItem({ job, onEdit }: { job: Job; onEdit: (jobId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: job.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center justify-between p-4 bg-white">
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 p-2">
          <GripVertical />
        </button>
        <div>
          <p className="text-lg font-semibold text-gray-800">{job.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={job.status} />
            <div className="flex flex-wrap gap-1">
              {job.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <Link to={`/jobs/${job.id}/assessment`} title="Edit Assessment" className="p-2 text-gray-400 hover:text-gray-700">
          <ClipboardList size={16} />
        </Link>
        <button onClick={() => onEdit(job.id)} title="Edit Job" className="p-2 text-gray-400 hover:text-gray-700">
          <Pencil size={16} />
        </button>
      </div>
    </li>
  );
}