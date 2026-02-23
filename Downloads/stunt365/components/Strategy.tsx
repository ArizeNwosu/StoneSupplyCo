
import React from 'react';

const SlideHeader = ({ number, title }: { number: string; title: string }) => (
  <div className="flex items-center space-x-6 mb-12">
    <div className="h-[2px] w-12 bg-[#C5A059]"></div>
    <span className="text-5xl oswald font-black text-[#C5A059]/20">{number}</span>
    <h2 className="text-5xl oswald font-black uppercase tracking-tighter taurus-text-gold">{title}</h2>
  </div>
);

const Strategy: React.FC = () => {
  return (
    <div className="p-16 max-w-6xl mx-auto space-y-40 animate-fadeIn pb-40">
      {/* SLIDE 1: THE CORE STRATEGY */}
      <section className="min-h-[80vh] flex flex-col justify-center border-b border-zinc-900 pb-20">
        <SlideHeader number="01" title="The Core Strategy" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <h3 className="text-7xl oswald font-black uppercase leading-[0.85] text-white">“364 Days of <br/> Stunts”</h3>
            <p className="text-2xl text-zinc-400 font-light leading-relaxed">A year-long, daily tribute to the world's most elite performers.</p>
            <div className="taurus-gradient p-1 rounded-none inline-block">
              <div className="bg-black px-10 py-8">
                <p className="font-black oswald text-3xl uppercase taurus-text-gold tracking-tight italic">The Rolling Hype Machine</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-3">Countdown to the Taurus World Stunt Awards 2027</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-[#C5A059]/20 p-16 rounded-none cinematic-glow relative">
             <div className="absolute top-0 right-0 p-10 opacity-5">
                <i className="fa-solid fa-trophy text-[12rem] text-[#C5A059]"></i>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A059] mb-8">Strategic Mandate</p>
             <p className="text-2xl oswald font-bold text-zinc-100 italic leading-relaxed relative z-10">
               "We leverage the archive to maintain daily relevance, building a prestigious ecosystem for the entire stunt community."
             </p>
          </div>
        </div>
      </section>

      {/* SLIDE 2: PLATFORM STRATEGY */}
      <section className="min-h-[70vh] flex flex-col justify-center border-b border-zinc-900 pb-20">
        <SlideHeader number="02" title="Platform Strategy" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-[#0F0F0F] p-10 border border-zinc-800 group hover:border-[#C5A059]/40 transition duration-500">
            <h4 className="text-3xl oswald font-black mb-8 flex items-center gap-4 taurus-text-gold italic uppercase">
               Instagram
            </h4>
            <ul className="space-y-6 text-sm text-zinc-400 uppercase tracking-widest font-bold">
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-[#C5A059]"></div> Reels: Cinematic Growth</li>
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-[#C5A059]"></div> Carousels: Stunt Anatomy</li>
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-[#C5A059]"></div> Stories: Daily Trivia</li>
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-[#C5A059]"></div> Stickers: Countdown Habits</li>
            </ul>
            <div className="mt-12 pt-8 border-t border-zinc-900">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A059]">TONE GUIDE</span>
               <p className="text-white oswald font-black text-2xl mt-2 italic">Reverent. Elite. Intense.</p>
            </div>
          </div>
          <div className="bg-[#0F0F0F] p-10 border border-zinc-800 group hover:border-emerald-900/40 transition duration-500">
            <h4 className="text-3xl oswald font-black mb-8 flex items-center gap-4 text-emerald-500 italic uppercase">
               TikTok
            </h4>
            <ul className="space-y-6 text-sm text-zinc-400 uppercase tracking-widest font-bold">
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-emerald-500"></div> Raw Adrenaline: Native Hooks</li>
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-emerald-500"></div> Fast Edits: FYP Optimization</li>
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-emerald-500"></div> POV Hooks: BTS Reality</li>
              <li className="flex gap-4 items-center"><div className="w-1.5 h-1.5 bg-emerald-500"></div> Trending Audio: Scale Engine</li>
            </ul>
            <div className="mt-12 pt-8 border-t border-zinc-900">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">TONE GUIDE</span>
               <p className="text-white oswald font-black text-2xl mt-2 italic">Punchy. Hook-Heavy. Fast.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE 3: CONTENT PILLARS */}
      <section className="space-y-12 border-b border-zinc-900 pb-20">
        <SlideHeader number="03" title="Content Pillars" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: '01', t: 'Award-Winning', d: 'Historical clips from past Taurus winners. Pure prestige.', i: 'fa-award' },
            { n: '02', t: 'Near Misses', d: 'High-risk moments. Hook: "3 ribs broken... finished the take."', i: 'fa-skull-crossbones' },
            { n: '03', t: 'Stunt Anatomy', d: 'Breakdown of rigging and wirework. Education and authority.', i: 'fa-microscope' },
            { n: '04', t: 'Spotlight', d: 'Honoring individual performers. Tagging for industry reach.', i: 'fa-user-secret' },
            { n: '05', t: 'Iconic IP', d: 'Recognizable studio blockbusters to drive mass algorithm search.', i: 'fa-clapperboard' },
            { n: '06', t: 'Fan Debates', d: 'Polling the "Best Stunt of All Time" to trigger comments.', i: 'fa-comments' },
          ].map(p => (
            <div key={p.n} className="bg-[#050505] border border-zinc-800/60 p-10 relative group overflow-hidden hover:border-[#C5A059]/30 transition duration-500">
              <i className={`fa-solid ${p.i} absolute -right-6 -bottom-6 text-7xl text-[#C5A059]/5 transition group-hover:text-[#C5A059]/10`}></i>
              <div className="text-[#C5A059] font-black oswald text-xl mb-4 italic">{p.n}</div>
              <h5 className="font-black oswald uppercase text-xl mb-4 tracking-tight text-zinc-100 italic">{p.t}</h5>
              <p className="text-[11px] text-zinc-500 font-bold uppercase leading-relaxed tracking-wider">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SLIDE 4: THE LIBRARY ADVANTAGE */}
      <section className="space-y-12 border-b border-zinc-900 pb-20">
        <SlideHeader number="04" title="The Archive Advantage" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="bg-[#C5A059] p-16 rounded-none text-black space-y-8">
             <h4 className="text-4xl oswald font-black uppercase italic leading-none">The Editorial Assembly Line</h4>
             <ul className="space-y-4 font-black text-lg uppercase tracking-widest">
                <li className="flex gap-4"><span>✓</span> Zero Production Costs</li>
                <li className="flex gap-4"><span>✓</span> No Daily Filming Burdens</li>
                <li className="flex gap-4"><span>✓</span> Pure Editorial Output</li>
                <li className="flex gap-4"><span>✓</span> Batch-Produce 30 Days in 1 Afternoon</li>
             </ul>
          </div>
          <div className="space-y-8">
             <p className="text-2xl text-zinc-500 italic font-medium leading-relaxed">
               "Most brands struggle to film 1 quality video a week. You have decades of world-class action waiting to be rediscovered."
             </p>
             <div className="h-px bg-zinc-800"></div>
             <p className="text-2xl font-black oswald uppercase tracking-tighter text-white italic">Maximum Reach. Minimum Friction.</p>
          </div>
        </div>
      </section>

      {/* SLIDE 5: GROWTH EXPECTATIONS */}
      <section className="space-y-12 border-b border-zinc-900 pb-20">
        <SlideHeader number="05" title="Strategic Growth" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="p-12 bg-[#0A0A0A] border border-zinc-900 text-center space-y-6">
              <p className="text-zinc-600 font-black uppercase text-[10px] tracking-[0.3em]">Month 1</p>
              <p className="text-5xl oswald font-black italic text-zinc-200">0 – 1K</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Momentum Setup</p>
           </div>
           <div className="p-12 bg-black border border-[#C5A059]/20 text-center space-y-6 scale-110 shadow-2xl">
              <p className="text-[#C5A059] font-black uppercase text-[10px] tracking-[0.3em]">Month 6</p>
              <p className="text-7xl oswald font-black italic taurus-text-gold">10K+</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Industry Critical Mass</p>
           </div>
           <div className="p-12 bg-[#0A0A0A] border border-zinc-900 text-center space-y-6">
              <p className="text-zinc-600 font-black uppercase text-[10px] tracking-[0.3em]">Year End</p>
              <p className="text-5xl oswald font-black italic text-zinc-200">Authority</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Category King</p>
           </div>
        </div>
      </section>

      {/* SLIDE 6: CLOSING CALL */}
      <section className="text-center py-32 space-y-12">
         <div className="inline-block h-px w-24 bg-[#C5A059] mb-4"></div>
         <h2 className="text-8xl oswald font-black uppercase taurus-text-gold leading-none italic tracking-tighter">RESPECT <br/> THE CRAFT</h2>
         <p className="text-zinc-500 font-black uppercase tracking-[0.6em] text-xs">Prepare for Taurus 2027</p>
         <button className="btn-taurus px-16 py-6 oswald italic text-xl">
           IGNITE MACHINE
         </button>
      </section>
    </div>
  );
};

export default Strategy;
