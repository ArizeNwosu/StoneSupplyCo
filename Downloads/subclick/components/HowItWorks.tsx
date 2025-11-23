import React from 'react';
import { Eye, MousePointer, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Eye,
    title: 'Ephemeral Presence',
    description: 'The ghost ad appears subtly in the empty prompt field as "Supported by [Brand]"—visible only when the user isn\'t typing.',
  },
  {
    icon: MousePointer,
    title: 'User-Controlled Reveal',
    description: 'Hovering reveals the full ad creative. No forced interruptions. The user chooses to engage, and we track impressions, views, and clicks separately.',
  },
  {
    icon: CheckCircle,
    title: 'Instant Disappearance',
    description: 'The moment users start typing, the ad vanishes completely, ceding the entire space to their thoughts and creativity.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How SubClick <span className="font-serif italic">Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A novel ad experience that respects user focus while transparently funding AI compute
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative group"
              >
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg h-full">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                    <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                  </div>

                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-sm font-bold text-blue-600">STEP {index + 1}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;