import React from 'react';
import PageLayout from './PageLayout';
import ForPublishers from '../ForPublishers';
import type { View } from '../../App';

interface PublishersPageProps {
  onNavigate: (view: View) => void;
}

const PublishersPage: React.FC<PublishersPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<>For <span className="font-serif italic">Publishers</span></>}
      subtitle="Monetize your AI tool without disrupting your users. Turn expensive compute costs into a new revenue stream."
    >
      <div className="-mt-16 sm:-mt-20">
        <ForPublishers onNavigate={onNavigate} />
      </div>
    </PageLayout>
  );
};

export default PublishersPage;