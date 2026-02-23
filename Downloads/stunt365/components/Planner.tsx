
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ARCHIVE_CLIPS, PILLAR_COLORS, PILLAR_TEXT_COLORS } from '../constants';
import { ContentPillar, StuntPost, ArchiveClip } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PostComment {
  id: string;
  day: number;
  text: string;
  timestamp: string;
  type: 'comment' | 'status_change' | 'assign' | 'clear';
}

// ─── Persistence ─────────────────────────────────────────────────────────────
const POSTS_KEY    = 'stunt364_posts';
const COMMENTS_KEY = 'stunt364_comments';

const SEED_POSTS: StuntPost[] = [
  { day: 364, title: "Mission Impossible Burj Drop", pillar: ContentPillar.AWARD_WINNING, status: 'posted',    platform: ['Instagram', 'TikTok'], description: "Tom Cruise climbed the world's tallest building bare-handed. 14 takes." },
  { day: 363, title: "The Dark Knight Truck Flip",   pillar: ContentPillar.BREAKDOWN,     status: 'posted',    platform: ['Instagram'] },
  { day: 362, title: "Buster Keaton Train Jump",     pillar: ContentPillar.FAMOUS_IP,     status: 'scheduled', platform: ['Instagram', 'TikTok'] },
  { day: 361, title: "Stuntman Near Miss: Fire",     pillar: ContentPillar.ALMOST_DIED,   status: 'draft',     platform: ['TikTok'] },
  { day: 360, title: "Legacy of Vic Armstrong",      pillar: ContentPillar.SPOTLIGHT,     status: 'draft',     platform: ['Instagram'] },
  { day: 355, title: "War Rig Desert Explosion",     pillar: ContentPillar.AWARD_WINNING, status: 'scheduled', platform: ['Instagram', 'TikTok'] },
  { day: 350, title: "Casino Royale Parkour Chase",  pillar: ContentPillar.FAMOUS_IP,     status: 'draft',     platform: ['TikTok'] },
];

