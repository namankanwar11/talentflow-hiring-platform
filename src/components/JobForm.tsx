import { useState, useEffect } from 'react';
import type { Job } from '../lib/db';

type JobFormData = Pick<Job, 'title' | 'tags' | 'status'>;
interface JobFormProps {
  onSubmit: (data: JobFormData) => void;
  onDone: () => void;
  isPending: boolean;
  initialData?: Job | null;
}

export function JobForm({ onSubmit, onDone, isPending, initialData }: JobFormProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setTags(initialData.tags.join(', '));
      setStatus(initialData.status);
    } else {
      setTitle('');
      setTags('');
      setStatus('active');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newJobData = { title, tags: tags.split(',').map(tag => tag.trim()).filter(Boolean), status };
    onSubmit(newJobData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title</label>
        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" required />
      </div>
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
        <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
      </div>
      {initialData && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-white">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button type="button" onClick={onDone} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 border rounded-lg shadow-sm hover:bg-gray-900 disabled:opacity-50">
          {isPending ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Job')}
        </button>
      </div>
    </form>
  );
}