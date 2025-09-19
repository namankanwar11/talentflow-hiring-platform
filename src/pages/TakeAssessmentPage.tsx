import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// --- Types ---
interface ValidationRules { required?: boolean; }
type QuestionType = 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';
interface Question { id: number; type: QuestionType; question: string; options?: string[]; validation?: ValidationRules; answerKey?: string | string[]; }

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
  const [score, setScore] = useState<{ correct: number, total: number } | null>(null);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', jobId],
    queryFn: () => fetchAssessment(jobId!),
    enabled: !!jobId,
  });
  
  const submitMutation = useMutation({
    mutationFn: submitAssessment,
    onSuccess: () => {
      calculateScore();
    },
    onError: (err) => { alert(`Submission failed: ${err.message}`); }
  });

  const calculateScore = () => {
    let correctAnswers = 0;
    const questions = assessment?.questions || [];
    const scorableQuestions = questions.filter(q => (q.type === 'single-choice' || q.type === 'multi-choice') && q.answerKey);

    scorableQuestions.forEach(q => {
      const userResponse = responses[q.id];
      const answerKey = q.answerKey;
      if (!userResponse) return;

      if (q.type === 'single-choice' && userResponse === answerKey) {
        correctAnswers++;
      } else if (q.type === 'multi-choice') {
        const key = (answerKey as string[]).sort();
        const res = (userResponse as string[]).sort();
        if (JSON.stringify(key) === JSON.stringify(res)) {
          correctAnswers++;
        }
      }
    });
    setScore({ correct: correctAnswers, total: scorableQuestions.length });
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

  const handleResponseChange = (questionId: number, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Assessment</h2>
        <p className="text-lg text-gray-600 mt-1">Please answer the following questions.</p>
        <Link to={`/jobs/${jobId}/assessment`} className="text-sm text-gray-500 hover:underline mt-4 inline-block">&larr; Back to Builder</Link>
      </div>

      {isLoading ? <p className="text-center">Loading assessment...</p> : !score ? (
        <form onSubmit={handleSubmit} className="space-y-8 p-8 bg-white border rounded-lg shadow-sm">
          {assessment?.questions.map((q, index) => (
            <div key={q.id}>
              <label className="block text-lg font-semibold text-gray-800">
                {index + 1}. {q.question}
                {q.validation?.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="mt-3">
                {q.type === 'short-text' && <input type="text" onChange={e => handleResponseChange(q.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />}
                {q.type === 'long-text' && <textarea onChange={e => handleResponseChange(q.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" rows={4}></textarea>}
                {q.type === 'numeric' && <input type="number" onChange={e => handleResponseChange(q.id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />}
                {q.type === 'file-upload' && <input type="file" onChange={e => handleResponseChange(q.id, e.target.files ? e.target.files[0].name : null)} className="w-full p-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200" />}
                {q.type === 'single-choice' && <div className="space-y-2">{q.options?.map((opt) => <div key={opt}><label className="flex items-center gap-2 p-3 border rounded-md hover:bg-gray-50"><input type="radio" name={`q_${q.id}`} value={opt} checked={responses[q.id] === opt} onChange={e => handleResponseChange(q.id, e.target.value)} className="h-4 w-4 text-gray-800 focus:ring-gray-800" /> {opt}</label></div>)}</div>}
                {q.type === 'multi-choice' && <div className="space-y-2">{q.options?.map((opt) => <div key={opt}><label className="flex items-center gap-2 p-3 border rounded-md hover:bg-gray-50"><input type="checkbox" value={opt} checked={(responses[q.id] || []).includes(opt)} onChange={e => {
                      const current = responses[q.id] || [];
                      const newResponses = e.target.checked ? [...current, opt] : current.filter((item: string) => item !== opt);
                      handleResponseChange(q.id, newResponses);
                  }} className="h-4 w-4 rounded text-gray-800 focus:ring-gray-800" /> {opt}</label></div>)}</div>}
              </div>
            </div>
          ))}
          <button type="submit" disabled={submitMutation.isPending} className="w-full px-4 py-3 text-base font-semibold text-white bg-gray-800 rounded-lg shadow-sm hover:bg-gray-900 disabled:opacity-50">
            {submitMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </form>
      ) : (
        <div className="text-center p-8 bg-white border rounded-lg shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
          <p className="text-lg text-gray-600 mt-2">Your assessment has been submitted.</p>
          <div className="mt-6">
            <p className="text-xl font-medium text-gray-700">Your Score:</p>
            <p className="text-5xl font-bold text-gray-900 mt-2">
              {score.correct} / {score.total}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}