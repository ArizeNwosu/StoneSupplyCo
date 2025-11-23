import React, { useState, useMemo } from 'react';
import { Coins, Gauge, Users, Shield } from 'lucide-react';
import type { View } from '../App';

interface ForPublishersProps {
    onNavigate: (view: View) => void;
}

const benefits = [
  {
    icon: Coins,
    title: 'Monetize AI Compute',
    description: 'Turn expensive inference costs into revenue. Advertisers sponsor the compute while you maintain 100% control of your user experience.',
  },
  {
    icon: Gauge,
    title: 'Simple Integration',
    description: 'Add SubClick with a few lines of code. Our lightweight SDK works with any AI interface and requires minimal engineering resources.',
  },
  {
    icon: Users,
    title: 'Protect User Trust',
    description: 'The ghost ad design and transparent disclosure maintain user satisfaction. No disruptive popups or content manipulation.',
  },
  {
    icon: Shield,
    title: 'Full Control',
    description: 'Set minimum CPMs, block specific advertisers, and customize the ad appearance to match your brand. You\'re always in control.',
  },
];

const ForPublishers: React.FC<ForPublishersProps> = ({ onNavigate }) => {
  const [mau, setMau] = useState(250000);
  const [queriesPerUser, setQueriesPerUser] = useState(75);
  const [cpm, setCpm] = useState(8);
  const AD_FILL_RATE = 0.5; // 50%
  const MAX_AD_FREQUENCY = 3; // Cap ads to 1 every 3 queries on average

  const estimatedRevenue = useMemo(() => {
    const eligibleQueries = mau * (queriesPerUser / MAX_AD_FREQUENCY);
    const adImpressions = eligibleQueries * AD_FILL_RATE;
    const revenue = (adImpressions / 1000) * cpm;
    return revenue;
  }, [mau, queriesPerUser, cpm]);

  // Formatter functions for display
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  const formatCurrency = (num: number, decimals = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);

  return (
    <section id="publishers" className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-12 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

              <div className="relative">
                <h3 className="text-3xl font-bold mb-6">Revenue Calculator</h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-300">Monthly Active Users</label>
                        <span className="text-2xl font-bold">{formatNumber(mau)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1000" 
                      max="1000000" 
                      step="1000" 
                      value={mau} 
                      onChange={(e) => setMau(Number(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      aria-label="Monthly Active Users"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-300">Avg Queries per User</label>
                        <span className="text-2xl font-bold">{queriesPerUser}</span>
                    </div>
                     <input 
                      type="range" 
                      min="10" 
                      max="200" 
                      step="1" 
                      value={queriesPerUser} 
                      onChange={(e) => setQueriesPerUser(Number(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      aria-label="Average Queries per User"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-300">Estimated CPM</label>
                        <span className="text-2xl font-bold">{formatCurrency(cpm, 2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="70" 
                      step="0.25" 
                      value={cpm} 
                      onChange={(e) => setCpm(Number(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      aria-label="Estimated CPM"
                    />
                  </div>

                  <div className="pt-6 border-t border-white/20">
                    <div className="flex justify-between items-start flex-wrap">
                      <div className="text-sm text-gray-300 mb-2">Estimated Monthly Revenue</div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 italic">Based on a 50% Ad Fill Rate</div>
                        <div className="text-xs text-gray-400 italic">Assuming Max Ad Frequency of 3</div>
                      </div>
                    </div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {formatCurrency(estimatedRevenue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-600 text-sm font-semibold mb-6">
              FOR PUBLISHERS
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              <span className="font-serif italic">Monetize</span> without disrupting your users
            </h2>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              SubClick helps AI platforms and tools offset compute costs through ethical, transparent advertising that users actually appreciate.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-lg">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => onNavigate('sign-in')} className="mt-8 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/30">
              Become a Publisher
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForPublishers;