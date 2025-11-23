import React from 'react';
import PageLayout from './PageLayout';
import type { View } from '../../App';

interface ContactPageProps {
  onNavigate: (view: View) => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">Contact</span> Us</>}
      subtitle="We'd love to hear from you. Whether you're a publisher, advertiser, or just have a question, here's how to reach us."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="name" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" id="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <textarea id="message" rows={5} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
          <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Send Message</button>
        </form>
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-900">General Inquiries</h3>
                <p className="text-gray-600">contact@subclick.com</p>
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900">Sales & Partnerships</h3>
                <p className="text-gray-600">sales@subclick.com</p>
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900">Press</h3>
                <p className="text-gray-600">press@subclick.com</p>
            </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900">Address</h3>
                <p className="text-gray-600">123 Innovation Drive<br/>San Francisco, CA 94105</p>
            </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactPage;