import React from 'react';
import PageLayout from './PageLayout';
import { Book, Code, LifeBuoy, Users } from 'lucide-react';
import type { View } from '../../App';

interface DeveloperDocsPageProps {
  onNavigate: (view: View) => void;
}

const resources = [
  {
    icon: Code,
    title: 'Integration Guide',
    description: 'Start here. Get SubClick running in your app in under 5 minutes.',
    view: 'integration' as View,
  },
  {
    icon: Book,
    title: 'API Reference',
    description: 'Complete reference for our client-side SDK and all available parameters.',
    view: 'api-reference' as View,
  },
   {
    icon: LifeBuoy,
    title: 'System Status',
    description: 'Check the real-time status of our ad delivery and reporting services.',
    view: 'status' as View,
  },
  {
    icon: Users,
    title: 'Community Forum',
    description: 'Connect with other developers and our engineering team.',
    view: 'help-center' as View, // Re-using help center for this mock
  },
];

const DeveloperDocsPage: React.FC<DeveloperDocsPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Developer</span> Docs</>}
      subtitle="All the resources you need to build with SubClick."
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

export default DeveloperDocsPage;