
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { ContentPillar, AIGenerationResult } from '../types';

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
const InstagramMockup: React.FC<{ caption: string; stuntTitle: string }> = ({ caption, stuntTitle }) => {
  const { displayed } = useTypewriter(caption, 8);
  return (
    <div className="flex flex-col items-center">
      <div className="w-64 bg-zinc-950 rounded-[2.5rem] border-2 border-zinc-700 shadow-2xl overflow-hidden relative" style={{ minHeight: 520 }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-950 z-20 rounded-b-2xl"></div>
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[8px] text-zinc-500 font-bold z-10 relative">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        {/* App header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900">
          <span className="text-[10px] font-black text-zinc-200 tracking-widest uppercase">Instagram</span>
          <i className="fa-brands fa-instagram text-xs text-zinc-400"></i>
        </div>
        {/* Post header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C5A059] to-[#8E6D31] flex items-center justify-center">
            <i className="fa-solid fa-trophy text-[8px] text-black"></i>
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-100 leading-none">@taurusstuntawards</p>
            <p className="text-[7px] text-zinc-600 mt-0.5">Taurus World Stunt Awards</p>
          </div>
          <button className="ml-auto text-[8px] font-black text-[#C5A059] uppercase tracking-widest">Follow</button>
        </div>
        {/* Video placeholder */}
        <div className="bg-zinc-900 mx-0 relative" style={{ height: 200 }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <i className="fa-solid fa-film text-zinc-700 text-2xl"></i>
            <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest text-center px-4">{stuntTitle}</p>
          </div>
          {/* Reel indicator */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
            <i className="fa-brands fa-instagram text-white text-[8px]"></i>
            <span className="text-[7px] text-white font-bold">REEL</span>
          </div>
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-4 px-4 py-2">
          <i className="fa-regular fa-heart text-zinc-300 text-sm"></i>
          <i className="fa-regular fa-comment text-zinc-300 text-sm"></i>
          <i className="fa-regular fa-paper-plane text-zinc-300 text-sm"></i>
          <div className="ml-auto">
            <i className="fa-regular fa-bookmark text-zinc-300 text-sm"></i>
          </div>
        </div>
        {/* Like count */}
        <div className="px-4">
          <p className="text-[9px] font-black text-zinc-200">12,847 likes</p>
        </div>
        {/* Caption */}
        <div className="px-4 pb-4 pt-1">
          <p className="text-[8px] text-zinc-300 leading-relaxed">
            <span className="text-zinc-100 font-black">taurusstuntawards</span>{' '}
            {displayed}
            <span className="animate-pulse">|</span>
          </p>
        </div>
      </div>
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-3">Instagram Preview</p>
    </div>
  );
};

const TikTokMockup: React.FC<{ hook: string; stuntTitle: string }> = ({ hook, stuntTitle }) => {
  const { displayed } = useTypewriter(hook, 12);
  return (
    <div className="flex flex-col items-center">
      <div className="w-64 bg-zinc-950 rounded-[2.5rem] border-2 border-zinc-700 shadow-2xl overflow-hidden relative" style={{ minHeight: 520 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-950 z-20 rounded-b-2xl"></div>
        <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[8px] text-zinc-500 font-bold z-10 relative">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        {/* TikTok header */}
        <div className="flex items-center justify-center px-4 py-2 border-b border-zinc-900 gap-6">
          <span className="text-[9px] text-zinc-600 font-bold">Following</span>
          <span className="text-[9px] font-black text-zinc-100 border-b border-white pb-0.5">For You</span>
          <span className="text-[9px] text-zinc-600 font-bold">Live</span>
        </div>
        {/* Video full-bleed */}
        <div className="bg-zinc-900 relative" style={{ height: 280 }}>
          <div className="absolute inset-0 flex flex-col items-end justify-center gap-4 pr-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C5A059] to-[#8E6D31] flex items-center justify-center border-2 border-white">
                <i className="fa-solid fa-trophy text-[8px] text-black"></i>
              </div>
              <div className="w-4 h-4 bg-[#C5A059] rounded-full flex items-center justify-center -mt-2">
                <i className="fa-solid fa-plus text-[6px] text-black"></i>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <i className="fa-solid fa-heart text-white text-lg"></i>
              <span className="text-[7px] text-white font-bold">84.2K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <i className="fa-solid fa-comment text-white text-lg"></i>
              <span className="text-[7px] text-white font-bold">1,243</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <i className="fa-solid fa-share text-white text-lg"></i>
              <span className="text-[7px] text-white font-bold">Share</span>
            </div>
          </div>
          {/* Centered content */}
          <div className="absolute bottom-6 left-3 right-12">
            <p className="text-[8px] font-black text-white mb-1">@taurusstuntawards</p>
            <p className="text-[9px] font-black text-white leading-tight">{displayed}<span className="animate-pulse">|</span></p>
            <p className="text-[7px] text-zinc-400 mt-1 truncate">{stuntTitle}</p>
          </div>
        </div>
        {/* Bottom nav */}
        <div className="flex items-center justify-around px-4 py-3 border-t border-zinc-900">
          <i className="fa-solid fa-house text-zinc-400 text-xs"></i>
          <i className="fa-solid fa-magnifying-glass text-zinc-400 text-xs"></i>
          <div className="flex">
            <div className="w-5 h-5 bg-[#C5A059]/50 rounded -mr-1"></div>
            <div className="w-5 h-5 bg-white/20 rounded -ml-1"></div>
            <div className="w-5 h-5 border border-white rounded -ml-3 flex items-center justify-center">
              <i className="fa-solid fa-plus text-[7px] text-white"></i>
            </div>
          </div>
          <i className="fa-regular fa-message text-zinc-400 text-xs"></i>
          <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
            <i className="fa-solid fa-user text-[7px] text-zinc-400"></i>
          </div>
        </div>
      </div>
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-3">TikTok Preview</p>
    </div>
  );
};

// ─── Streaming Progress Indicator ─────────────────────────────────────────────
const StreamingIndicator: React.FC<{ text: string }> = ({ text }) => {
  const lines = 4;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
          ))}
        </div>
        <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em]">AI Generating</span>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-2 bg-zinc-900 rounded-full animate-pulse`} style={{ width: `${[90, 70, 85, 50][i]}%`, animationDelay: `${i * 0.1}s` }}></div>
      ))}
      {text.length > 0 && (
        <div className="mt-6 bg-black border border-zinc-900 p-4 max-h-28 overflow-hidden relative">
          <p className="text-[8px] text-zinc-600 font-mono leading-relaxed">{text.slice(-200)}</p>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent"></div>
        </div>
      )}
    </div>
  );
};

