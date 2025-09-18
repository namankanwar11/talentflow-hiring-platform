import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

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
async function saveAssessment(variables: { jobId: string, questions: Question[] }) {
    const { jobId, questions } = variables;
    const res = await fetch(`/assessments/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
    });
    if (!res.ok) throw new Error('Failed to save assessment');
    return res.json();
}

// --- Main Page Component ---
export function AssessmentBuilderPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<Question[]>([]);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', jobId],
    queryFn: () => fetchAssessment(jobId!),
    enabled: !!jobId,
  });

  useEffect(() => {
    if (assessment?.questions?.length) {
      setQuestions(assessment.questions);
    } else {
      setQuestions([]); // Ensure questions are cleared if assessment is empty
    }
  }, [assessment]);
  
  const saveMutation = useMutation({
    mutationFn: saveAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', jobId] });
      alert('Assessment saved!');
    },
  });

  // --- Handler Functions ---
  const updateQuestion = (index: number, updatedField: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updatedField };
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), type: 'short-text', question: '', validation: { required: false } }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };
  
  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const options = newQuestions[qIndex].options || [];
    newQuestions[qIndex].options = [...options, 'New Option'];
    setQuestions(newQuestions);
  };
  
  // CORRECTED: This function no longer mutates state directly
  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(currentQuestions => 
      currentQuestions.map((q, i) => {
        if (i === qIndex) {
          const newOptions = [...(q.options || [])];
          newOptions[oIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options) {
      newQuestions[qIndex].options = newQuestions[qIndex].options!.filter((_, i) => i !== oIndex);
      setQuestions(newQuestions);
    }
  };

  const toggleValidation = (qIndex: number, rule: keyof ValidationRules) => {
    const newQuestions = [...questions];
    const currentValidation = newQuestions[qIndex].validation || {};
    newQuestions[qIndex].validation = {
      ...currentValidation,
      [rule]: !currentValidation[rule],
    };
    setQuestions(newQuestions);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Link to="/jobs" className="text-sm text-gray-600 hover:underline">&larr; Back to Jobs</Link>
        <div className="flex items-center gap-4">
          <Link to={`/jobs/${jobId}/assessment/take`} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border rounded-lg hover:bg-gray-100">
            Preview as Candidate
          </Link>
          <button onClick={() => saveMutation.mutate({ jobId: jobId!, questions })} disabled={saveMutation.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg shadow-sm hover:bg-gray-900">
            {saveMutation.isPending ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: The Builder */}
        <div className="space-y-4 p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold">Editor</h3>
          {isLoading && <p>Loading...</p>}
          {questions.map((q, qIndex) => (
            <div key={q.id} className="p-4 border rounded-md bg-gray-50 space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Question {qIndex + 1}</label>
                <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
              </div>
              <input type="text" value={q.question} onChange={(e) => updateQuestion(qIndex, { question: e.target.value })} className="w-full p-2 border rounded-md" placeholder="Enter your question..."/>
              <select value={q.type} onChange={(e) => updateQuestion(qIndex, { type: e.target.value as QuestionType, options: (e.target.value === 'single-choice' || e.target.value === 'multi-choice') ? ['New Option'] : undefined })} className="w-full p-2 border rounded-md bg-white">
                <option value="short-text">Short Text</option>
                <option value="long-text">Long Text</option>
                <option value="single-choice">Single Choice</option>
                <option value="multi-choice">Multi Choice</option>
                <option value="numeric">Numeric</option>
                <option value="file-upload">File Upload</option>
              </select>
              {(q.type === 'single-choice' || q.type === 'multi-choice') && (
                <div className="pl-4 space-y-2">
                  {q.options?.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input type="text" value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} className="w-full p-1 border rounded-md" />
                      <button onClick={() => removeOption(qIndex, oIndex)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qIndex)} className="text-sm text-gray-600 hover:text-gray-900">+ Add option</button>
                </div>
              )}
              <div className="pt-3 border-t">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={!!q.validation?.required} onChange={() => toggleValidation(qIndex, 'required')} />
                  Required
                </label>
              </div>
            </div>
          ))}
          <button onClick={addQuestion} className="w-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border rounded-lg hover:bg-gray-200">
            + Add Question
          </button>
        </div>

        {/* Right Side: The Live Preview */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
          {questions.map((q, index) => (
            <div key={q.id} className="p-4 border-t first:border-t-0">
              <label className="block font-medium text-gray-800">
                {index + 1}. {q.question || "..."}
                {q.validation?.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {q.type === 'short-text' && <input type="text" className="w-full p-2 mt-2 border rounded-md bg-gray-50" disabled />}
              {q.type === 'long-text' && <textarea className="w-full p-2 mt-2 border rounded-md bg-gray-50" rows={4} disabled></textarea>}
              {q.type === 'numeric' && <input type="number" className="w-full p-2 mt-2 border rounded-md bg-gray-50" disabled />}
              {q.type === 'file-upload' && <input type="file" className="w-full p-2 mt-2 border rounded-md bg-gray-100 text-sm" disabled />}
              {q.type === 'single-choice' && (
                <div className="mt-2 space-y-2">
                  {q.options?.map((opt, oIndex) => <div key={oIndex}><label className="flex items-center gap-2"><input type="radio" name={`q_${q.id}`} disabled/> {opt}</label></div>)}
                </div>
              )}
              {q.type === 'multi-choice' && (
                <div className="mt-2 space-y-2">
                  {q.options?.map((opt, oIndex) => <div key={oIndex}><label className="flex items-center gap-2"><input type="checkbox" disabled/> {opt}</label></div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}