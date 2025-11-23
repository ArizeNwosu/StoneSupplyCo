import React from 'react';
import { Target, Brain, BarChart3, Lock, Zap, Users } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'AI-Native Targeting',
    description: 'Target by specific LLM providers (OpenAI, Google, Anthropic), models (GPT-4, Claude, Gemini), and semantic keyword matching that understands intent.',
  },
  {
    icon: Brain,
    title: 'Semantic Match Technology',
    description: 'Go beyond exact keywords. Our semantic engine matches conceptually related queries—target "fitness" and reach users asking about "cardio" or "endurance".',
  },
  {
    icon: BarChart3,
    title: 'Multi-Event Tracking',
    description: 'Track impressions, views (hover reveals), and clicks separately. Get granular insights into user engagement at every stage of the ad interaction.',
  },
  {
    icon: Lock,
    title: 'Ethical Transparency',
    description: 'Our disclosure system ensures users always know ads support compute costs—not AI output. Build trust with complete transparency about the sponsorship model.',
  },
  {
    icon: Zap,
    title: 'Real-Time Bidding',
    description: 'Second-price auction system ensures competitive pricing. Set CPM or CPC bids and only pay what the market demands, never your maximum.',
  },
  {
    icon: Users,
    title: 'Non-Disruptive UX',
    description: 'The ghost ad vanishes the instant users engage. Zero interruption to workflow means higher user satisfaction and better brand perception.',
  },
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            <span className="font-serif italic">Built</span> for the AI Era
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced targeting, transparent tracking, and ethical design principles that set a new standard for AI advertising
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;