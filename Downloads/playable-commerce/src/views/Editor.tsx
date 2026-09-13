// src/views/Editor.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Palette, Gift, Settings2, ArrowRight, Save, Smartphone, Monitor } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameRenderer } from '../components/games/GameRenderer';
import { cyberbackpackSpec } from '../data/demos';
import type { GameSpec, GameSpecPatch, RewardType } from '../types';

type Tab = 'content' | 'design' | 'rewards' | 'integration';
type Device = 'mobile' | 'desktop';

export default function Editor() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [device, setDevice] = useState<Device>('mobile');

  // Fall back to CyberBackpack demo if no spec in context (e.g. direct navigation)
  const spec = state.gameSpec ?? cyberbackpackSpec;

  const update = (payload: GameSpecPatch) =>
    dispatch({ type: 'UPDATE_GAME_SPEC', payload });

  const tabs: { id: Tab; icon: typeof MessageSquare; label: string }[] = [
    { id: 'content', icon: MessageSquare, label: 'Content' },
    { id: 'design', icon: Palette, label: 'Design' },
    { id: 'rewards', icon: Gift, label: 'Rewards' },
    { id: 'integration', icon: Settings2, label: 'Integration' },
  ];

  return (
    <div className="flex h-full bg-neutral-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto">
        <div className="p-5 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900">{spec.experience.name}</h2>
          <p className="text-xs text-neutral-500 mt-0.5 capitalize">
            {spec.mechanic.primitive.replace('_', ' ')} · {spec.mechanic.skin.replace('_', ' ')}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="p-5 flex-1 space-y-5 overflow-y-auto">
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Headline
                </label>
                <input
                  type="text"
                  value={spec.intro.headline}
                  onChange={(e) =>
                    update({
                      intro: {
                        headline: e.target.value,
                        body: spec.intro.body,
                        cta: spec.intro.cta,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Body copy
                </label>
                <textarea
                  rows={3}
                  value={spec.intro.body}
                  onChange={(e) =>
                    update({
                      intro: {
                        headline: spec.intro.headline,
                        body: e.target.value,
                        cta: spec.intro.cta,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Button text
                </label>
                <input
                  type="text"
                  value={spec.intro.cta}
                  onChange={(e) =>
                    update({
                      intro: {
                        headline: spec.intro.headline,
                        body: spec.intro.body,
                        cta: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border-t border-neutral-100 pt-4">
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Result headline
                </label>
                <input
                  type="text"
                  value={spec.result.headline}
                  onChange={(e) =>
                    update({ result: { ...spec.result, headline: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-4">
              {(
                [
                  ['Background', 'backgroundColor'],
                  ['Text color', 'textColor'],
                  ['Primary color', 'primaryColor'],
                  ['Accent color', 'accentColor'],
                ] as [string, keyof GameSpec['branding']][]
              ).map(([label, key]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-neutral-700">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={spec.branding[key] as string}
                      onChange={(e) =>
                        update({ branding: { ...spec.branding, [key]: e.target.value } })
                      }
                      className="w-8 h-8 rounded-md border border-neutral-200 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-neutral-500">
                      {spec.branding[key] as string}
                    </span>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Font style
                </label>
                <select
                  value={spec.branding.fontStyle}
                  onChange={(e) =>
                    update({
                      branding: {
                        ...spec.branding,
                        fontStyle: e.target.value as GameSpec['branding']['fontStyle'],
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                  <option value="display">Display</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Reward type
                </label>
                <select
                  value={spec.reward.type}
                  onChange={(e) =>
                    update({ reward: { ...spec.reward, type: e.target.value as RewardType } })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free_shipping">Free shipping</option>
                  <option value="percentage_off">Percentage off</option>
                  <option value="fixed_off">Fixed amount off</option>
                  <option value="free_product">Free product</option>
                  <option value="mystery">Mystery reward</option>
                </select>
              </div>
              {(spec.reward.type === 'percentage_off' || spec.reward.type === 'fixed_off') && (
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                    Value
                  </label>
                  <input
                    type="text"
                    value={spec.reward.value ?? ''}
                    onChange={(e) =>
                      update({ reward: { ...spec.reward, value: e.target.value } })
                    }
                    placeholder={spec.reward.type === 'percentage_off' ? '15' : '10'}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Reward message
                </label>
                <textarea
                  rows={3}
                  value={spec.reward.message}
                  onChange={(e) =>
                    update({ reward: { ...spec.reward, message: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                Klaviyo form IDs — visitors are sent to these forms after the game completes.
              </p>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Standard form ID
                </label>
                <input
                  type="text"
                  value={spec.conversion.standardFormId ?? ''}
                  onChange={(e) =>
                    update({
                      conversion: { ...spec.conversion, standardFormId: e.target.value },
                    })
                  }
                  placeholder="XXXXXX"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  Winner form ID{' '}
                  <span className="font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={spec.conversion.winnerFormId ?? ''}
                  onChange={(e) =>
                    update({
                      conversion: { ...spec.conversion, winnerFormId: e.target.value },
                    })
                  }
                  placeholder="XXXXXX"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-neutral-50 rounded-xl p-4 text-xs text-neutral-600 leading-relaxed">
                After the game, Playable Commerce calls:
                <br />
                <code className="font-mono bg-white px-1.5 py-0.5 rounded mt-1 block">
                  window._klOnsite.push(['openForm', formId])
                </code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative bg-neutral-100">
        {/* Top bar */}
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
            <button
              type="button"
              aria-label="Mobile preview"
              aria-pressed={device === 'mobile'}
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-md transition-colors ${
                device === 'mobile'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Desktop preview"
              aria-pressed={device === 'desktop'}
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-md transition-colors ${
                device === 'desktop'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: 'SAVE_DRAFT' })}
              className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'SAVE_DRAFT' });
                navigate('/targeting');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center"
            >
              Continue to Targeting
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        {/* Phone mockup (375×720) */}
        {device === 'mobile' && (
          <div className="relative w-[375px] h-[720px] bg-white rounded-[3rem] shadow-2xl border-[14px] border-neutral-900 overflow-hidden flex flex-col">
            <div className="absolute top-0 inset-x-0 h-6 bg-neutral-900 rounded-b-3xl mx-auto w-36 z-20" />
            <div className="flex-1 overflow-hidden mt-3">
              <GameRenderer spec={spec} />
            </div>
          </div>
        )}

        {/* Browser-chrome mockup (680×480) */}
        {device === 'desktop' && (
          <div className="relative w-[680px] h-[480px] bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden flex flex-col">
            <div className="h-8 bg-neutral-100 border-b border-neutral-200 flex items-center px-4 gap-2 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <GameRenderer spec={spec} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