// ─── Result Card ──────────────────────────────────────────────────────────────
const ResultCard: React.FC<{ label: string; icon: string; iconBrand?: boolean; color: string; content: string; sub: string; delay?: number }> = ({
  label, icon, iconBrand = true, color, content, sub, delay = 0
}) => {
  const { displayed } = useTypewriter(content, 6);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="bg-[#0F0F0F] border border-zinc-900 p-8 rounded-none group hover:border-[#C5A059]/30 transition duration-500 animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-6 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-4">
          <i className={`${iconBrand ? 'fa-brands' : 'fa-solid'} ${icon} ${color} text-xl`}></i>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${color}`}>{label}</span>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{sub}</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className={`text-[9px] font-black uppercase tracking-widest transition duration-300 flex items-center gap-2 ${copied ? 'text-emerald-400' : 'text-zinc-600 hover:text-[#C5A059]'}`}
        >
          {copied ? <><i className="fa-solid fa-check text-[8px]"></i> Copied</> : 'Copy'}
        </button>
      </div>
      <div className="text-sm text-zinc-300 leading-relaxed font-medium italic serif-header min-h-[3rem]">
        {displayed}
        <span className="animate-pulse text-[#C5A059]">|</span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface HookGeneratorProps {
  prefillTitle?: string;
  prefillPillar?: ContentPillar;
  prefillContext?: string;
}

const HookGenerator: React.FC<HookGeneratorProps> = ({ prefillTitle = '', prefillPillar = ContentPillar.BREAKDOWN, prefillContext = '' }) => {
  const [loading, setLoading] = useState(false);
  const [stunt, setStunt] = useState(prefillTitle);
  const [pillar, setPillar] = useState<ContentPillar>(prefillPillar);
  const [context, setContext] = useState(prefillContext);
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'instagram' | 'tiktok'>('instagram');
  const [showPreview, setShowPreview] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Sync prefills when they change (from Archive click)
  useEffect(() => {
    if (prefillTitle) { setStunt(prefillTitle); setResult(null); setStreamText(''); setError(null); }
  }, [prefillTitle]);
  useEffect(() => { setPillar(prefillPillar); }, [prefillPillar]);
  useEffect(() => { if (prefillContext) setContext(prefillContext); }, [prefillContext]);

  const handleGenerate = async () => {
    if (!stunt.trim()) return;
    setLoading(true);
    setResult(null);
    setStreamText('');
    setError(null);
    setShowPreview(false);

    try {
      const generated = await geminiService.generateContent(stunt, pillar, context, (chunk) => {
        setStreamText(chunk);
      });
      setResult(generated);
      setStreamText('');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'GEMINI_API_KEY_MISSING') {
        setError('API key not configured. Set VITE_GEMINI_API_KEY in .env.local to activate the AI engine.');
      } else {
        setError(`AI generation failed: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    const all = `INSTAGRAM:\n${result.igCaption}\n\nTIKTOK HOOK:\n${result.tiktokHook}\n\nBTS TRIVIA:\n${result.trivia}`;
    navigator.clipboard.writeText(all);
  };

  return (
    <div className="p-16 max-w-6xl mx-auto space-y-12 animate-fadeIn">
      <header className="max-w-3xl space-y-4 border-b border-zinc-900 pb-12">
        <h2 className="text-5xl serif-header font-black uppercase tracking-tighter taurus-text-gold italic">Hook Engine</h2>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em]">
          Repurposing Content at Scale. AI converts archive data into viral social copy.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* ── Input Form ── */}
        <div className="bg-[#0A0A0A] border border-zinc-900 p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A059]/5 rounded-full -translate-y-24 translate-x-24 blur-3xl"></div>
          <div className="space-y-10 relative z-10">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em] italic">Archive Reference</label>
              <input
                type="text"
                placeholder="e.g. 2004 Car Roll - Winner"
                className="w-full bg-black border border-zinc-800 rounded-none px-6 py-5 focus:border-[#C5A059] outline-none transition text-zinc-100 font-medium placeholder:text-zinc-800"
                value={stunt}
                onChange={(e) => setStunt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em] italic">Content Pillar</label>
              <select
                className="w-full bg-black border border-zinc-800 rounded-none px-6 py-5 outline-none text-zinc-200 font-bold focus:border-[#C5A059] transition appearance-none uppercase tracking-widest text-[10px]"
                value={pillar}
                onChange={(e) => setPillar(e.target.value as ContentPillar)}
              >
                {Object.values(ContentPillar).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em] italic">Rigging & Safety Notes</label>
              <textarea
                rows={4}
                placeholder="Add technical context for authority building..."
                className="w-full bg-black border border-zinc-800 rounded-none px-6 py-5 focus:border-[#C5A059] outline-none transition text-zinc-100 font-medium placeholder:text-zinc-800 resize-none"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <button
              disabled={loading || !stunt.trim()}
              onClick={handleGenerate}
              className={`w-full btn-taurus py-6 serif-header italic text-lg ${loading || !stunt.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="flex gap-1">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-black rounded-full animate-bounce inline-block" style={{ animationDelay: `${i*0.15}s` }}></span>)}
                  </span>
                  PROCESSING ARCHIVE
                </span>
              ) : 'GENERATE HOOKS'}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="space-y-8" ref={resultRef}>
          {!result && !loading && !error && (
            <div className="h-full bg-zinc-900/10 border-2 border-dashed border-zinc-900/40 p-16 flex flex-col items-center justify-center text-center min-h-64">
              <i className="fa-solid fa-microchip text-zinc-800 text-5xl mb-8"></i>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Machine Standby</h4>
              <p className="text-[10px] text-zinc-800 mt-4 max-w-xs font-bold uppercase tracking-widest leading-relaxed">
                Input archive data to generate editorial content automatically.
              </p>
            </div>
          )}

          {loading && !result && (
            <div className="bg-[#0A0A0A] border border-zinc-900 p-12">
              <StreamingIndicator text={streamText} />
            </div>
          )}

          {error && (
            <div className="bg-red-950/20 border border-red-900/40 p-8 space-y-3">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Engine Error</span>
              </div>
              <p className="text-xs text-red-300/70 font-medium">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fadeIn">
              {/* Copy All */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">3 Assets Generated</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 border transition duration-300 ${showPreview ? 'border-[#C5A059] text-[#C5A059]' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                  >
                    <i className="fa-solid fa-mobile-screen text-xs"></i>
                    {showPreview ? 'Hide Preview' : 'Platform Preview'}
                  </button>
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-2 text-[9px] font-black text-zinc-500 hover:text-[#C5A059] uppercase tracking-widest transition duration-300 px-4 py-2 border border-zinc-800 hover:border-zinc-600"
                  >
                    <i className="fa-regular fa-copy text-xs"></i>
                    Copy All
                  </button>
                </div>
              </div>

              <ResultCard
                label="Instagram Directive"
                icon="fa-instagram"
                color="text-[#C5A059]"
                content={result.igCaption}
                sub="High-End Cinematic Copy"
                delay={0}
              />
              <ResultCard
                label="TikTok FYP Hook"
                icon="fa-tiktok"
                color="text-emerald-500"
                content={result.tiktokHook}
                sub="Adrenaline-First Retention"
                delay={150}
              />
              <ResultCard
                label="BTS Authority Fact"
                icon="fa-brain"
                iconBrand={false}
                color="text-[#C5A059]"
                content={result.trivia}
                sub="Technical Industry Trivia"
                delay={300}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Platform Preview Section ── */}
      {result && showPreview && (
        <div className="border-t border-zinc-900 pt-12 animate-fadeIn space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em]">Platform Preview</p>
            <div className="flex gap-2">
              {(['instagram', 'tiktok'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPreviewTab(tab)}
                  className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest transition duration-300 ${
                    previewTab === tab
                      ? 'bg-[#C5A059] text-black'
                      : 'border border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab === 'instagram' ? (
                    <span className="flex items-center gap-2"><i className="fa-brands fa-instagram"></i> Instagram</span>
                  ) : (
                    <span className="flex items-center gap-2"><i className="fa-brands fa-tiktok"></i> TikTok</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center py-8">
            {previewTab === 'instagram' ? (
              <InstagramMockup caption={result.igCaption} stuntTitle={stunt} />
            ) : (
              <TikTokMockup hook={result.tiktokHook} stuntTitle={stunt} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HookGenerator;
