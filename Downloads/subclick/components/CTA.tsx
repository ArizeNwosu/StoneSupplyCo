import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CTAProps {
    onGetStarted: () => void;
}

const CTA: React.FC<CTAProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

      <div className="max-w-4xl mx-auto text-center relative">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
          Ready to <span className="font-serif italic">redefine</span> AI advertising?
        </h2>

        <p className="text-xl sm:text-2xl text-blue-100 mb-12 leading-relaxed">
          Join the waitlist for early access to SubClick and be part of the future of ethical, transparent AI monetization.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={onGetStarted} className="group px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-2xl flex items-center gap-2">
            Get Started for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 bg-blue-700/50 hover:bg-blue-700/70 backdrop-blur-sm text-white rounded-lg font-semibold text-lg transition-all border border-white/20">
            Schedule a Demo
          </button>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-blue-100">No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-blue-100">5-minute integration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-blue-100">Patent-pending technology</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;