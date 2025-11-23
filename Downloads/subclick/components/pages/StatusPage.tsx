import React from 'react';
import PageLayout from './PageLayout';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { View } from '../../App';

interface StatusPageProps {
  onNavigate: (view: View) => void;
}

const services = [
    { name: 'Ad Delivery API', status: 'Operational', isUp: true },
    { name: 'Reporting & Analytics', status: 'Operational', isUp: true },
    { name: 'Publisher Dashboard', status: 'Operational', isUp: true },
    { name: 'Advertiser Platform', status: 'Operational', isUp: true },
    { name: 'Client-side SDK', status: 'Partially Degraded', isUp: false },
]

const StatusPage: React.FC<StatusPageProps> = ({ onNavigate }) => {
  const allSystemsOperational = services.every(s => s.isUp);

  return (
    <PageLayout
      onNavigate={onNavigate}
      title="System Status"
      subtitle="Real-time status of all SubClick services."
    >
      <div className="max-w-4xl mx-auto">
        <div className={`p-6 rounded-lg mb-12 ${allSystemsOperational ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <div className="flex items-center gap-4">
            {allSystemsOperational ? 
              <CheckCircle className="w-8 h-8 text-green-600" /> :
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            }
            <h2 className={`text-2xl font-bold ${allSystemsOperational ? 'text-green-800' : 'text-yellow-800'}`}>
              {allSystemsOperational ? 'All Systems Operational' : 'Some Systems Experiencing Issues'}
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {services.map(service => (
            <div key={service.name} className="flex justify-between items-center p-6 bg-gray-50 rounded-lg border">
              <p className="text-lg font-semibold text-gray-800">{service.name}</p>
              <div className="flex items-center gap-2">
                {service.isUp ? 
                  <CheckCircle className="w-5 h-5 text-green-500" /> :
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                }
                <span className={`font-semibold ${service.isUp ? 'text-green-600' : 'text-yellow-600'}`}>{service.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default StatusPage;