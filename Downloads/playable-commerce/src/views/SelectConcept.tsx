// src/views/SelectConcept.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, RefreshCw, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { buildGameSpec, generateConcepts } from '../services/geminiService';
import type { Concept } from '../types';

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-neutral-700 w-4">{value}</span>
    </div>
  );
}

function ConceptCard({
  concept,
  onSelect,
  loading,
}: {
  concept: Concept;
  onSelect: () => void;
  loading: boolean;
}) {
  const avgScore = Math.round(
    Object.values(concept.scores).reduce((a, b) => a + b, 0) /
      Object.keys(concept.scores).length,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-neutral-900">{concept.name}</h3>
          <div className="flex gap-2 mt-1.5">
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
              {concept.primitive}
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              {concept.skin}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-neutral-50 px-2.5 py-1.5 rounded-lg">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-neutral-700">{avgScore}/10</span>
        </div>
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed mb-3">{concept.premise}</p>
      <p className="text-xs text-neutral-500 italic mb-5 leading-relaxed">{concept.whyItFits}</p>

      {/* Scores */}
      <div className="space-y-1.5 mb-6">
        <ScoreBar label="Brand specificity" value={concept.scores.brandSpecificity} />
        <ScoreBar label="Product demo" value={concept.scores.productDemonstration} />
        <ScoreBar label="Simplicity" value={concept.scores.simplicity} />
        <ScoreBar label="Suspense" value={concept.scores.suspense} />
        <ScoreBar label="Mobile usability" value={concept.scores.mobileUsability} />
        <ScoreBar label="Conversion" value={concept.scores.conversionPotential} />
      </div>

      {/* Headline preview */}
      <div className="bg-neutral-900 rounded-xl px-4 py-3 text-center mb-5">
        <p className="text-white font-black tracking-wider text-sm">{concept.headline}</p>
        <p className="text-neutral-400 text-xs mt-1">{concept.ctaText}</p>
      </div>

      <button
        onClick={onSelect}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Build This Experience <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </button>
    </motion.div>
  );
}

export default function SelectConcept() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [regenNote, setRegenNote] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const handleSelect = async (concept: Concept) => {
    if (!state.brandProfile || !state.creation || buildingId) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setBuildingId(concept.id);
    dispatch({ type: 'SELECT_CONCEPT', payload: concept });
    dispatch({ type: 'SET_BUILDING_SPEC', payload: true });
    try {
      const spec = await buildGameSpec(
        concept,
        state.brandProfile,
        state.creation,
        controller.signal,
      );
      dispatch({ type: 'SET_GAME_SPEC', payload: spec });
      navigate('/editor');
    } catch (e) {
      if (!controller.signal.aborted) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to build game spec. Please try again.',
        });
        setBuildingId(null);
      }
    }
  };

  const handleRegenerate = async () => {
    if (!state.brandProfile || regenerating) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setRegenerating(true);
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_GENERATING_CONCEPTS', payload: true });
    try {
      const concepts = await generateConcepts(
        state.brandProfile,
        regenNote,
        controller.signal,
      );
      dispatch({ type: 'SET_CONCEPTS', payload: concepts });
      setRegenNote('');
    } catch (e) {
      if (!controller.signal.aborted) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to regenerate. Please try again.',
        });
      }
    } finally {
      if (!controller.signal.aborted) setRegenerating(false);
    }
  };

  if (!state.concepts.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-neutral-500">Generating concepts...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">Choose an Experience</h2>
        <p className="text-neutral-500 text-lg">
          AI-generated concepts mapped to{' '}
          {state.brandProfile?.productName ?? 'your product'}'s playable attributes.
        </p>
      </div>

      {state.error && (
        <p
          className="mx-auto mb-6 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {state.concepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            onSelect={() => handleSelect(concept)}
            loading={buildingId === concept.id}
          />
        ))}
      </div>

      {/* Regenerate */}
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <input
          type="text"
          value={regenNote}
          onChange={(e) => setRegenNote(e.target.value)}
          placeholder="Make it funnier / More premium / Harder..."
          className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleRegenerate}
          disabled={regenerating || Boolean(buildingId)}
          className="flex items-center px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {regenerating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Regenerate
        </button>
      </div>
    </div>
  );
}
