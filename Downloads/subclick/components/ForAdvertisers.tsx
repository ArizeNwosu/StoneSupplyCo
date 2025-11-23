import React from 'react';
import { DollarSign, Target, TrendingUp, Clock } from 'lucide-react';
import type { View } from '../App';

interface ForAdvertisersProps {
    onNavigate: (view: View) => void;
}

const benefits = [
  {
    icon: DollarSign,
    stat: 'CPM or CPC',
    label: 'Flexible Bidding',
    description: 'Choose your pricing model and set daily budgets that work for your campaign',
  },
  {
    icon: Target,
    stat: '4 Match Types',
    label: 'Advanced Targeting',
    description: 'Broad, Phrase, Exact, and Semantic keyword matching for precision reach',
  },
  {
    icon: TrendingUp,
    stat: '3 Event Types',
    label: 'Granular Analytics',
    description: 'Track impressions, views, and clicks separately for deeper insights',
  },
  {
    icon: Clock,
    stat: 'Real-Time',
    label: 'Auction System',
    description: 'Second-price bidding ensures you pay fair market rates, not maximums',
  },
];

const ForAdvertisers: React.FC<ForAdvertisersProps> = ({ onNavigate }) => {
  return (
    <section id="advertisers" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold mb-6">
              FOR ADVERTISERS
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              <span className="font-serif italic">Reach</span> users at the moment of intent
            </h2>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              SubClick connects you with highly engaged AI users when they're actively seeking solutions. Target by keywords, AI models, providers, and even time of day.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Target specific AI models:</span>
                  <span className="text-gray-600"> Reach ChatGPT, Claude, or Gemini users exclusively</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Semantic understanding:</span>
                  <span className="text-gray-600"> Match intent, not just exact keywords</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Zero influence on output:</span>
                  <span className="text-gray-600"> Ethical transparency builds brand trust</span>
                </div>
              </li>
            </ul>

            <button onClick={() => onNavigate('sign-in')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/30">
              Start Advertising
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {benefit.stat}
                  </div>
                  <div className="text-sm font-semibold text-blue-600 mb-2">
                    {benefit.label}
                  </div>
                  <p className="text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForAdvertisers;