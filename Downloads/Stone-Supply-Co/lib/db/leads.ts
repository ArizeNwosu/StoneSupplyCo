import { createPublicClient } from "@/lib/supabase";

export type LeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  project_type?: string;
  location?: string;
  square_feet?: number;
  timeline?: string;
  fabricator_status?: string;
  customer_type?: string;
  preferred_materials?: string[];
  saved_material_ids?: string[];
  ai_preferences?: Record<string, unknown>;
  notes?: string;
  source: "stone-finder" | "availability-request" | "trade-application" | "contact";
  material_slug?: string;
};

export async function createLead(input: LeadInput): Promise<{ id: string }> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("leads")
    .insert(input)
    .select("id")
    .single();

  if (error) throw new Error(`createLead: ${error.message}`);
  return { id: data.id };
}