function loadPosts(): StuntPost[] {
  try { const s = localStorage.getItem(POSTS_KEY); return s ? JSON.parse(s) : SEED_POSTS; }
  catch { return SEED_POSTS; }
}
function loadComments(): PostComment[] {
  try { const s = localStorage.getItem(COMMENTS_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
function savePosts(posts: StuntPost[])       { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }
function saveComments(cs: PostComment[])     { localStorage.setItem(COMMENTS_KEY, JSON.stringify(cs)); }
function mkComment(day: number, text: string, type: PostComment['type']): PostComment {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, day, text, timestamp: new Date().toISOString(), type };
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportCSV(posts: StuntPost[]) {
  const headers = ['Day', 'Title', 'Pillar', 'Status', 'Platforms', 'Description'];
  const rows = posts
    .slice()
    .sort((a, b) => b.day - a.day)
    .map(p => [
      p.day,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.pillar}"`,
      p.status,
      p.platform.join('+'),
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `stunt364-calendar-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── Shared lookups ───────────────────────────────────────────────────────────
const PILLAR_ICONS: Record<ContentPillar, string> = {
  [ContentPillar.AWARD_WINNING]: 'fa-award',
  [ContentPillar.ALMOST_DIED]:   'fa-skull-crossbones',
  [ContentPillar.BREAKDOWN]:     'fa-microscope',
  [ContentPillar.SPOTLIGHT]:     'fa-user-secret',
  [ContentPillar.FAMOUS_IP]:     'fa-clapperboard',
  [ContentPillar.FAN_VOTING]:    'fa-comments',
};
const STATUS_CFG = {
  posted:    { label: 'Posted',    dot: 'bg-emerald-500', text: 'text-emerald-400', ring: 'bg-emerald-950/30', btn: 'bg-emerald-600 text-white' },
  scheduled: { label: 'Scheduled', dot: 'bg-[#C5A059]',  text: 'text-[#C5A059]',  ring: 'bg-[#C5A059]/10',  btn: 'bg-[#C5A059] text-black'  },
  draft:     { label: 'Draft',     dot: 'bg-zinc-600',   text: 'text-zinc-500',   ring: 'bg-zinc-900/30',   btn: 'bg-zinc-700 text-zinc-200' },
} as const;

// ─── ═══════════════════════════════════════════════════════════════════ ──────
//     VAULT TRAY  (right panel)
// ─── ═══════════════════════════════════════════════════════════════════ ──────
interface VaultTrayProps { assignedTitles: Set<string>; }

const VaultTray: React.FC<VaultTrayProps> = ({ assignedTitles }) => {
  const [search, setSearch]   = useState('');
  const [pillar, setPillar]   = useState<ContentPillar | 'all'>('all');

  const filtered = useMemo(() => ARCHIVE_CLIPS.filter(clip => {
    const q = search.toLowerCase();
    const mS = !q || clip.title.toLowerCase().includes(q) || clip.film.toLowerCase().includes(q) || clip.performer.toLowerCase().includes(q) || clip.tags.some(t => t.includes(q));
    const mP = pillar === 'all' || clip.pillar === pillar;
    return mS && mP;
  }), [search, pillar]);

  const handleDragStart = (e: React.DragEvent, clip: ArchiveClip) => {
    e.dataTransfer.setData('clipId', String(clip.id));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-72 flex-shrink-0 bg-[#030303] border-l border-zinc-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-zinc-900 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.35em]">Archive Vault</span>
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{filtered.length} clips</span>
        </div>
        {/* Search */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 text-[9px] pointer-events-none"></i>
          <input
            type="text"
            placeholder="Search archive..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 pl-8 pr-3 py-2.5 text-[10px] text-zinc-300 placeholder:text-zinc-700 focus:border-[#C5A059] outline-none transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition">
              <i className="fa-solid fa-xmark text-[9px]"></i>
            </button>
          )}
        </div>
        {/* Pillar filter */}
        <select
          value={pillar}
          onChange={e => setPillar(e.target.value as ContentPillar | 'all')}
          className="w-full bg-black border border-zinc-800 px-3 py-2 text-[9px] text-zinc-400 focus:border-[#C5A059] outline-none transition uppercase tracking-widest"
        >
          <option value="all">All Pillars</option>
          {Object.values(ContentPillar).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Draggable clip list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filtered.map(clip => {
          const ptc = PILLAR_TEXT_COLORS[clip.pillar];
          const isUsed = assignedTitles.has(clip.title);
          return (
            <div
              key={clip.id}
              draggable
              onDragStart={e => handleDragStart(e, clip)}
              title={`Drag to schedule: ${clip.title}`}
              className={`group border select-none transition duration-150 overflow-hidden ${
                isUsed
                  ? 'border-zinc-900/50 bg-zinc-950/30 cursor-grab active:cursor-grabbing opacity-50'
                  : 'border-zinc-900 bg-black cursor-grab active:cursor-grabbing hover:border-[#C5A059]/40 hover:bg-zinc-950'
              }`}
            >
              {/* Compact cinematic thumbnail strip */}
              <div className="h-12 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-black to-zinc-900"></div>
                <div className={`absolute inset-0 opacity-[0.1] group-hover:opacity-[0.2] transition-opacity duration-300 ${PILLAR_COLORS[clip.pillar]}`}></div>
                <i className={`fa-solid ${PILLAR_ICONS[clip.pillar]} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-white/[0.05]`}></i>
                <div className="absolute top-1.5 left-2 bg-black/80 px-1.5 py-0.5 text-[5.5px] font-black oswald text-[#C5A059] border border-[#C5A059]/20 uppercase tracking-widest">
                  VAULT
                </div>
                <div className="absolute top-1.5 right-2 bg-black/70 px-1.5 py-0.5 text-[5.5px] font-black text-zinc-600 border border-zinc-800/60">
                  {clip.year}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-1">
                  <p className="text-[5.5px] font-bold text-zinc-600 uppercase tracking-widest truncate">{clip.film}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start gap-2.5">
                  {/* Grip dots */}
                  <div className="grid grid-cols-2 gap-[3px] pt-1 flex-shrink-0 opacity-20 group-hover:opacity-60 transition">
                    {Array.from({length:6}).map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-zinc-400"></div>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-zinc-200 oswald italic uppercase leading-tight">{clip.title}</p>
                    <p className="text-[8px] text-zinc-600 mt-0.5 font-medium truncate">{clip.film} · {clip.year}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[7px] font-black uppercase tracking-wide ${ptc} flex items-center gap-1`}>
                        <i className={`fa-solid ${PILLAR_ICONS[clip.pillar]}`}></i>
                        {clip.pillar.split(' ').slice(0, 2).join(' ')}
                      </span>
                      <span className={`text-[7px] font-black uppercase tracking-widest transition ${isUsed ? 'text-zinc-600' : 'text-zinc-700 group-hover:text-[#C5A059]/60'}`}>
                        {isUsed ? 'USED' : 'DRAG'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <i className="fa-solid fa-film text-zinc-800 text-2xl mb-3 block"></i>
            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">No clips match</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 border-t border-zinc-900 flex-shrink-0 text-center">
        <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest leading-relaxed">
          <i className="fa-solid fa-hand-pointer mr-1 text-zinc-600"></i>
          Drag clips onto calendar cells
        </p>
      </div>
    </div>
  );
};

// ─── ═══════════════════════════════════════════════════════════════════ ──────
//     DETAIL PANEL  (left panel)
// ─── ═══════════════════════════════════════════════════════════════════ ──────
interface DetailPanelProps {
  selectedDay: number | null;
  posts: StuntPost[];
  comments: PostComment[];
  onStatusChange: (day: number, status: StuntPost['status']) => void;
  onAddComment: (day: number, text: string) => void;
  onClearDay: (day: number) => void;
  onGenerateHook?: (title: string, pillar: ContentPillar, context: string) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedDay, posts, comments, onStatusChange, onAddComment, onClearDay, onGenerateHook,
}) => {
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const post = selectedDay !== null ? posts.find(p => p.day === selectedDay) : null;
  const dayComments = useMemo(
    () => comments.filter(c => c.day === selectedDay).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [comments, selectedDay]
  );

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dayComments.length]);

  const handleAddComment = () => {
    if (!commentText.trim() || selectedDay === null) return;
    onAddComment(selectedDay, commentText.trim());
    setCommentText('');
  };

  const COMMENT_ICONS: Record<PostComment['type'], string> = {
    assign:        'fa-link',
    status_change: 'fa-arrow-right-arrow-left',
    clear:         'fa-trash',
    comment:       'fa-comment',
  };
  const COMMENT_COLORS: Record<PostComment['type'], string> = {
    assign:        'text-[#C5A059]',
    status_change: 'text-blue-400',
    clear:         'text-red-500',
    comment:       'text-zinc-500',
  };

  // ── Empty state ──
  if (selectedDay === null) {
    return (
      <div className="w-64 flex-shrink-0 bg-[#030303] border-r border-zinc-900 flex flex-col items-center justify-center p-8 gap-4 text-center">
        <div className="w-14 h-14 border border-dashed border-zinc-800 flex items-center justify-center">
          <i className="fa-regular fa-calendar text-zinc-700 text-xl"></i>
        </div>
        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed max-w-[10rem]">
          Click a day cell to view details and manage content
        </p>
      </div>
    );
  }

  // ── Day with no post ──
  if (!post) {
    return (
      <div className="w-64 flex-shrink-0 bg-[#030303] border-r border-zinc-900 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-900 flex-shrink-0">
          <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Day {selectedDay}</p>
          <p className="text-xs text-zinc-600 font-medium italic mt-1">No content scheduled</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-12 h-12 border-2 border-dashed border-zinc-800 flex items-center justify-center">
            <i className="fa-solid fa-film text-zinc-700 text-lg"></i>
          </div>
          <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed">
            Drag a clip from the Vault Tray onto Day {selectedDay} to schedule it
          </p>
        </div>
      </div>
    );
  }

  const sc = STATUS_CFG[post.status];

  // ── Populated day ──
  return (
    <div className="w-64 flex-shrink-0 bg-[#030303] border-r border-zinc-900 flex flex-col overflow-hidden">

      {/* Day header */}
      <div className="px-5 pt-5 pb-4 border-b border-zinc-900 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.3em]">Day {selectedDay}</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 ${sc.ring}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></div>
            <span className={`text-[7px] font-black uppercase tracking-widest ${sc.text}`}>{sc.label}</span>
          </div>
        </div>
        <h3 className="text-sm font-black oswald italic uppercase text-zinc-100 leading-tight line-clamp-2">{post.title}</h3>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Meta */}
        <div className="px-5 py-4 space-y-4 border-b border-zinc-900">
          {/* Pillar */}
          <div>
            <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Content Pillar</p>
            <div className={`flex items-center gap-2 ${PILLAR_TEXT_COLORS[post.pillar]}`}>
              <i className={`fa-solid ${PILLAR_ICONS[post.pillar]} text-xs`}></i>
              <span className="text-[9px] font-black uppercase tracking-wide">{post.pillar}</span>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Platforms</p>
            <div className="flex gap-3">
              {post.platform.includes('Instagram') && (
                <span className="text-[9px] font-black text-zinc-300 flex items-center gap-1.5">
                  <i className="fa-brands fa-instagram text-[#C5A059]"></i>Instagram
                </span>
              )}
              {post.platform.includes('TikTok') && (
                <span className="text-[9px] font-black text-zinc-300 flex items-center gap-1.5">
                  <i className="fa-brands fa-tiktok text-emerald-400"></i>TikTok
                </span>
              )}
            </div>
          </div>

          {/* Archive note */}
          {post.description && (
            <div>
              <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mb-1.5">Archive Note</p>
              <p className="text-[9px] text-zinc-500 leading-relaxed italic font-medium">{post.description}</p>
            </div>
          )}
        </div>

        {/* Status controls */}
        <div className="px-5 py-4 border-b border-zinc-900">
          <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mb-3">Approval Status</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(['draft', 'scheduled', 'posted'] as const).map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(selectedDay, s)}
                className={`py-2.5 text-[7px] font-black uppercase tracking-widest transition duration-200 ${
                  post.status === s ? STATUS_CFG[s].btn : 'border border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
              >
                {STATUS_CFG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 py-3 border-b border-zinc-900 flex gap-2">
          {onGenerateHook && (
            <button
              onClick={() => onGenerateHook(post.title, post.pillar, post.description || '')}
              className="flex-1 py-2.5 text-[8px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-[#C5A059]/50 hover:text-[#C5A059] transition flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-[8px]"></i>Hook
            </button>
          )}
          <button
            onClick={() => { onClearDay(selectedDay); }}
            className="flex-1 py-2.5 text-[8px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-600 hover:border-red-900 hover:text-red-500 transition flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-trash-can text-[8px]"></i>Clear
          </button>
        </div>

        {/* Add note */}
        <div className="px-5 py-4 border-b border-zinc-900 space-y-2.5">
          <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">Add Note</p>
          <textarea
            rows={2}
            placeholder="Approval notes, production details..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
            className="w-full bg-black border border-zinc-800 px-3 py-2.5 text-[9px] text-zinc-300 placeholder:text-zinc-700 focus:border-[#C5A059] outline-none transition resize-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim()}
            className="w-full py-2 text-[8px] font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition disabled:opacity-30"
          >
            Add Note
          </button>
        </div>

        {/* Activity history */}
        <div className="px-5 py-4">
          <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mb-3">
            Activity {dayComments.length > 0 && <span className="text-zinc-600">({dayComments.length})</span>}
          </p>
          {dayComments.length === 0 ? (
            <p className="text-[8px] text-zinc-700 italic font-medium">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {dayComments.map(c => (
                <div key={c.id} className="flex gap-2.5 items-start">
                  <i className={`fa-solid ${COMMENT_ICONS[c.type]} ${COMMENT_COLORS[c.type]} text-[8px] mt-0.5 flex-shrink-0`}></i>
                  <div className="min-w-0">
                    <p className="text-[8px] text-zinc-400 leading-relaxed font-medium">{c.text}</p>
                    <p className="text-[7px] text-zinc-700 mt-0.5 font-bold">
                      {new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' '}
                      {new Date(c.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ═══════════════════════════════════════════════════════════════════ ──────
//     CALENDAR CELL
// ─── ═══════════════════════════════════════════════════════════════════ ──────
interface CalendarCellProps {
  day: number;
  post?: StuntPost;
  isSelected: boolean;
  isDragOver: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const CalendarCell: React.FC<CalendarCellProps> = ({
  day, post, isSelected, isDragOver, onClick, onDragOver, onDragLeave, onDrop,
}) => {
  const sc  = post ? STATUS_CFG[post.status] : null;
  const ptc = post ? PILLAR_TEXT_COLORS[post.pillar] : null;
  const pillarBar = post ? PILLAR_COLORS[post.pillar] : null;

  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        'relative overflow-hidden transition-all duration-100 cursor-pointer',
        isSelected
          ? 'border-2 border-[#C5A059] ring-1 ring-[#C5A059]/30 z-10 shadow-[0_0_12px_rgba(197,160,89,0.25)]'
          : '',
        isDragOver
          ? 'border-2 border-dashed border-[#C5A059] bg-[#C5A059]/8 scale-[1.04] z-10 shadow-[0_0_16px_rgba(197,160,89,0.3)]'
          : '',
        !isSelected && !isDragOver && post
          ? 'border border-zinc-800 bg-[#0A0A0A] hover:border-zinc-600'
          : '',
        !isSelected && !isDragOver && !post
          ? 'border border-zinc-900 bg-black hover:border-zinc-700 hover:bg-zinc-950'
          : '',
      ].join(' ')}
      style={{ minHeight: 52 }}
    >
      {/* Pillar top-bar */}
      {post && !isDragOver && <div className={`absolute top-0 left-0 right-0 h-[2px] ${pillarBar}`}></div>}

      <div className="p-1.5 h-full flex flex-col gap-1 pt-2">
        {/* Day number + status dot */}
        <div className="flex items-start justify-between gap-0.5">
          <span className={`text-[8px] font-black oswald italic leading-none ${
            isDragOver ? 'text-[#C5A059]' : post ? ptc! : 'text-zinc-800'
          }`}>
            {day}
          </span>
          {post && !isDragOver && (
            <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 mt-0.5 ${sc!.dot}`}></div>
          )}
        </div>

        {/* Content */}
        {isDragOver ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[6px] font-black text-[#C5A059] uppercase tracking-widest animate-pulse">
              DROP HERE
            </span>
          </div>
        ) : post ? (
          <p className="text-[6.5px] font-bold text-zinc-500 leading-tight line-clamp-2 uppercase tracking-wide">
            {post.title}
          </p>
        ) : null}
      </div>
    </div>
  );
};

