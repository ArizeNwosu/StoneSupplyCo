import React from 'react';
import PageLayout from './PageLayout';
import { Download } from 'lucide-react';
import type { View } from '../../App';

interface PressKitPageProps {
  onNavigate: (view: View) => void;
}

const PressKitPage: React.FC<PressKitPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Press</span> Kit</>}
      subtitle="Everything you need to write about SubClick. For all media inquiries, please contact press@subclick.com."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Logos</h2>
          <div className="flex items-center gap-8 p-6 border rounded-lg">
            <img src="/images/subclick-logo.png" alt="SubClick Logo" className="h-12" />
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4" />
              Download Logos (.zip)
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Us</h2>
          <div className="prose">
            <p>SubClick is the first ephemeral "ghost" ad network for generative AI. Our mission is to create a sustainable and ethical monetization model for the AI ecosystem. Our patent-pending ad unit sponsors AI compute costs without disrupting user experience or influencing AI responses.</p>
          </div>
        </div>
        <div className="md:col-span-2">
           <h2 className="text-2xl font-bold text-gray-900 mb-4">Press Releases</h2>
           <div className="space-y-4">
            <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500">July 15, 2025</p>
                <h3 className="font-semibold text-blue-600">SubClick Launches to Redefine AI Advertising with Ephemeral "Ghost" Ad Unit</h3>
            </div>
            <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500">June 1, 2025</p>
                <h3 className="font-semibold text-blue-600">SubClick Raises $5M Seed Round to Build Ethical Ad Network for Generative AI</h3>
            </div>
           </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PressKitPage;