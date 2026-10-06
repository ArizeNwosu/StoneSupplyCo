'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';

export function ReplyInbox({ data, reload }: { data: any; reload: () => void }) {
  const [saving, setSaving] = useState<string | null>(null);
  const update = async (id: string, patch: object) => { setSaving(id); await fetch(`/api/admin/replies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }); setSaving(null); reload(); };
  if (!data?.replies?.length) return <p className="rounded-xl border border-white/10 p-8 text-center text-slate-400">No replies match this filter.</p>;
  return <div className="space-y-3">{data.replies.map((reply: any) => <article key={reply.id} className="rounded-xl border border-white/10 bg-white/[.03] p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold">{reply.senderEmail}</p><p className="text-xs text-slate-500">{reply.campaign} · {new Date(reply.receivedAt).toLocaleString()}</p></div><a href={`mailto:${encodeURIComponent(reply.senderEmail)}?subject=${encodeURIComponent(`Re: ${reply.subject}`)}`} className="text-sm font-bold text-cyan-400">Reply by email ↗</a></div><p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-200">{reply.bodyText}</p><div className="mt-4 flex flex-wrap gap-2"><select aria-label="Reply classification" value={reply.classification ?? ''} onChange={(e) => update(reply.id, { classification: e.target.value })} className="rounded-lg bg-slate-800 p-2 text-sm"><option value="" disabled>Classify</option>{['PRICE','TRUST','VALUE','TECHNICAL','CHANGED_MIND','INTERESTED','OTHER'].map((v) => <option key={v}>{v}</option>)}</select>{['NEEDS_RESPONSE','RESPONDED','RESOLVED'].map((status) => <button disabled={saving === reply.id} key={status} onClick={() => update(reply.id, { adminStatus: status })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${reply.adminStatus === status ? 'bg-cyan-500' : 'border border-white/10'}`}>{status.replaceAll('_',' ')}</button>)}</div></article>)}</div>;
}