// ─── ═══════════════════════════════════════════════════════════════════ ──────
//     MAIN PLANNER
// ─── ═══════════════════════════════════════════════════════════════════ ──────
interface PlannerProps {
  onGenerateHook?: (title: string, pillar: ContentPillar, context: string) => void;
}

// Build the 364-day grid with 28-day month separators (13 months × 28 days = 364)
function buildGridRows(): (number | 'separator')[][] {
  const COLS = 7;
  const cells: number[] = Array.from({ length: 364 }, (_, i) => 364 - i);
  const rows: (number | 'separator')[][] = [];
  for (let i = 0; i < cells.length; i += COLS) {
    // Insert a month separator every 28 days (4 weeks)
    if (i > 0 && i % 28 === 0) {
      rows.push(['separator']);
    }
    rows.push(cells.slice(i, i + COLS));
  }
  return rows;
}

const GRID_ROWS = buildGridRows();
const PERIOD_LABELS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8', 'Period 9', 'Period 10', 'Period 11', 'Period 12', 'Period 13'];

const Planner: React.FC<PlannerProps> = ({ onGenerateHook }) => {
  const [posts, setPosts]         = useState<StuntPost[]>(loadPosts);
  const [comments, setComments]   = useState<PostComment[]>(loadComments);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [exportDone, setExportDone]   = useState(false);
  const periodRef = useRef(0);

  // Persist to localStorage
  useEffect(() => { savePosts(posts); },       [posts]);
  useEffect(() => { saveComments(comments); }, [comments]);

  const addComment = useCallback((day: number, text: string, type: PostComment['type'] = 'comment') => {
    setComments(prev => [...prev, mkComment(day, text, type)]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, day: number) => {
    e.preventDefault();
    const clipId = Number(e.dataTransfer.getData('clipId'));
    const clip = ARCHIVE_CLIPS.find(c => c.id === clipId);
    if (!clip) { setDragOverDay(null); return; }

    const newPost: StuntPost = {
      day,
      title: clip.title,
      pillar: clip.pillar,
      status: 'draft',
      platform: clip.platform,
      description: clip.description,
    };

    setPosts(prev => [...prev.filter(p => p.day !== day), newPost]);
    addComment(day, `Assigned "${clip.title}" (${clip.film}, ${clip.year}) from Archive Vault`, 'assign');
    setSelectedDay(day);
    setDragOverDay(null);
  }, [addComment]);

  const handleStatusChange = useCallback((day: number, status: StuntPost['status']) => {
    setPosts(prev => prev.map(p => p.day === day ? { ...p, status } : p));
    addComment(day, `Status updated → ${status}`, 'status_change');
  }, [addComment]);

  const handleClearDay = useCallback((day: number) => {
    const post = posts.find(p => p.day === day);
    if (post) addComment(day, `Cleared "${post.title}" from Day ${day}`, 'clear');
    setPosts(prev => prev.filter(p => p.day !== day));
  }, [posts, addComment]);

  const handleExport = () => {
    exportCSV(posts);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const assignedTitles = useMemo(() => new Set(posts.map(p => p.title)), [posts]);
  const counts = useMemo(() => ({
    posted:    posts.filter(p => p.status === 'posted').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    draft:     posts.filter(p => p.status === 'draft').length,
    total:     posts.length,
  }), [posts]);

  return (
    <div className="flex flex-col h-full animate-fadeIn">

      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-3.5 border-b border-zinc-900 bg-black flex-shrink-0">
        <div className="flex items-center gap-5">
          <h2 className="text-xl oswald font-black uppercase tracking-tight taurus-text-gold italic">The Grid</h2>
          <div className="h-4 w-px bg-zinc-800"></div>
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic hidden md:block">
            "One iconic moment. Every single day. No exceptions."
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status counts */}
          <div className="hidden md:flex items-center gap-3">
            {[
              { dot: 'bg-emerald-500', label: `${counts.posted} Posted` },
              { dot: 'bg-[#C5A059]',  label: `${counts.scheduled} Sched.` },
              { dot: 'bg-zinc-600',   label: `${counts.draft} Draft` },
              { dot: 'bg-zinc-800',   label: `${364 - counts.total} Open`, muted: true },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${s.muted ? 'text-zinc-700' : 'text-zinc-500'}`}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="h-4 w-px bg-zinc-800 hidden md:block"></div>
          <button
            onClick={handleExport}
            className="btn-taurus px-5 py-2 text-[9px] flex items-center gap-2"
          >
            {exportDone
              ? <><i className="fa-solid fa-check"></i>Exported</>
              : <><i className="fa-solid fa-file-csv"></i>Export CSV</>
            }
          </button>
        </div>
      </div>

      {/* ── Three Column Body ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Detail Panel */}
        <DetailPanel
          selectedDay={selectedDay}
          posts={posts}
          comments={comments}
          onStatusChange={handleStatusChange}
          onAddComment={addComment}
          onClearDay={handleClearDay}
          onGenerateHook={onGenerateHook}
        />

        {/* CENTER: 364-Day Calendar Grid */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-5">

          {/* Column headers (days of week within each 7-day chunk) */}
          <div className="grid grid-cols-7 gap-[3px] mb-1.5 sticky top-0 bg-zinc-950 pb-1.5 z-10">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-[7px] font-black text-zinc-700 uppercase tracking-widest py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar rows */}
          {(() => {
            let separatorIdx = -1;
            return GRID_ROWS.map((row, rowIdx) => {
              if (row[0] === 'separator') {
                separatorIdx++;
                const pIdx = separatorIdx;
                return (
                  <div key={`sep-${rowIdx}`} className="flex items-center gap-3 my-2">
                    <div className="h-px flex-1 bg-zinc-900"></div>
                    <span className="text-[7px] font-black text-zinc-700 uppercase tracking-[0.3em] flex-shrink-0">
                      {PERIOD_LABELS[pIdx + 1] ?? ''}
                    </span>
                    <div className="h-px flex-1 bg-zinc-900"></div>
                  </div>
                );
              }
              const days = row as number[];
              return (
                <div key={`row-${rowIdx}`} className="grid grid-cols-7 gap-[3px] mb-[3px]">
                  {days.map(day => (
                    <CalendarCell
                      key={day}
                      day={day}
                      post={posts.find(p => p.day === day)}
                      isSelected={selectedDay === day}
                      isDragOver={dragOverDay === day}
                      onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                      onDragOver={e => { e.preventDefault(); setDragOverDay(day); }}
                      onDragLeave={e => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverDay(d => d === day ? null : d);
                        }
                      }}
                      onDrop={e => handleDrop(e, day)}
                    />
                  ))}
                  {/* Pad incomplete last row */}
                  {days.length < 7 && Array.from({ length: 7 - days.length }).map((_, i) => (
                    <div key={`pad-${i}`} className="border border-zinc-900/30 bg-black/20" style={{ minHeight: 52 }}></div>
                  ))}
                </div>
              );
            });
          })()}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-zinc-900 text-center">
            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">
              <span className="text-zinc-500">{counts.total}</span> / 364 days assigned
              &nbsp;·&nbsp;
              <span className="text-zinc-600">{364 - counts.total}</span> open
            </p>
          </div>
        </div>

        {/* RIGHT: Vault Tray */}
        <VaultTray assignedTitles={assignedTitles} />
      </div>
    </div>
  );
};

export default Planner;
