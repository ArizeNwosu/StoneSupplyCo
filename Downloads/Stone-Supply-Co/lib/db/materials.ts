import { createPublicClient } from "@/lib/supabase";
import type { Material, MaterialSummary, MaterialType } from "@/types/material";

export type MaterialFilters = {
  type?: MaterialType;
  colorFamily?: string;
  finish?: string;
  availability?: "available" | "low";
  featured?: boolean;
  clearance?: boolean;
  newArrival?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function getMaterials(
  filters: MaterialFilters = {}
): Promise<MaterialSummary[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from("materials")
    .select(
      "id,slug,name,material_type,color_family,finish,availability,quantity,price,clearance_price,image_urls,featured,new_arrival,clearance,tags"
    )
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("material_type", filters.type);
  if (filters.colorFamily) query = query.eq("color_family", filters.colorFamily);
  if (filters.finish) query = query.eq("finish", filters.finish);
  if (filters.availability) query = query.eq("availability", filters.availability);
  if (filters.featured) query = query.eq("featured", true);
  if (filters.clearance) query = query.eq("clearance", true);
  if (filters.newArrival) query = query.eq("new_arrival", true);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,tags.cs.{${filters.search}}`
    );
  }

  const limit = filters.limit ?? 48;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(`getMaterials: ${error.message}`);
  return (data ?? []) as MaterialSummary[];
}

export async function getMaterial(slug: string): Promise<Material | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`getMaterial: ${error.message}`);
  }
  return data as Material;
}

export async function getMaterialSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("materials")
    .select("slug")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getMaterialSlugs: ${error.message}`);
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function getRelatedMaterials(
  material: Material,
  limit = 3
): Promise<MaterialSummary[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("materials")
    .select(
      "id,slug,name,material_type,color_family,finish,availability,quantity,price,clearance_price,image_urls,featured,new_arrival,clearance,tags"
    )
    .eq("material_type", material.material_type)
    .neq("slug", material.slug)
    .limit(limit);

  if (error) throw new Error(`getRelatedMaterials: ${error.message}`);
  return (data ?? []) as MaterialSummary[];
}
