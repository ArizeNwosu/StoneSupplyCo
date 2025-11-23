import React from 'react';
import PageLayout from './PageLayout';
import type { View } from '../../App';

interface CaseStudiesPageProps {
  onNavigate: (view: View) => void;
}

const studies = [
    {
        company: 'AI-Chat.io',
        title: 'How AI-Chat.io Cut Compute Costs by 70% with SubClick',
        imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=800',
        stats: [
            { value: '70%', label: 'Compute Cost Reduction' },
            { value: '+15%', label: 'User Session Length' },
            { value: '0%', label: 'Impact on Conversion' },
        ],
    },
    {
        company: 'CodeGenius',
        title: 'CodeGenius Monetizes their Free Tier without Disrupting Developer Workflow',
        imageUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800',
        stats: [
            { value: '$25k', label: 'New Monthly Revenue' },
            { value: '98%', label: 'Positive User Feedback' },
            { value: '+200%', label: 'Free-to-Paid Upgrades' },
        ],
    }
]

const CaseStudiesPage: React.FC<CaseStudiesPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Case</span> Studies</>}
      subtitle="See how leading AI platforms are using SubClick to create new revenue streams and improve their bottom line."
    >
      <div className="space-y-20">
        {studies.map((study) => (
            <div key={study.company} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <img src={study.imageUrl} alt={study.company} className="rounded-lg shadow-xl" />
                <div>
                    <p className="font-semibold text-blue-600 mb-2">{study.company}</p>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">{study.title}</h2>
                    <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                        {study.stats.map(stat => (
                            <div key={stat.label}>
                                <p className="text-4xl font-bold text-blue-600">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                    <button className="px-6 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200">Read Full Story</button>
                </div>
            </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default CaseStudiesPage;