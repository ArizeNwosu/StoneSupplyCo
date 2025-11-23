import React from 'react';
import PageLayout from './PageLayout';
import ForAdvertisers from '../ForAdvertisers';
import type { View } from '../../App';

interface AdvertisersPageProps {
  onNavigate: (view: View) => void;
}

const AdvertisersPage: React.FC<AdvertisersPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<>For <span className="font-serif italic">Advertisers</span></>}
      subtitle="Reach highly engaged AI users at the precise moment of intent with our powerful and ethical advertising platform."
    >
      <div className="-mt-16 sm:-mt-20">
        <ForAdvertisers onNavigate={onNavigate} />
      </div>
    </PageLayout>
  );
};

export default AdvertisersPage;