import React from 'react';
import PageLayout from './PageLayout';
import { Search } from 'lucide-react';
import type { View } from '../../App';

interface HelpCenterPageProps {
  onNavigate: (view: View) => void;
}

const faqCategories = {
  'For Publishers': [
    'How do I integrate the SubClick SDK?',
    'What are the requirements to become a publisher?',
    'How and when do I get paid?',
  ],
  'For Advertisers': [
    'What is semantic targeting?',
    'How does the second-price auction work?',
    'Can I target specific AI models?',
  ],
  'Account & Billing': [
    'How do I change my payment method?',
    'Where can I find my invoices?',
  ],
};

const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Help</span> Center</>}
      subtitle="Find answers to your questions about SubClick."
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search for answers..."
            className="w-full pl-12 pr-4 py-4 border rounded-lg text-lg"
          />
        </div>

        <div className="space-y-12">
          {Object.entries(faqCategories).map(([category, questions]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
              <ul className="space-y-4">
                {questions.map((q) => (
                  <li key={q}>
                    <a href="#" className="text-blue-600 hover:underline text-lg">{q}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpCenterPage;