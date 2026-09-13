// src/views/AnalyzeStore.tsx
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Wand2, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeBrand, generateConcepts } from '../services/geminiService';

export default function AnalyzeStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  const hasRun = useRef(false);

  const { url } = (location.state as { url?: string; goal?: string; reward?: string }) ?? {};

  useEffect(() => {
    if (hasRun.current) return;
    if (!url && !state.analyzing) {
      navigate('/create');
      return;
    }
    hasRun.current = true;

    const run = async () => {
      try {
        dispatch({ type: 'SET_ANALYZING', payload: true });
        const profile = await analyzeBrand(url ?? 'https://example.com');
        dispatch({ type: 'SET_BRAND_PROFILE', payload: profile });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to analyze brand. Check your API key or try a different URL.' });
      }
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateConcepts = async () => {
    if (!state.brandProfile) return;
    dispatch({ type: 'SET_GENERATING_CONCEPTS', payload: true });
    try {
      const concepts = await generateConcepts(state.brandProfile);
      dispatch({ type: 'SET_CONCEPTS', payload: concepts });
      navigate('/concepts');
    } catch (e) {
      dispatch({ type: 'SET_GENERATING_CONCEPTS', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate concepts. Please try again.' });
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto h-full flex flex-col justify-center">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden p-8">
        <AnimatePresence mode="wait">
          {state.analyzing && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 flex flex-col items-center"
            >
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Analyzing Brand</h2>
              <p className="text-neutral-500 max-w-sm mx-auto">
                Scanning products, images, descriptions, and brand tone...
              </p>
              {url && (
                <p className="text-xs text-neutral-400 mt-4 font-mono">{url}</p>
              )}
            </motion.div>
          )}

          {state.error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 flex flex-col items-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Analysis Failed</h2>
              <p className="text-neutral-500 max-w-sm mx-auto mb-6">{state.error}</p>
              <button
                onClick={() => navigate('/create')}
                className="px-5 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {state.brandProfile && !state.analyzing && !state.error && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: state.brandProfile.primaryColor + '20', color: state.brandProfile.primaryColor }}>
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Analysis Complete</h2>
                  <p className="text-neutral-500 text-sm">{state.brandProfile.brandName} — {state.brandProfile.category}</p>
                </div>
                {/* Color swatches */}
                <div className="ml-auto flex gap-2">
                  {[state.brandProfile.primaryColor, state.brandProfile.accentColor, state.brandProfile.backgroundColor].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border border-neutral-200 shadow-sm" style={{ background: c }} title={c} />
                  ))}
                </div>
              </div>

              {/* USP */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Core USP</p>
                <p className="text-neutral-900 font-medium">{state.brandProfile.usp}</p>
              </div>

              {/* Playable attributes */}
              <div>
                <p className="text-sm font-semibold text-neutral-700 mb-3">Playable attributes</p>
                <div className="grid grid-cols-2 gap-3">
                  {state.brandProfile.playableAttributes.map((attr, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start p-3 rounded-xl border border-neutral-100 bg-neutral-50"
                    >
                      <div className="w-8 h-8 rounded-lg border border-neutral-200 bg-white flex items-center justify-center mr-3 shadow-sm flex-shrink-0 text-sm">
                        {['🔒', '🛡️', '⚡', '🎯', '✨'][i % 5]}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{attr.label}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{attr.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interaction metaphors */}
              <div>
                <p className="text-sm font-semibold text-neutral-700 mb-3">Best interaction metaphors</p>
                <div className="flex flex-wrap gap-2">
                  {state.brandProfile.interactionMetaphors.map((m, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-2">
                <button
                  onClick={handleGenerateConcepts}
                  disabled={state.generatingConcepts}
                  className="inline-flex items-center justify-center px-8 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                >
                  {state.generatingConcepts ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" />Generate Experiences<ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
