import React from 'react';
import PageLayout from './PageLayout';
import { IntegrationGuide } from '../PublisherDashboard'; // Reusing the component
import type { View } from '../../App';

interface IntegrationPageProps {
  onNavigate: (view: View) => void;
}

const IntegrationPage: React.FC<IntegrationPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Integration</span> Guide</>}
      subtitle="Add SubClick to your AI application in minutes with our lightweight SDK and simple implementation process."
    >
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 -mt-8">
        <IntegrationGuide />
      </div>
    </PageLayout>
  );
};

export default IntegrationPage;