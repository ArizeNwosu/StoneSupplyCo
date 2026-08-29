"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const MATERIAL_TYPES = [
  "Quartzite",
  "Marble",
  "Granite",
  "Quartz",
  "Onyx",
  "Other",
] as const;

const COLOR_FAMILIES = [
  "White",
  "Cream",
  "Grey",
  "Black",
  "Brown",
  "Green",
  "Blue",
  "Multi",
] as const;

const FINISHES = ["Polished", "Honed", "Leathered", "Brushed"] as const;

type Props = {
  totalCount: number;
};

export function MaterialFilters({ totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeType = searchParams.get("type") ?? "";
  const activeColor = searchParams.get("color") ?? "";
  const activeFinish = searchParams.get("finish") ?? "";
  const activeClearance = searchParams.get("clearance") === "true";
  const activeNew = searchParams.get("new") === "true";

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("offset"); // reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const toggleFilter = useCallback(
    (key: string, currentValue: boolean) => {
      updateFilter(key, currentValue ? null : "true");
    },
    [updateFilter]
  );

  return (
    <div className="filter-strip">
      <div className="filter-strip-inner">
        {/* Type filters */}
        <button
          className={`chip ${!activeType ? "is-active" : ""}`}
          onClick={() => updateFilter("type", null)}
        >
          All
        </button>
        {MATERIAL_TYPES.map((type) => (
          <button
            key={type}
            className={`chip ${activeType === type ? "is-active" : ""}`}
            onClick={() =>
              updateFilter("type", activeType === type ? null : type)
            }
          >
            {type}
          </button>
        ))}

        <span className="filter-sep" aria-hidden />

        {/* Color filters */}
        {COLOR_FAMILIES.map((color) => (
          <button
            key={color}
            className={`chip ${activeColor === color ? "is-active" : ""}`}
            onClick={() =>
              updateFilter("color", activeColor === color ? null : color)
            }
          >
            {color}
          </button>
        ))}

        <span className="filter-sep" aria-hidden />

        {/* Finish filters */}
        {FINISHES.map((finish) => (
          <button
            key={finish}
            className={`chip ${activeFinish === finish ? "is-active" : ""}`}
            onClick={() =>
              updateFilter("finish", activeFinish === finish ? null : finish)
            }
          >
            {finish}
          </button>
        ))}

        <span className="filter-sep" aria-hidden />

        {/* Special filters */}
        <button
          className={`chip ${activeNew ? "is-active" : ""}`}
          onClick={() => toggleFilter("new", activeNew)}
        >
          New arrivals
        </button>
        <button
          className={`chip ${activeClearance ? "is-active" : ""}`}
          onClick={() => toggleFilter("clearance", activeClearance)}
        >
          Clearance
        </button>

        <span className="filter-count">{totalCount} slabs</span>
      </div>
    </div>
  );
}
