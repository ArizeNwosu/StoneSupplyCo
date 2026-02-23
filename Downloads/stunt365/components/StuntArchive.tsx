
import React, { useState, useMemo } from 'react';
import { ARCHIVE_CLIPS, PILLAR_COLORS, PILLAR_TEXT_COLORS } from '../constants';
import { ArchiveClip, ContentPillar } from '../types';

interface StuntArchiveProps {
  onGenerateHook?: (title: string, pillar: ContentPillar, description: string) => void;
}

const STATUS_STYLES: Record<ArchiveClip['status'], { bg: string; text: string; dot: string }> = {
  posted:    { bg: 'bg-emerald-950/40', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  scheduled: { bg: 'bg-[#C5A059]/10',  text: 'text-[#C5A059]',   dot: 'bg-[#C5A059]' },
  available: { bg: 'bg-zinc-900/40',   text: 'text-zinc-400',    dot: 'bg-zinc-600'   },
};

const PILLAR_ICONS: Record<ContentPillar, string> = {
  [ContentPillar.AWARD_WINNING]: 'fa-award',
  [ContentPillar.ALMOST_DIED]:   'fa-skull-crossbones',
  [ContentPillar.BREAKDOWN]:     'fa-microscope',
  [ContentPillar.SPOTLIGHT]:     'fa-user-secret',
  [ContentPillar.FAMOUS_IP]:     'fa-clapperboard',
  [ContentPillar.FAN_VOTING]:    'fa-comments',
};

const StuntArchive: React.FC<StuntArchiveProps> = ({ onGenerateHook }) => {
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState<ContentPillar | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<'Instagram' | 'TikTok' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ArchiveClip['status'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedClip, setSelectedClip] = useState<ArchiveClip | null>(null);

  const filtered = useMemo(() => {
    return ARCHIVE_CLIPS.filter(clip => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        clip.title.toLowerCase().includes(q) ||
        clip.film.toLowerCase().includes(q) ||
        clip.performer.toLowerCase().includes(q) ||
        clip.tags.some(t => t.toLowerCase().includes(q));
      const matchesPillar = pillarFilter === 'all' || clip.pillar === pillarFilter;
      const matchesPlatform = platformFilter === 'all' || clip.platform.includes(platformFilter);
      const matchesStatus = statusFilter === 'all' || clip.status === statusFilter;
      return matchesSearch && matchesPillar && matchesPlatform && matchesStatus;
    });
  }, [search, pillarFilter, platformFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: ARCHIVE_CLIPS.length,
    posted: ARCHIVE_CLIPS.filter(c => c.status === 'posted').length,
    scheduled: ARCHIVE_CLIPS.filter(c => c.status === 'scheduled').length,
    available: ARCHIVE_CLIPS.filter(c => c.status === 'available').length,
  }), []);

  const handleGenerateHook = (clip: ArchiveClip) => {
    onGenerateHook?.(clip.title, clip.pillar, clip.description);
  };

  return (
    <div className="p-16 space-y-12 animate-fadeIn">
      {/* ── Header ── */}
      <header className="flex justify-between items-end border-b border-zinc-900 pb-12">
        <div className="space-y-4">
          <h2 className="text-5xl serif-header font-black uppercase tracking-tighter taurus-text-gold italic">Stunt Archive</h2>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em]">
            {ARCHIVE_CLIPS.length} clips catalogued. Decades of craft. Zero production overhead.
          </p>
        </div>
        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 border transition duration-300 ${viewMode === 'grid' ? 'border-[#C5A059] text-[#C5A059]' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
          >
            <i className="fa-solid fa-grip text-xs"></i>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 border transition duration-300 ${viewMode === 'list' ? 'border-[#C5A059] text-[#C5A059]' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
          >
            <i className="fa-solid fa-list text-xs"></i>
          </button>
        </div>
      </header>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Clips', value: stats.total, color: 'text-white' },
          { label: 'Posted', value: stats.posted, color: 'text-emerald-400' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-[#C5A059]' },
          { label: 'Available', value: stats.available, color: 'text-zinc-400' },
        ].map(s => (
          <div key={s.label} className="bg-black border border-zinc-900 p-6 text-center">
            <div className={`text-3xl oswald font-black italic ${s.color}`}>{s.value}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-[#0A0A0A] border border-zinc-900 p-8 space-y-6">
        {/* Search */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 text-xs"></i>
          <input
            type="text"
            placeholder="Search by title, film, performer, or tag..."
            className="w-full bg-black border border-zinc-800 rounded-none pl-12 pr-6 py-4 focus:border-[#C5A059] outline-none transition text-zinc-100 text-sm placeholder:text-zinc-700"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition">
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar */}
          <div className="space-y-2">
            <label className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Content Pillar</label>
            <select
              className="w-full bg-black border border-zinc-800 rounded-none px-4 py-3 outline-none text-zinc-300 font-bold focus:border-[#C5A059] transition text-[10px] uppercase tracking-widest"
              value={pillarFilter}
              onChange={e => setPillarFilter(e.target.value as ContentPillar | 'all')}
            >
              <option value="all">All Pillars</option>
              {Object.values(ContentPillar).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <label className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Platform</label>
            <select
              className="w-full bg-black border border-zinc-800 rounded-none px-4 py-3 outline-none text-zinc-300 font-bold focus:border-[#C5A059] transition text-[10px] uppercase tracking-widest"
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value as 'Instagram' | 'TikTok' | 'all')}
            >
              <option value="all">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Status</label>
            <select
              className="w-full bg-black border border-zinc-800 rounded-none px-4 py-3 outline-none text-zinc-300 font-bold focus:border-[#C5A059] transition text-[10px] uppercase tracking-widest"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ArchiveClip['status'] | 'all')}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="scheduled">Scheduled</option>
              <option value="posted">Posted</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
            Showing <span className="text-zinc-300">{filtered.length}</span> of {ARCHIVE_CLIPS.length} clips
          </p>
          {(search || pillarFilter !== 'all' || platformFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setPillarFilter('all'); setPlatformFilter('all'); setStatusFilter('all'); }}
              className="text-[9px] font-black text-zinc-600 hover:text-[#C5A059] uppercase tracking-widest transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Grid View ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(clip => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onGenerateHook={() => handleGenerateHook(clip)}
              onPreview={() => setSelectedClip(clip)}
            />
          ))}
          {filtered.length === 0 && <EmptyState />}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filtered.map(clip => (
            <ClipRow
              key={clip.id}
              clip={clip}
              onGenerateHook={() => handleGenerateHook(clip)}
              onPreview={() => setSelectedClip(clip)}
            />
          ))}
          {filtered.length === 0 && <EmptyState />}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedClip && (
        <ClipDetailModal
          clip={selectedClip}
          onClose={() => setSelectedClip(null)}
          onGenerateHook={() => { handleGenerateHook(selectedClip); setSelectedClip(null); }}
        />
      )}
    </div>
  );
};

