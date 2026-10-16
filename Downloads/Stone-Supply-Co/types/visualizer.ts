// types/visualizer.ts

export type RoomType = "kitchen" | "bathroom";

export type KitchenSurface = "countertop" | "island" | "backsplash";
export type BathroomSurface = "vanity_top" | "shower_walls" | "all_walls" | "floors";
export type Surface = KitchenSurface | BathroomSurface;

export type SurfaceOption = {
  value: Surface;
  label: string;
};

export const ROOM_SURFACES: Record<RoomType, SurfaceOption[]> = {
  kitchen: [
    { value: "countertop", label: "Countertop" },
    { value: "island", label: "Island" },
    { value: "backsplash", label: "Backsplash" },
  ],
  bathroom: [
    { value: "vanity_top", label: "Vanity Top" },
    { value: "shower_walls", label: "Shower Walls" },
    { value: "all_walls", label: "All Bathroom Walls" },
    { value: "floors", label: "Floors" },
  ],
};

export type SurfaceSelection = {
  surface: Surface;
  material_slug: string;
  material_name: string;
  waterfall?: boolean; // only for "island"
};

export type VisualizerSession = {
  id: string;
  photo_url: string;
  room_type: RoomType;
  render_count: number;
  lead_captured: boolean;
  created_at: string;
};

export type VisualizerRender = {
  id: string;
  session_id: string;
  render_url: string;
  surfaces: SurfaceSelection[];
  share_token: string;
  created_at: string;
};

export type VisualizerLead = {
  id: string;
  session_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
};

export const MAX_RENDERS_SELF_SERVE = 5;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTO_WIDTH = 1600;
