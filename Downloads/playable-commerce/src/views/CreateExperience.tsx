// src/views/CreateExperience.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeBrand } from '../services/geminiService';

const GOAL_OPTIONS = [
  { value: 'lead_capture', label: 'Capture email / SMS' },
  { value: 'conversion', label: 'Increase conversion' },
  { value: 'aov', label: 'Increase AOV' },
  { value: 'brand_awareness', label: 'Brand experience / launch' },
];

const REWARD_OPTIONS = [
  { value: 'percentage_off', label: 'Percentage discount' },
  { value: 'free_shipping', label: 'Free shipping' },
  { value: 'free_product', label: 'Free product' },
  { value: 'mystery', label: 'Mystery reward' },
];

export default function CreateExperience() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('lead_capture');
  const [reward, setReward] = useState('free_shipping');
  const [error, setError] = useState('');

  void analyzeBrand; // imported but called by AnalyzeStore (Task 10)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('Please enter a product or store URL'); return; }
    setError('');
    dispatch({ type: 'RESET_FLOW' });
    dispatch({ type: 'SET_ANALYZING', payload: true });
    navigate('/analyze', { state: { url: url.trim(), goal, reward } });
  };

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-8 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">Create an Experience</h1>
        <p className="text-neutral-500 max-w-md mx-auto leading-relaxed">
          Paste your product URL. Our AI will analyze what's inherently playable about it and generate brand-specific game concepts.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="w-full space-y-5">
        {/* URL input */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Product or store URL</label>
          <div className="relative flex items-center">
            <Link2 className="absolute left-4 w-4 h-4 text-neutral-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://cyberbackpack.com/products/cyberbackpack"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        {/* Goal selector */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Primary goal <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGoal(opt.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors border ${
                  goal === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reward selector */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Reward type <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REWARD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReward(opt.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors border ${
                  reward === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center px-6 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors text-sm tracking-wide"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze Brand
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </form>
    </div>
  );
}
