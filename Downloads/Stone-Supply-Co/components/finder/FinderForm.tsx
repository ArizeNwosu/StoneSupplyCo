"use client";

import { useState } from "react";
import type { FinderInput } from "@/lib/gemini";

const PROJECT_TYPES = [
  "Kitchen countertop",
  "Bathroom vanity",
  "Waterfall island",
  "Fireplace surround",
  "Floor tile",
  "Shower walls",
  "Outdoor kitchen",
  "Bar top",
];

const STYLES = ["Modern", "Minimalist", "Transitional", "Traditional", "Organic"];
const MATERIAL_TYPES = ["Quartzite", "Marble", "Granite", "Quartz", "Onyx"];
const MOVEMENTS = [
  { value: "quiet", label: "Quiet — solid or very minimal veining" },
  { value: "subtle", label: "Subtle — soft wisps of movement" },
  { value: "moderate", label: "Moderate — clearly veined, not overpowering" },
  { value: "bold", label: "Bold — dramatic veining is the point" },
  { value: "dramatic", label: "Dramatic — bookmatched, exotic, statement piece" },
] as const;

type Props = {
  onSubmit: (input: FinderInput) => void;
  loading: boolean;
};

export function FinderForm({ onSubmit, loading }: Props) {
  const [naturalLanguage, setNaturalLanguage] = useState("");
  const [projectType, setProjectType] = useState("");
  const [style, setStyle] = useState("");
  const [movement, setMovement] =
    useState<FinderInput["movement"]>(undefined);
  const [cabinetColor, setCabinetColor] = useState("");
  const [floorColor, setFloorColor] = useState("");
  const [wallColor, setWallColor] = useState("");
  const [desiredColor, setDesiredColor] = useState("");
  const [materialPreference, setMaterialPreference] = useState<string[]>([]);
  const [budgetMax, setBudgetMax] = useState("");
  const [mode, setMode] = useState<"quick" | "detailed">("quick");

  const toggleMaterial = (mat: string) => {
    setMaterialPreference((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: FinderInput = {
      naturalLanguage: naturalLanguage.trim() || undefined,
      projectType: projectType || undefined,
      style: style || undefined,
      movement: movement || undefined,
      cabinetColor: cabinetColor.trim() || undefined,
      floorColor: floorColor.trim() || undefined,
      wallColor: wallColor.trim() || undefined,
      desiredColor: desiredColor.trim() || undefined,
      materialPreference:
        materialPreference.length > 0 ? materialPreference : undefined,
      budget: budgetMax ? { max: Number(budgetMax) } : undefined,
    };

    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        <button
          type="button"
          className={`chip ${mode === "quick" ? "is-active" : ""}`}
          onClick={() => setMode("quick")}
        >
          Quick description
        </button>
        <button
          type="button"
          className={`chip ${mode === "detailed" ? "is-active" : ""}`}
          onClick={() => setMode("detailed")}
        >
          Detailed options
        </button>
      </div>

      {mode === "quick" ? (
        <div className="finder-field finder-field-full" style={{ maxWidth: "52rem" }}>
          <label htmlFor="natural-language">
            Describe your project in your own words
          </label>
          <textarea
            id="natural-language"
            value={naturalLanguage}
            onChange={(e) => setNaturalLanguage(e.target.value)}
            placeholder="E.g. &ldquo;I have white cabinets and light oak floors. Looking for a marble-look stone for the kitchen island with some movement but not too crazy. Budget around $4,000 per slab.&rdquo;"
            rows={4}
            style={{ resize: "vertical", minHeight: "7rem" }}
          />
        </div>
      ) : (
        <div className="finder-form">
          <div className="finder-field">
            <label htmlFor="project-type">Project type</label>
            <select
              id="project-type"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
            >
              <option value="">Select…</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="finder-field">
            <label htmlFor="style">Design style</label>
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="">Select…</option>
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="finder-field">
            <label htmlFor="desired-color">Desired stone color</label>
            <input
              id="desired-color"
              type="text"
              value={desiredColor}
              onChange={(e) => setDesiredColor(e.target.value)}
              placeholder="e.g. warm white, soft grey"
            />
          </div>

          <div className="finder-field">
            <label htmlFor="cabinet-color">Cabinet color</label>
            <input
              id="cabinet-color"
              type="text"
              value={cabinetColor}
              onChange={(e) => setCabinetColor(e.target.value)}
              placeholder="e.g. white, navy, natural wood"
            />
          </div>

          <div className="finder-field">
            <label htmlFor="floor-color">Floor color</label>
            <input
              id="floor-color"
              type="text"
              value={floorColor}
              onChange={(e) => setFloorColor(e.target.value)}
              placeholder="e.g. light oak, dark tile"
            />
          </div>

          <div className="finder-field">
            <label htmlFor="wall-color">Wall color</label>
            <input
              id="wall-color"
              type="text"
              value={wallColor}
              onChange={(e) => setWallColor(e.target.value)}
              placeholder="e.g. greige, off-white"
            />
          </div>

          <div className="finder-field">
            <label htmlFor="budget-max">Max budget per slab ($)</label>
            <input
              id="budget-max"
              type="text"
              inputMode="numeric"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 5000"
            />
          </div>

          <div className="finder-field finder-field-full">
            <label>Stone movement preference</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
              {MOVEMENTS.map((m) => (
                <label
                  key={m.value}
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.88rem" }}
                >
                  <input
                    type="radio"
                    name="movement"
                    value={m.value}
                    checked={movement === m.value}
                    onChange={() => setMovement(m.value)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div className="finder-field finder-field-full">
            <label>Material preference (optional)</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
              {MATERIAL_TYPES.map((mat) => (
                <button
                  key={mat}
                  type="button"
                  className={`chip ${materialPreference.includes(mat) ? "is-active" : ""}`}
                  onClick={() => toggleMaterial(mat)}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <button
          type="submit"
          className="button button-ink"
          disabled={loading}
        >
          {loading ? "Finding your stones…" : "Find my stone"}
        </button>
      </div>
    </form>
  );
}
