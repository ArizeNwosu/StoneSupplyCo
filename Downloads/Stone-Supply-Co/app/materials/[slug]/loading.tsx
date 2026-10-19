import { Header } from "@/components/Header";

export default function MaterialDetailLoading() {
  return (
    <>
      <Header solid />
      <main className="material-detail-wrap">
        <div className="material-detail">
          {/* Image gallery skeleton */}
          <div className="skeleton" style={{ width: "100%", aspectRatio: "4/3", borderRadius: "var(--radius-card)" }} />

          {/* Info skeleton */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div className="skeleton" style={{ width: "5rem", height: "1.4rem", borderRadius: 999 }} />
            <div className="skeleton" style={{ width: "70%", height: "2.5rem", borderRadius: 4 }} />
            <div className="skeleton" style={{ width: "40%", height: "1rem", borderRadius: 4 }} />
            <div className="skeleton" style={{ width: "100%", height: "5rem", borderRadius: 4 }} />
            <div className="skeleton" style={{ width: "8rem", height: "2.75rem", borderRadius: "var(--radius-card)" }} />
          </div>
        </div>
      </main>
    </>
  );
}
