import React from 'react';
import PageLayout from './PageLayout';
import { Check } from 'lucide-react';
import type { View } from '../../App';

interface PricingPageProps {
  onNavigate: (view: View) => void;
}

const pricingTiers = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For individuals and small projects getting started with AI monetization.',
    features: [
      'Up to 1,000,000 impressions/mo',
      'Standard ad formats',
      'Basic analytics',
      'Community support',
    ],
    buttonText: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$99',
    priceSuffix: '/mo',
    description: 'For growing businesses that need advanced features and analytics.',
    features: [
      'Up to 10,000,000 impressions/mo',
      'All standard & advanced formats',
      'Detailed analytics & reporting',
      'Semantic targeting',
      'Email & chat support',
    ],
    buttonText: 'Start Pro Trial',
    isPopular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large-scale applications with custom needs and dedicated support.',
    features: [
      'Unlimited impressions',
      'Custom ad format development',
      'Advanced API access',
      'Dedicated account manager',
      'SLA & premium support',
    ],
    buttonText: 'Contact Sales',
  },
];

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Pricing</span> that Scales</>}
      subtitle="Simple, transparent pricing that scales with you. Start for free and upgrade as you grow."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={`border rounded-xl p-8 flex flex-col ${tier.isPopular ? 'border-blue-500 shadow-2xl scale-105' : 'border-gray-200'}`}
          >
            {tier.isPopular && (
              <div className="text-center mb-4">
                <span className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">Most Popular</span>
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-900 text-center">{tier.name}</h3>
            <div className="mt-4 text-center">
              <span className="text-5xl font-extrabold text-gray-900">{tier.price}</span>
              {tier.priceSuffix && <span className="text-xl font-medium text-gray-500">{tier.priceSuffix}</span>}
            </div>
            <p className="mt-4 text-gray-600 text-center h-16">{tier.description}</p>
            <ul className="mt-8 space-y-4 flex-grow">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <Check className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full mt-8 py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
                tier.isPopular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default PricingPage;