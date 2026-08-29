const photoRoot =
  "https://xjrlmcqlaqnktllvvaci.supabase.co/storage/v1/object/public/listing-photos/0401c957-c990-4ed3-aa86-e3dc94e0dfb7";

export type InventoryFeature = {
  name: string;
  material: "Quartz";
  finish: string;
  size: string;
  thickness: string;
  price: number;
  available: number;
  image: string;
  alt: string;
};

export const featuredInventory: InventoryFeature[] = [
  {
    name: "Emperador",
    material: "Quartz",
    finish: "Polished",
    size: '119" × 55"',
    thickness: "2 cm",
    price: 299,
    available: 7,
    image: `${photoRoot}/0a737898-8b1d-44ad-a336-f469a3fcc9d1.webp`,
    alt: "Full Emperador quartz slab displayed at Stone Supply Co in Northridge",
  },
  {
    name: "Charcoal Soapstone",
    material: "Quartz",
    finish: "Suede",
    size: '128" × 63"',
    thickness: "2 cm",
    price: 300,
    available: 3,
    image: `${photoRoot}/e1f95870-e1ac-4fc4-a036-9b7b7cbf434a.webp`,
    alt: "Full charcoal soapstone-look quartz slab in a suede finish",
  },
  {
    name: "Metropolis Oyster",
    material: "Quartz",
    finish: "Polished",
    size: '126" × 61"',
    thickness: "2 cm",
    price: 299,
    available: 12,
    image: `${photoRoot}/692fa626-5cd2-4309-991e-223b76ce87c5.webp`,
    alt: "Full light oyster quartz slab displayed against the slab yard",
  },
  {
    name: "Pietra Grey",
    material: "Quartz",
    finish: "Polished",
    size: '126" × 63"',
    thickness: "2 cm",
    price: 300,
    available: 15,
    image: `${photoRoot}/ceb0e467-ecc9-4fcd-b813-858c3f30c2a4.webp`,
    alt: "Full Pietra Grey quartz slab with fine white veining",
  },
  {
    name: "Carrara Jumbo",
    material: "Quartz",
    finish: "Brushed",
    size: '130" × 65"',
    thickness: "2 cm",
    price: 299,
    available: 21,
    image: `${photoRoot}/80535407-b1ec-42cc-9546-0f2cafb13dd1.webp`,
    alt: "Full Carrara-style jumbo quartz slab in a brushed finish",
  },
  {
    name: "Terrazzo Cinder",
    material: "Quartz",
    finish: "Honed",
    size: '120" × 55"',
    thickness: "2 cm",
    price: 300,
    available: 22,
    image: `${photoRoot}/690ab61d-eb8f-4260-a951-a9acc7a92694.webp`,
    alt: "Full dark gray terrazzo-pattern quartz slab in a honed finish",
  },
];

export const finishOptions = [
  "Polished",
  "Honed",
  "Brushed",
  "Matte",
  "Suede",
  "Leather",
] as const;
