import React from 'react';
import PageLayout from './PageLayout';
import type { View } from '../../App';

interface CareersPageProps {
  onNavigate: (view: View) => void;
}

const jobOpenings = {
  'Engineering': [
    { title: 'Senior Frontend Engineer (React)', location: 'Remote' },
    { title: 'Backend Engineer (Go, gRPC)', location: 'Remote' },
    { title: 'Machine Learning Engineer (Ad Tech)', location: 'New York, NY' },
  ],
  'Product': [
    { title: 'Product Manager, Publisher Experience', location: 'Remote' },
  ],
  'Sales & Partnerships': [
    { title: 'Partner Manager, AI Platforms', location: 'San Francisco, CA' },
    { title: 'Sales Development Representative', location: 'Remote' },
  ],
};

const CareersPage: React.FC<CareersPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Careers</span> at SubClick</>}
      subtitle="Join us in building the future of AI monetization. We're a small, ambitious team looking for talented people to help us achieve our mission."
    >
      <div className="max-w-4xl mx-auto">
        {Object.entries(jobOpenings).map(([department, jobs]) => (
          <div key={department} className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">{department}</h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.title} className="flex justify-between items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-gray-500">{job.location}</p>
                  </div>
                  <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Apply</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default CareersPage;