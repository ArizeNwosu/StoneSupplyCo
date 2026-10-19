import { Header } from "@/components/Header";

export default function MaterialsLoading() {
  return (
    <>
      <Header solid />
      <main>
        <div className="materials-hero">
          <div className="skeleton" style={{ width: "8rem", height: "0.75rem", borderRadius: 4, marginBottom: "1rem" }} />
          <div className="skeleton" style={{ width: "18rem", height: "3rem", borderRadius: 4, marginBottom: "1rem" }} />
          <div className="skeleton" style={{ width: "28rem", maxWidth: "100%", height: "1rem", borderRadius: 4 }} />
        </div>
        <div className="material-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "4/3", borderRadius: "var(--radius-card)" }} />
          ))}
        </div>
      </main>
    </>
  );
}
