export const business = {
  name: "Stone Supply Co",
  displayName: "Stone Supply Co.",
  legalName: "Stone Supply Co Inc",
  category: "Stone supplier",
  shortDescriptor: "Natural stone and quartz slabs in Northridge",
  description:
    "A Northridge slab yard serving designers, builders, fabricators, contractors, and homeowners across Los Angeles and the San Fernando Valley.",
  phone: {
    display: "(818) 818-5081",
    e164: "+18188185081",
    href: "tel:+18188185081",
  },
  address: {
    street: "9036 Winnetka Ave",
    city: "Northridge",
    state: "CA",
    postalCode: "91324",
    country: "US",
    formatted: "9036 Winnetka Ave, Northridge, CA 91324",
  },
  coordinates: {
    latitude: 34.2346526,
    longitude: -118.5701987,
  },
  placeId: "ChIJIWWtkzWbwoAR0SVy5AwYIeI",
  googleCid: "16294331370454525393",
  googleMapsUrl:
    "https://www.google.com/maps?cid=16294331370454525393",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Stone+Supply+Co%2C+9036+Winnetka+Ave%2C+Northridge%2C+CA+91324&destination_place_id=ChIJIWWtkzWbwoAR0SVy5AwYIeI",
  mapEmbedUrl:
    "https://maps.google.com/maps?q=34.2346526,-118.5701987&z=17&t=m&ie=UTF8&iwloc=near&output=embed",
  socialLinks: {
    instagram: "https://www.instagram.com/slabandtile/",
  },
  inventoryUrl: "https://thestoneindex.com/yards/stone-supply-co",
  clearanceUrl:
    "https://thestoneindex.com/yards/stone-supply-co/clearance",
  inventory: {
    activeListings: 44,
    fullSlabs: 44,
    clearanceListings: 44,
    materialCurrentlyListed: "Quartz",
    lastVerified: "2026-08-28",
  },
  audiences: ["Designers", "Builders", "Fabricators", "Homeowners"],
  serviceAreas: ["Northridge", "San Fernando Valley", "Los Angeles"],
  amenities: [
    "Wheelchair-accessible entrance",
    "Wheelchair-accessible parking lot",
  ],
  // Google exposes Friday 8 AM–5 PM and a Monday 8 AM reopening time,
  // but did not expose a complete weekly schedule. Keep this null rather
  // than extrapolating unsupported hours.
  hours: null,
  hoursCta: "View current hours on Google Maps",
  rating: 5.0,
  reviewCount: 17,
} as const;

export type Business = typeof business;