// ─── Clip Card (Grid) ─────────────────────────────────────────────────────────
const ClipCard: React.FC<{ clip: ArchiveClip; onGenerateHook: () => void; onPreview: () => void }> = ({ clip, onGenerateHook, onPreview }) => {
  const status = STATUS_STYLES[clip.status];
  const pillarText = PILLAR_TEXT_COLORS[clip.pillar];

  return (
    <div className="bg-[#0A0A0A] border border-zinc-900 hover:border-[#C5A059]/40 transition duration-500 group overflow-hidden flex flex-col">
      {/* Cinematic thumbnail */}
      <div className="aspect-video overflow-hidden relative bg-black">
        {/* Scalable inner layer */}
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-950"></div>
          <div className={`absolute inset-0 opacity-[0.08] group-hover:opacity-[0.18] transition-opacity duration-700 ${PILLAR_COLORS[clip.pillar]}`}></div>
          <i className={`fa-solid ${PILLAR_ICONS[clip.pillar]} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-white/[0.03] group-hover:text-white/[0.07] transition-colors duration-700`}></i>
        </div>
        {/* Static overlays */}
        <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 text-[7px] font-black oswald text-[#C5A059] border border-[#C5A059]/25 tracking-[0.2em] uppercase z-10">
          VAULT ASSET
        </div>
        <div className="absolute top-3 right-3 bg-black/80 px-2 py-0.5 text-[8px] font-black text-zinc-500 border border-zinc-800 z-10">
          {clip.year}
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
            <i className="fa-solid fa-play text-white text-xs ml-0.5"></i>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-4 py-3 z-10">
          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest truncate">{clip.film}</p>
        </div>
      </div>

      <div className="p-8 flex-1 space-y-5">
        {/* Meta row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <i className={`fa-solid ${PILLAR_ICONS[clip.pillar]} ${pillarText} text-xs`}></i>
              <span className={`text-[8px] font-black uppercase tracking-widest ${pillarText}`}>{clip.pillar}</span>
            </div>
            <h3 className="text-sm font-black text-zinc-100 uppercase tracking-tight leading-tight oswald italic">{clip.title}</h3>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 ${status.bg} flex-shrink-0`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></div>
            <span className={`text-[8px] font-black uppercase tracking-widest ${status.text}`}>{clip.status}</span>
          </div>
        </div>

        {/* Film & Year */}
        <div>
          <p className="text-[10px] text-zinc-400 font-bold italic">{clip.film}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">{clip.year}</span>
            <span className="text-zinc-800">·</span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest truncate">{clip.performer}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium line-clamp-2">{clip.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {clip.tags.map(tag => (
            <span key={tag} className="text-[7px] font-black uppercase tracking-widest text-zinc-700 border border-zinc-900 px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>

        {/* Platform badges */}
        <div className="flex items-center gap-2 pt-1">
          {clip.platform.includes('Instagram') && (
            <span className="text-[8px] font-black text-zinc-500 flex items-center gap-1">
              <i className="fa-brands fa-instagram text-xs"></i> IG
            </span>
          )}
          {clip.platform.includes('TikTok') && (
            <span className="text-[8px] font-black text-zinc-500 flex items-center gap-1">
              <i className="fa-brands fa-tiktok text-xs"></i> TT
            </span>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-zinc-900 grid grid-cols-2">
        <button
          onClick={onPreview}
          className="py-3 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 transition duration-300 border-r border-zinc-900 flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-eye text-xs"></i> Preview
        </button>
        <button
          onClick={onGenerateHook}
          className="py-3 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#C5A059] hover:bg-[#C5A059]/5 transition duration-300 flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-xs"></i> Generate Hook
        </button>
      </div>
    </div>
  );
};

// ─── Clip Row (List) ──────────────────────────────────────────────────────────
const ClipRow: React.FC<{ clip: ArchiveClip; onGenerateHook: () => void; onPreview: () => void }> = ({ clip, onGenerateHook, onPreview }) => {
  const status = STATUS_STYLES[clip.status];
  const pillarText = PILLAR_TEXT_COLORS[clip.pillar];

  return (
    <div className="bg-[#0A0A0A] border border-zinc-900 hover:border-[#C5A059]/30 transition duration-300 flex items-center gap-6 p-5 group">
      {/* Pillar indicator */}
      <div className={`w-1 h-10 flex-shrink-0 ${PILLAR_COLORS[clip.pillar]}`}></div>

      {/* Main info */}
      <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
        <div className="col-span-2 min-w-0">
          <p className="text-xs font-black text-zinc-100 oswald italic uppercase truncate">{clip.title}</p>
          <p className="text-[9px] text-zinc-500 font-medium mt-0.5 truncate">{clip.film} · {clip.year}</p>
        </div>
        <div className="hidden md:block">
          <span className={`text-[9px] font-black uppercase tracking-widest ${pillarText}`}>
            <i className={`fa-solid ${PILLAR_ICONS[clip.pillar]} mr-1.5`}></i>
            {clip.pillar.split(' ').slice(0, 2).join(' ')}
          </span>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <div className="hidden md:flex items-center gap-2">
            {clip.platform.includes('Instagram') && <i className="fa-brands fa-instagram text-zinc-700 text-xs"></i>}
            {clip.platform.includes('TikTok') && <i className="fa-brands fa-tiktok text-zinc-700 text-xs"></i>}
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 ${status.bg}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></div>
            <span className={`text-[7px] font-black uppercase tracking-widest ${status.text} hidden sm:block`}>{clip.status}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition duration-300">
        <button
          onClick={onPreview}
          className="p-2 text-zinc-600 hover:text-zinc-300 transition"
          title="Preview"
        >
          <i className="fa-solid fa-eye text-xs"></i>
        </button>
        <button
          onClick={onGenerateHook}
          className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-[#C5A059] border border-zinc-800 hover:border-[#C5A059]/50 transition duration-300 flex items-center gap-2"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-xs"></i> Generate
        </button>
      </div>
    </div>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const ClipDetailModal: React.FC<{ clip: ArchiveClip; onClose: () => void; onGenerateHook: () => void }> = ({ clip, onClose, onGenerateHook }) => {
  const status = STATUS_STYLES[clip.status];
  const pillarText = PILLAR_TEXT_COLORS[clip.pillar];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-[#0A0A0A] border border-zinc-800 max-w-xl w-full shadow-2xl cinematic-glow"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className={`h-1 ${PILLAR_COLORS[clip.pillar]}`}></div>

        <div className="p-10 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <i className={`fa-solid ${PILLAR_ICONS[clip.pillar]} ${pillarText} text-xs`}></i>
                <span className={`text-[8px] font-black uppercase tracking-widest ${pillarText}`}>{clip.pillar}</span>
              </div>
              <h3 className="text-2xl oswald font-black text-zinc-100 italic uppercase leading-tight">{clip.title}</h3>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition mt-1 flex-shrink-0">
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Film', value: clip.film },
              { label: 'Year', value: String(clip.year) },
              { label: 'Performer', value: clip.performer },
              { label: 'Status', value: clip.status },
            ].map(d => (
              <div key={d.label} className="bg-black border border-zinc-900 px-5 py-4">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{d.label}</p>
                <p className={`text-xs font-black mt-1 capitalize ${d.label === 'Status' ? status.text : 'text-zinc-200'}`}>{d.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-black border border-zinc-900 p-6">
            <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest mb-3">Archive Note</p>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium italic">{clip.description}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {clip.tags.map(tag => (
              <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 border border-zinc-800 px-3 py-1">
                #{tag}
              </span>
            ))}
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Platforms:</span>
            {clip.platform.includes('Instagram') && (
              <span className="text-xs font-black text-zinc-300 flex items-center gap-2">
                <i className="fa-brands fa-instagram text-[#C5A059]"></i> Instagram
              </span>
            )}
            {clip.platform.includes('TikTok') && (
              <span className="text-xs font-black text-zinc-300 flex items-center gap-2">
                <i className="fa-brands fa-tiktok text-emerald-500"></i> TikTok
              </span>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={onGenerateHook}
            className="w-full btn-taurus py-5 serif-header italic text-base flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            Generate Hook for This Clip
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="col-span-full py-20 flex flex-col items-center text-center">
    <i className="fa-solid fa-film text-zinc-800 text-4xl mb-6"></i>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">No clips match your filters</p>
    <p className="text-[9px] text-zinc-800 font-bold uppercase tracking-widest mt-2">Try adjusting your search or clearing filters</p>
  </div>
);

export default StuntArchive;
