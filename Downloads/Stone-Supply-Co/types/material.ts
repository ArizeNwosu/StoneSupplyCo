export type MaterialType =
  | "Quartzite"
  | "Marble"
  | "Granite"
  | "Quartz"
  | "Onyx"
  | "Other";

export type ColorFamily =
  | "White"
  | "Cream"
  | "Grey"
  | "Black"
  | "Brown"
  | "Green"
  | "Blue"
  | "Multi";

export type Availability = "available" | "low" | "unavailable";

export type Material = {
  id: string;
  slug: string;
  name: string;
  material_type: MaterialType;
  color_family: ColorFamily | null;
  primary_color: string | null;
  secondary_colors: string[];
  finish: string;
  origin: string | null;
  description: string | null;
  dimensions: string | null;
  thickness: string | null;
  quantity: number;
  availability: Availability;
  price: number | null;
  clearance_price: number | null;
  applications: string[];
  image_urls: string[];
  featured: boolean;
  new_arrival: boolean;
  clearance: boolean;
  bookmatch_available: boolean;
  recommended_styles: string[];
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  instagram_caption: string | null;
  google_caption: string | null;
  pinterest_caption: string | null;
  email_snippet: string | null;
  created_at: string;
  updated_at: string;
};

export type MaterialSummary = Pick<
  Material,
  | "id"
  | "slug"
  | "name"
  | "material_type"
  | "color_family"
  | "finish"
  | "availability"
  | "quantity"
  | "price"
  | "clearance_price"
  | "image_urls"
  | "featured"
  | "new_arrival"
  | "clearance"
  | "tags"
>;
