import React from 'react';
import Navigation from '../Navigation';
import Footer from '../Footer';
import type { View } from '../../App';

interface PageLayoutProps {
  onNavigate: (view: View) => void;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ onNavigate, title, subtitle, children }) => {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* FIX: Added the onSeeDemo prop to the Navigation component to satisfy its required props. */}
      <Navigation onNavigate={onNavigate} onGetStarted={() => onNavigate('demo')} onSeeDemo={() => onNavigate('demo')} onBack={() => onNavigate('publisher')} />
      <main className="flex-grow">
        <header className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">{title}</h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
          </div>
        </header>
        <div className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-6">
            {children}
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PageLayout;