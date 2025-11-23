import React from 'react';
import { Sparkles, Ghost, Shield, TrendingUp } from 'lucide-react';

const innovations = [
  {
    icon: Ghost,
    title: 'The Ghost Ad Concept',
    description: 'An ad that exists in the user\'s creative space but vanishes without a trace upon engagement. It doesn\'t compete for attention—it yields it.',
    highlight: 'Patent-pending ephemeral ad technology',
  },
  {
    icon: Shield,
    title: 'Value-Aligned Framing',
    description: '"Compute cost supported by" transforms advertising from interruption to value-enabler. The sponsor subsidizes the AI query, creating symbiosis over adversity.',
    highlight: 'Ethical-first advertising model',
  },
  {
    icon: TrendingUp,
    title: 'Second-Price Auction',
    description: 'Advertisers bid, but only pay based on the second-highest bid. This ensures competitive market pricing and prevents overpaying.',
    highlight: 'Fair market-rate pricing guaranteed',
  },
  {
    icon: Sparkles,
    title: 'Technical Context Targeting',
    description: 'Target users based on the exact AI model and provider they\'re using. A GPU cloud provider can reach users at the moment they need compute.',
    highlight: 'Unique to the AI ecosystem',
  },
];

const Innovation: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Patent-Pending Innovation</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            What <span className="font-serif italic">Makes</span> SubClick Unique
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A fundamentally new approach to advertising that's designed for the generative AI era
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {innovations.map((innovation, index) => {
            const Icon = innovation.icon;
            return (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/10"
              >
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">
                      {innovation.title}
                    </h3>

                    <p className="text-gray-300 leading-relaxed mb-4">
                      {innovation.description}
                    </p>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-medium text-blue-300">
                        {innovation.highlight}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Innovation;