import React from 'react';
import PageLayout from './PageLayout';
import Features from '../Features';
import type { View } from '../../App';

interface FeaturesPageProps {
  onNavigate: (view: View) => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Features</span> that Define the Future</>}
      subtitle="Advanced targeting, transparent tracking, and ethical design principles that set a new standard for AI advertising."
    >
      <div className="-mt-16 sm:-mt-20">
        <Features />
      </div>
    </PageLayout>
  );
};

export default FeaturesPage;