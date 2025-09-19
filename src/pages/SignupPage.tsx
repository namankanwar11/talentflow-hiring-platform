import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signup(email, password);
    if (success) {
      alert('Signup successful! Please log in.');
      navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Briefcase className="h-8 w-8 text-gray-800" />
            <h1 className="text-3xl font-bold text-gray-800">TalentFlow</h1>
          </div>
          <h2 className="text-xl text-gray-600">Create your Account</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full p-3 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-gray-800 focus:border-gray-800" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required className="w-full p-3 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-gray-800 focus:border-gray-800" />
          </div>
          <button type="submit" className="w-full py-3 text-white font-semibold bg-gray-800 rounded-md hover:bg-gray-900 transition-colors">Create Account</button>
        </form>
        <p className="text-sm text-center text-gray-500">Already have an account? <Link to="/login" className="font-medium text-gray-800 hover:underline">Log in</Link></p>
      </div>
    </div>
  );
}