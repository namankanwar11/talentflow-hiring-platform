import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// --- Types ---
interface ValidationRules { required?: boolean; }
type QuestionType = 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';
interface Question { id: number; type: QuestionType; question: string; options?: string[]; validation?: ValidationRules; }

// --- API Functions ---
async function fetchAssessment(jobId: string): Promise<{ questions: Question[] }> {
    const res = await fetch(`/assessments/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch assessment');
    return res.json();
}
async function submitAssessment(variables: { jobId: string, responses: any }) {
    const { jobId, responses } = variables;
    const res = await fetch(`/assessments/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responses),
    });
    if (!res.ok) throw new Error('Failed to submit assessment');
    return res.json();
}

export function TakeAssessmentPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [responses, setResponses] = useState<Record<string, any>>({});

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', jobId],
    queryFn: () => fetchAssessment(jobId!),
    enabled: !!jobId,
  });
  
  const submitMutation = useMutation({
    mutationFn: submitAssessment,
    onSuccess: (data) => {
      alert('Assessment submitted successfully!');
      console.log('Server response:', data);
    },
    onError: (err) => {
        alert(`Submission failed: ${err.message}`);
    }
  });
  
  const handleResponseChange = (questionId: number, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const question of assessment?.questions || []) {
      if (question.validation?.required) {
        const response = responses[question.id];
        if (!response || response.length === 0) {
          alert(`Question "${question.question}" is required.`);
          return;
        }
      }
    }
    submitMutation.mutate({ jobId: jobId!, responses });
  };

  return (
    <div>
      <Link to={`/jobs/${jobId}/assessment`} className="text-sm text-gray-600 hover:underline mb-4 inline-block">&larr; Back to Builder</Link>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Assessment</h2>
        <p className="text-lg text-gray-600 mt-1">Please answer the following questions.</p>
      </div>

      {isLoading ? <p>Loading assessment...</p> : (
        <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white border rounded-lg shadow-sm">
          {assessment?.questions.map((q, index) => (
            <div key={q.id}>
              <label className="block font-semibold text-gray-800">
                {index + 1}. {q.question}
                {q.validation?.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {q.type === 'short-text' && <input type="text" onChange={e => handleResponseChange(q.id, e.target.value)} className="w-full p-2 mt-2 border rounded-md" />}
              {q.type === 'long-text' && <textarea onChange={e => handleResponseChange(q.id, e.target.value)} className="w-full p-2 mt-2 border rounded-md" rows={4}></textarea>}
              {q.type === 'numeric' && <input type="number" onChange={e => handleResponseChange(q.id, e.target.value)} className="w-full p-2 mt-2 border rounded-md" />}
              {/* THIS IS THE CORRECTED LINE */}
              {q.type === 'file-upload' && <input type="file" onChange={e => handleResponseChange(q.id, e.target.files ? e.target.files[0].name : null)} className="w-full p-2 mt-2 border rounded-md text-sm" />}
              {q.type === 'single-choice' && (
                <div className="mt-2 space-y-2">
                  {q.options?.map((opt) => <div key={opt}><label className="flex items-center gap-2"><input type="radio" name={`q_${q.id}`} value={opt} checked={responses[q.id] === opt} onChange={e => handleResponseChange(q.id, e.target.value)} /> {opt}</label></div>)}
                </div>
              )}
              {q.type === 'multi-choice' && (
                <div className="mt-2 space-y-2">
                  {q.options?.map((opt) => <div key={opt}><label className="flex items-center gap-2"><input type="checkbox" value={opt} checked={(responses[q.id] || []).includes(opt)} onChange={e => {
                      const current = responses[q.id] || [];
                      const newResponses = e.target.checked ? [...current, opt] : current.filter((item: string) => item !== opt);
                      handleResponseChange(q.id, newResponses);
                  }} /> {opt}</label></div>)}
                </div>
              )}
            </div>
          ))}
          <button type="submit" disabled={submitMutation.isPending} className="w-full px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg shadow-sm hover:bg-gray-900 disabled:opacity-50">
            {submitMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </form>
      )}
    </div>
  );
}