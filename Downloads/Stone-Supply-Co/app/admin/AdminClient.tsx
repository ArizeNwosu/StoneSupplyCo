"use client";

import { useState, useEffect, useCallback } from "react";
import type { Material, MaterialSummary } from "@/types/material";

type Lead = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  source: string;
  customer_type?: string;
  notes?: string;
  created_at: string;
};

type Tab = "materials" | "leads";

function useAdminToken() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("admin_token") ?? "";
    setToken(t);
    setSaved(!!t);
  }, []);

  const saveToken = (t: string) => {
    sessionStorage.setItem("admin_token", t);
    setToken(t);
    setSaved(true);
  };

  return { token, saved, saveToken };
}

function TokenGate({ onSave }: { onSave: (t: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-warm)" }}>
      <div style={{ background: "var(--color-white)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", padding: "2.5rem", width: "min(90vw, 24rem)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 400, margin: "0 0 1.5rem", letterSpacing: "-0.02em" }}>
          Admin panel
        </p>
        <input
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="ADMIN_SECRET"
          onKeyDown={(e) => e.key === "Enter" && val && onSave(val)}
          style={{ width: "100%", padding: "0.6rem 0.9rem", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", marginBottom: "0.75rem", fontFamily: "var(--font-sans)", fontSize: "0.9rem", background: "var(--color-paper)", color: "var(--color-ink)", boxSizing: "border-box" }}
        />
        <button onClick={() => val && onSave(val)} className="button button-ink" style={{ width: "100%" }}>
          Enter
        </button>
      </div>
    </div>
  );
}

function AvailBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    available: { bg: "#e6f2eb", color: "#2d6640" },
    low: { bg: "#fef3e2", color: "#805400" },
    unavailable: { bg: "#fce8e8", color: "#8c2424" },
  };
  const s = styles[status] ?? { bg: "#eee", color: "#444" };
  return (
    <span style={{ ...s, padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
      {status}
    </span>
  );
}

export function AdminClient() {
  const { token, saved, saveToken } = useAdminToken();
  const [tab, setTab] = useState<Tab>("materials");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Material>>({});
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/materials", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMaterials(data.materials ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/leads", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeads(data.leads ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!saved) return;
    if (tab === "materials") loadMaterials();
    else loadLeads();
  }, [saved, tab, loadMaterials, loadLeads]);

  const startEdit = (mat: Material) => {
    setEditingSlug(mat.slug);
    setEditFields({
      availability: mat.availability,
      quantity: mat.quantity,
      price: mat.price ?? undefined,
      featured: mat.featured,
      new_arrival: mat.new_arrival,
      clearance: mat.clearance,
      clearance_price: mat.clearance_price ?? undefined,
    });
  };

  const saveEdit = async (slug: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/materials/${slug}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(editFields),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setEditingSlug(null);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMaterial = async (slug: string) => {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/materials/${slug}`, { method: "DELETE", headers });
      if (!res.ok && res.status !== 204) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setMaterials((prev) => prev.filter((m) => m.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  if (!saved) return <TokenGate onSave={saveToken} />;

  const TAB_STYLE = (active: boolean) => ({
    padding: "0.5rem 1.25rem",
    background: active ? "var(--color-ink)" : "transparent",
    color: active ? "var(--color-white)" : "var(--color-ink)",
    border: "1px solid var(--color-ink)",
    borderRadius: "var(--radius-card)",
    cursor: "pointer",
    fontSize: "0.82rem",
    letterSpacing: "0.04em",
    fontFamily: "var(--font-sans)",
  });

  return (
    <div className="admin-wrap">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 500, margin: "0 0 2rem", letterSpacing: "-0.02em" }}>
          Admin
        </p>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button onClick={() => setTab("materials")} style={TAB_STYLE(tab === "materials")}>Materials</button>
          <button onClick={() => setTab("leads")} style={TAB_STYLE(tab === "leads")}>Leads</button>
        </nav>
        <p style={{ marginTop: "auto", paddingTop: "2rem", fontSize: "0.75rem", color: "var(--color-stone-dark)" }}>
          Token in session only.{" "}
          <button onClick={() => { sessionStorage.removeItem("admin_token"); window.location.reload(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-bronze-ink)", fontSize: "0.75rem", padding: 0 }}>
            Sign out
          </button>
        </p>
      </aside>

      {/* Main */}
      <main className="admin-grid">
        {error && (
          <p style={{ gridColumn: "1/-1", color: "var(--color-error)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
            {error}
          </p>
        )}

        {tab === "materials" && (
          <>
            <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, letterSpacing: "-0.03em", margin: 0 }}>
                Materials ({materials.length})
              </h1>
              <button onClick={loadMaterials} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--color-stone-dark)" }}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="skeleton" style={{ gridColumn: "1/-1", height: "12rem", borderRadius: "var(--radius-card)" }} />
            ) : (
              <div style={{ gridColumn: "1/-1", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-line)", textAlign: "left" }}>
                      {["Name", "Type", "Availability", "Qty", "Price", "Flags", ""].map((h) => (
                        <th key={h} style={{ padding: "0.5rem 0.75rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "0.72rem", color: "var(--color-stone-dark)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((mat) => (
                      <>
                        <tr key={mat.slug} style={{ borderBottom: "1px solid var(--color-line)" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <a href={`/materials/${mat.slug}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-ink)", fontWeight: 500 }}>{mat.name}</a>
                            <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "var(--color-stone-dark)" }}>{mat.slug}</p>
                          </td>
                          <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>{mat.material_type}</td>
                          <td style={{ padding: "0.75rem" }}><AvailBadge status={mat.availability} /></td>
                          <td style={{ padding: "0.75rem" }}>{mat.quantity}</td>
                          <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>{mat.price ? `$${mat.price.toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "0.75rem", fontSize: "0.72rem", color: "var(--color-stone-dark)", whiteSpace: "nowrap" }}>
                            {[mat.featured && "featured", mat.new_arrival && "new", mat.clearance && "clearance"].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                            <button onClick={() => editingSlug === mat.slug ? setEditingSlug(null) : startEdit(mat)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-bronze-ink)", fontSize: "0.78rem" }}>
                              {editingSlug === mat.slug ? "Cancel" : "Edit"}
                            </button>
                            {" · "}
                            <button onClick={() => deleteMaterial(mat.slug)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-error)", fontSize: "0.78rem" }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                        {editingSlug === mat.slug && (
                          <tr key={`${mat.slug}-edit`} style={{ background: "var(--color-paper)", borderBottom: "1px solid var(--color-line)" }}>
                            <td colSpan={7} style={{ padding: "1rem 0.75rem" }}>
                              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                                <div className="finder-field" style={{ minWidth: "10rem", flex: 1 }}>
                                  <label>Availability</label>
                                  <select value={editFields.availability} onChange={(e) => setEditFields((p) => ({ ...p, availability: e.target.value as Material["availability"] }))}>
                                    <option value="available">Available</option>
                                    <option value="low">Low stock</option>
                                    <option value="unavailable">Unavailable</option>
                                  </select>
                                </div>
                                <div className="finder-field" style={{ minWidth: "6rem" }}>
                                  <label>Quantity</label>
                                  <input type="number" min={0} value={editFields.quantity ?? ""} onChange={(e) => setEditFields((p) => ({ ...p, quantity: parseInt(e.target.value, 10) || 0 }))} />
                                </div>
                                <div className="finder-field" style={{ minWidth: "8rem" }}>
                                  <label>Price/sf</label>
                                  <input type="number" min={0} step={0.01} value={editFields.price ?? ""} onChange={(e) => setEditFields((p) => ({ ...p, price: parseFloat(e.target.value) || null }))} />
                                </div>
                                <div className="finder-field" style={{ minWidth: "8rem" }}>
                                  <label>Clearance price</label>
                                  <input type="number" min={0} step={0.01} value={editFields.clearance_price ?? ""} onChange={(e) => setEditFields((p) => ({ ...p, clearance_price: parseFloat(e.target.value) || null }))} />
                                </div>
                                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", paddingBottom: "0.25rem" }}>
                                  {(["featured", "new_arrival", "clearance"] as const).map((flag) => (
                                    <label key={flag} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", cursor: "pointer" }}>
                                      <input type="checkbox" checked={!!editFields[flag]} onChange={(e) => setEditFields((p) => ({ ...p, [flag]: e.target.checked }))} />
                                      {flag.replace("_", " ")}
                                    </label>
                                  ))}
                                </div>
                                <button onClick={() => saveEdit(mat.slug)} className="button button-ink" disabled={saving} style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>
                                  {saving ? "Saving…" : "Save"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "leads" && (
          <>
            <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 400, letterSpacing: "-0.03em", margin: 0 }}>
                Leads ({leads.length})
              </h1>
              <button onClick={loadLeads} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--color-stone-dark)" }}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="skeleton" style={{ gridColumn: "1/-1", height: "12rem", borderRadius: "var(--radius-card)" }} />
            ) : (
              <div style={{ gridColumn: "1/-1", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-line)", textAlign: "left" }}>
                      {["Date", "Name", "Email", "Phone", "Source", "Type", "Notes"].map((h) => (
                        <th key={h} style={{ padding: "0.5rem 0.75rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "0.72rem", color: "var(--color-stone-dark)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                        <td style={{ padding: "0.75rem", whiteSpace: "nowrap", color: "var(--color-stone-dark)", fontSize: "0.75rem" }}>
                          {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td style={{ padding: "0.75rem", fontWeight: 500 }}>{lead.name ?? "—"}</td>
                        <td style={{ padding: "0.75rem" }}>
                          {lead.email ? <a href={`mailto:${lead.email}`} style={{ color: "var(--color-bronze-ink)" }}>{lead.email}</a> : "—"}
                        </td>
                        <td style={{ padding: "0.75rem", whiteSpace: "nowrap" }}>
                          {lead.phone ? <a href={`tel:${lead.phone}`} style={{ color: "var(--color-bronze-ink)" }}>{lead.phone}</a> : "—"}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", background: "var(--color-warm)", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                            {lead.source}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", fontSize: "0.78rem", color: "var(--color-stone-dark)" }}>{lead.customer_type ?? "—"}</td>
                        <td style={{ padding: "0.75rem", maxWidth: "16rem", fontSize: "0.78rem", color: "var(--color-stone-dark)" }}>
                          {lead.notes ? lead.notes.slice(0, 80) + (lead.notes.length > 80 ? "…" : "") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
