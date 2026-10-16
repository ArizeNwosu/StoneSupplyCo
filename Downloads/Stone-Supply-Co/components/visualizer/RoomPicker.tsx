"use client";

import type { RoomType } from "@/types/visualizer";

type Props = {
  value: RoomType | null;
  onChange: (room: RoomType) => void;
};

const ROOMS: { value: RoomType; label: string; description: string }[] = [
  { value: "kitchen", label: "Kitchen", description: "Countertops, islands, backsplashes" },
  { value: "bathroom", label: "Bathroom", description: "Vanity tops, shower walls, floors" },
];

export function RoomPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {ROOMS.map((room) => (
        <button
          key={room.value}
          type="button"
          onClick={() => onChange(room.value)}
          style={{
            flex: "1 1 200px",
            padding: "1.25rem 1rem",
            borderRadius: "var(--radius-card)",
            border: "2px solid",
            borderColor: value === room.value ? "var(--color-ink)" : "var(--color-line)",
            background: value === room.value ? "var(--color-ink)" : "var(--color-white)",
            color: value === room.value ? "var(--color-white)" : "var(--color-ink)",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.15s",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem" }}>{room.label}</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", opacity: 0.8 }}>{room.description}</p>
        </button>
      ))}
    </div>
  );
}
