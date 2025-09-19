import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

// --- Types ---
interface ValidationRules { required?: boolean; }
type QuestionType = 'single-choice' | 'multi-choice'; // Simplified
interface Question { id: number; type: QuestionType; question: string; options?: string[]; validation?: ValidationRules; answerKey?: string | string[]; }

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

export function AssessmentBuilderPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<Question[]>([]);

  const { data: assessment, isLoading } = useQuery({ queryKey: ['assessment', jobId], queryFn: () => fetchAssessment(jobId!), enabled: !!jobId, });
  useEffect(() => {
    if (assessment?.questions?.length) { setQuestions(assessment.questions); }
    else { setQuestions([]); }
  }, [assessment]);
  
  const saveMutation = useMutation({
    mutationFn: saveAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', jobId] });
      alert('Assessment saved!');
    },
  });

  const updateQuestion = (index: number, updatedField: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updatedField };
    setQuestions(newQuestions);
  };
  const addQuestion = () => { setQuestions([...questions, { id: Date.now(), type: 'single-choice', question: '', options: ['New Option'], validation: { required: false } }]); };
  const removeQuestion = (index: number) => { setQuestions(questions.filter((_, i) => i !== index)); };
  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const options = newQuestions[qIndex].options || [];
    newQuestions[qIndex].options = [...options, 'New Option'];
    setQuestions(newQuestions);
  };
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
    newQuestions[qIndex].validation = { ...currentValidation, [rule]: !currentValidation[rule] };
    setQuestions(newQuestions);
  };
  const handleAnswerKeyChange = (qIndex: number, answer: string) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    if (question.type === 'single-choice') {
      question.answerKey = answer;
    } else if (question.type === 'multi-choice') {
      const currentAnswerKey = (question.answerKey as string[] || []);
      if (currentAnswerKey.includes(answer)) {
        question.answerKey = currentAnswerKey.filter(a => a !== answer);
      } else {
        question.answerKey = [...currentAnswerKey, answer];
      }
    }
    setQuestions(newQuestions);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Assessment Builder (MCQ Only)</h2>
          <Link to="/jobs" className="text-sm text-gray-500 hover:underline">&larr; Back to Jobs</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to={`/jobs/${jobId}/assessment/take`} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">Preview as Candidate</Link>
          <button onClick={() => saveMutation.mutate({ jobId: jobId!, questions })} disabled={saveMutation.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-gray-800 rounded-lg shadow-sm hover:bg-gray-900">{saveMutation.isPending ? 'Saving...' : 'Save Assessment'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold border-b pb-4 mb-4">Editor</h3>
          <div className="space-y-4">
            {isLoading ? <p>Loading...</p> : questions.map((q, qIndex) => (
              <div key={q.id} className="p-4 border rounded-md bg-gray-50/80 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Question {qIndex + 1}</label>
                  <button onClick={() => removeQuestion(qIndex)} className="p-1 text-red-500 rounded-md hover:bg-red-100 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
                <input type="text" value={q.question} onChange={(e) => updateQuestion(qIndex, { question: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Enter your question..."/>
                <select value={q.type} onChange={(e) => updateQuestion(qIndex, { type: e.target.value as QuestionType, answerKey: undefined })} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  <option value="single-choice">Single Choice</option>
                  <option value="multi-choice">Multi Choice</option>
                </select>
                <div className="pl-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Options (Select the correct answer)</p>
                  {q.options?.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input type={q.type === 'single-choice' ? 'radio' : 'checkbox'} name={`answer-key-${q.id}`} checked={q.type === 'single-choice' ? q.answerKey === opt : (q.answerKey as string[] || []).includes(opt)} onChange={() => handleAnswerKeyChange(qIndex, opt)} />
                      <input type="text" value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md" />
                      <button onClick={() => removeOption(qIndex, oIndex)} className="p-1 text-red-500 rounded-md hover:bg-red-100 hover:text-red-700"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qIndex)} className="text-sm font-semibold text-gray-600 hover:text-gray-900">+ Add option</button>
                </div>
                <div className="pt-3 border-t">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={!!q.validation?.required} onChange={() => toggleValidation(qIndex, 'required')} className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800" />
                    Required
                  </label>
                </div>
              </div>
            ))}
            <button onClick={addQuestion} className="w-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
              <Plus size={16} className="inline-block mr-2" /> Add Question
            </button>
          </div>
        </div>
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold border-b pb-4 mb-4">Live Preview</h3>
          <div className="space-y-6">
            {questions.length === 0 ? <p className="text-center text-gray-500 py-8">Your form preview will appear here.</p> : questions.map((q, index) => (
              <div key={q.id}>
                <label className="block font-medium text-gray-800">{index + 1}. {q.question || "..."}{q.validation?.required && <span className="text-red-500 ml-1">*</span>}</label>
                <div className="mt-2">
                  {q.type === 'single-choice' && <div className="space-y-2">{q.options?.map((opt, oIndex) => <div key={oIndex}><label className="flex items-center gap-2 font-normal"><input type="radio" name={`q_${q.id}`} disabled/> {opt}</label></div>)}</div>}
                  {q.type === 'multi-choice' && <div className="space-y-2">{q.options?.map((opt, oIndex) => <div key={oIndex}><label className="flex items-center gap-2 font-normal"><input type="checkbox" disabled/> {opt}</label></div>)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}