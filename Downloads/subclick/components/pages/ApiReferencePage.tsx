import React from 'react';
import PageLayout from './PageLayout';
import { IntegrationGuide } from '../PublisherDashboard'; // This component contains the API table
import type { View } from '../../App';

interface ApiReferencePageProps {
  onNavigate: (view: View) => void;
}

const ApiReferencePage: React.FC<ApiReferencePageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">API</span> Reference</>}
      subtitle="Detailed documentation for our client-side SDK and parameters."
    >
      {/* We are re-using a part of the IntegrationGuide that has the API table */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 -mt-8">
        <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">API Reference: `fetchSponsor(options)`</h3>
            <div className="overflow-x-auto text-sm">
                <table className="w-full border">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3 font-semibold">Parameter</th>
                            <th className="p-3 font-semibold">Required?</th>
                            <th className="p-3 font-semibold">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t">
                            <td className="p-3 font-mono">publisherId</td>
                            <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Required</span></td>
                            <td className="p-3">Your unique Publisher ID, found in "My Properties".</td>
                        </tr>
                        <tr className="border-t">
                            <td className="p-3 font-mono">containerId</td>
                            <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Required</span></td>
                            <td className="p-3">The `id` of the HTML element where the ad should be rendered.</td>
                        </tr>
                        <tr className="border-t">
                            <td className="p-3 font-mono">prompt</td>
                            <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Required</span></td>
                            <td className="p-3">The current, real-time text content from the user's prompt.</td>
                        </tr>
                        <tr className="border-t">
                            <td className="p-3 font-mono">context</td>
                            <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Recommended</span></td>
                            <td className="p-3">Object with `llmProvider` & `llmModel`. This enables advanced targeting and increases potential earnings.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default ApiReferencePage;