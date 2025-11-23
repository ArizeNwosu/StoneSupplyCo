import React from 'react';
import PageLayout from './PageLayout';
import { Book, Code, LifeBuoy, Users } from 'lucide-react';
import type { View } from '../../App';

interface DocumentationPageProps {
  onNavigate: (view: View) => void;
}

const resources = [
  {
    icon: Code,
    title: 'Integration Guide',
    description: 'Step-by-step instructions to get SubClick running in your app.',
    view: 'integration' as View,
  },
  {
    icon: Book,
    title: 'API Reference',
    description: 'Detailed documentation for our client-side SDK and server-side APIs.',
    view: 'api-reference' as View,
  },
  {
    icon: Users,
    title: 'Case Studies',
    description: 'See how other publishers have succeeded with SubClick.',
    view: 'case-studies' as View,
  },
  {
    icon: LifeBuoy,
    title: 'Help Center',
    description: 'Find answers to common questions and troubleshooting tips.',
    view: 'help-center' as View,
  },
];

const DocumentationPage: React.FC<DocumentationPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Documentation</span> Hub</>}
      subtitle="Explore our guides, API references, and resources to get the most out of SubClick."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <button
              key={resource.title}
              onClick={() => onNavigate(resource.view)}
              className="group bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{resource.title}</h3>
              <p className="text-gray-600 leading-relaxed">{resource.description}</p>
            </button>
          );
        })}
      </div>
    </PageLayout>
  );
};

export default DocumentationPage;