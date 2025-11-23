import React from 'react';
import { Sparkles } from 'lucide-react';
import { WavyBackground } from './ui/wavy-background';

interface HeroProps {
  onGetStarted: () => void;
  onSeeDemo: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted, onSeeDemo }) => {
  return (
    <WavyBackground
      className="max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:py-40"
      containerClassName="h-auto"
      backgroundFill="#000000"
      colors={['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee']}
      waveOpacity={0.15}
      blur={5}
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-8">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">The Ad Network for Generative AI</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
          <span className="block text-gray-200">SubClick weaves ads into</span>
          <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent pb-2 font-serif italic">
            AI thinking, not output
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-300 mb-12 leading-relaxed">
          The first ephemeral ad unit that supplements AI compute costs without disrupting user experience or influencing AI responses
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={onGetStarted} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-500/50">
            Get Started for Free
          </button>
          <button onClick={onSeeDemo} className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold text-lg transition-all border border-white/20">
            See Demo
          </button>
        </div>
      </div>
    </WavyBackground>
  );
}

export default Hero;