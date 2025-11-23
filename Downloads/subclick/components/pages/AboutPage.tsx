import React from 'react';
import PageLayout from './PageLayout';
import type { View } from '../../App';

interface AboutPageProps {
  onNavigate: (view: View) => void;
}

const teamMembers = [
  { name: 'Alex Johnson', role: 'Founder & CEO', imageUrl: 'https://i.pravatar.cc/150?img=68' },
  { name: 'Maria Garcia', role: 'Head of Product', imageUrl: 'https://i.pravatar.cc/150?img=49' },
  { name: 'Chen Wei', role: 'Lead Engineer', imageUrl: 'https://i.pravatar.cc/150?img=32' },
  { name: 'Samira Khan', role: 'Head of Partnerships', imageUrl: 'https://i.pravatar.cc/150?img=31' },
];

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<><span className="font-serif italic">About</span> SubClick</>}
      subtitle="We're on a mission to create a sustainable and ethical monetization model for the generative AI ecosystem."
    >
      <div className="prose prose-lg max-w-4xl mx-auto">
        <h2>Our Mission</h2>
        <p>
          The rise of generative AI has created incredible new tools, but it has also introduced a significant challenge: the immense cost of computation. Our mission at SubClick is to solve this problem by connecting AI platforms with advertisers in a way that is non-disruptive, transparent, and beneficial for everyone. We believe that advertising can be a force for good, enabling access to powerful AI tools by sponsoring the underlying costs without compromising user experience or ethical integrity.
        </p>
        
        <h2>Our Values</h2>
        <ul>
          <li><strong>Transparency First:</strong> We are committed to absolute clarity. Users, publishers, and advertisers will always understand the value exchange.</li>
          <li><strong>User Experience is Sacred:</strong> We will never compromise the user's workflow. Our ad units are designed to be respectful of the user's focus and creativity.</li>
          <li><strong>Ethical Innovation:</strong> We are pioneering new ad technologies that are built for the AI era, with a deep commitment to ethical design principles.</li>
        </ul>

        <h2 className="text-center mt-20">Meet the Team</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 max-w-5xl mx-auto">
        {teamMembers.map((member) => (
          <div key={member.name} className="text-center">
            <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 shadow-lg" />
            <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
            <p className="text-gray-600">{member.role}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default AboutPage;