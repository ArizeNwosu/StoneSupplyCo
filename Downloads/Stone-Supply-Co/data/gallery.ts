const photoRoot =
  "https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7";

export const authenticPhotos = {
  hero:
    "https://lh3.googleusercontent.com/geougc/AF1QipPLU8GvDPSzzMTtWJ3FGrw8QPnpLaN62TOzrfke=h1400-no",
  yard:
    "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWm-aijwzyBmeCZch8_INcpkkUHZC-H-bsMUVoKimv6_l4z5UDGeDVpMQLkIxN0_n2hpG5JB3Y7xiDe138aSkzqxZQlJDC2SwVC-cK1GmKXll_Vde0YWyjYJ6ntPPapNHVHOo_oefyuB5Ggi=w1200-h1600-k-no",
  slabs: [
    {
      src: `${photoRoot}/fbe79f10-e919-4202-b4d6-743d1ffc007e.webp`,
      alt: "Large-format light quartz slab with detailed stone movement",
    },
    {
      src: `${photoRoot}/98efca7a-0e72-4db4-bc84-66199335658b.webp`,
      alt: "Warm beige jumbo quartz slab displayed at full scale",
    },
    {
      src: `${photoRoot}/a11dc1df-7fa0-49ad-993b-745d01cf66b3.webp`,
      alt: "Decorative Bizana quartz slab at the Northridge yard",
    },
    {
      src: `${photoRoot}/2f847ea6-ddec-4edc-86bb-65d9587b3a25.webp`,
      alt: "Silver concrete-look quartz slab photographed head-on",
    },
    {
      src: `${photoRoot}/71e95dd8-3ea6-4631-adc9-30a8b58badf4.webp`,
      alt: "Mocha brown quartz slab displayed in the warehouse",
    },
    {
      src: `${photoRoot}/28b85e17-ffa2-4995-a3a9-329d4df64c38.webp`,
      alt: "Calacatta-inspired quartz slab with broad veining",
    },
  ],
} as const;
