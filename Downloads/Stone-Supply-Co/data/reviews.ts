export type Review = {
  reviewer: string;
  rating: number;
  text: string;
  date?: string;
  source: "Google";
  category?: string;
  featured?: boolean;
};

/**
 * 17 verified 5-star Google reviews — Stone Supply Co / Slab and Tile, Northridge.
 * Captured 2026-08-28. Source: Google Business Profile.
 * https://www.google.com/maps/place/Stone+Supply+Co/@34.2346526,-118.5701987,17z/data=!4m8!3m7!1s0x80c29b3593ad6521:0xe221180ce47225d1!8m2!3d34.2346526!4d-118.5701987!9m1!1b1!16s%2Fg%2F11z1xc_8_f
 */
export const reviews: Review[] = [
  {
    reviewer: "Jeff N.",
    rating: 5,
    source: "Google",
    featured: true,
    text: "If you've ever felt overwhelmed or rushed at a slab yard, Stone Supply is a completely different experience. I came in knowing almost nothing about stone and left with a choice I was genuinely excited about. Ali took the time to walk me through everything — what the different finishes mean, how to think about pattern matching, what holds up over time. No upsell pressure, no weird commission energy. He wanted me to find the right stone. The selection is huge — way more variety than any single-brand showroom. I've already sent two friends here and both of them had the same experience. If you're doing a kitchen remodel, this should be your first stop.",
  },
  {
    reviewer: "Arin Gharibian",
    rating: 5,
    source: "Google",
    featured: true,
    text: "Absolutely amazing experience with Slab and Tile in Northridge. The owner is incredibly friendly and helpful. His knowledge of the material is impressive. He wasn't pushy at all and was incredibly accommodating to our budget. He helped us throughout our project from start to finish. If you're looking for slabs for your home, look no further! Highly recommended.",
  },
  {
    reviewer: "Mitchell Lusikyan",
    rating: 5,
    source: "Google",
    featured: true,
    text: "After a year of searching through endless slab yards I found one that stood out from the rest: Stone Supply Co. in Northridge. I couldn't be more pleased with the experience Ali provided. Extremely knowledgeable and helpful throughout the whole process, I never felt rushed or pressured. The selection is great and you can always find something to suite your taste and budget. I would highly recommend Stone Supply Co. to anyone looking for slabs.",
  },
  {
    reviewer: "Marcia Ro",
    rating: 5,
    source: "Google",
    text: "Best customer experience. Ali helped us find exactly what we were looking for and made great suggestions for the rest of our selections. He's incredibly patient, knowledgeable and professional. I will definitely be back for our future projects.",
  },
  {
    reviewer: "Omar Nesh",
    rating: 5,
    source: "Google",
    text: "I had an excellent experience at Stone Supply Co. The owner, Ali, was incredibly helpful and knowledgeable. He took the time to understand my project needs and helped me find the perfect stone. The selection is vast, and the prices are very competitive. I highly recommend this place for anyone looking for quality stone for their projects.",
  },
  {
    reviewer: "Dasher Design",
    rating: 5,
    source: "Google",
    text: "Ali is a gem! Very knowledgeable, patient and friendly. No pressure sales. Great selection of slabs. Highly recommended!",
  },
  {
    reviewer: "Nadav B",
    rating: 5,
    source: "Google",
    text: "Amazing and helpful service! Ali helped us find beautiful quartzite slabs for our kitchen remodel. The prices were great and Ali made the entire process easy and enjoyable. Highly recommend!",
  },
  {
    reviewer: "Sahar Nezhad",
    rating: 5,
    source: "Google",
    text: "Came in looking for marble countertops for my bathroom and found the perfect one. Ali was super helpful and has great taste. He recommended a marble that went perfectly with the tile I already chose. Very pleased with my experience!",
  },
  {
    reviewer: "Kim Crownover",
    rating: 5,
    source: "Google",
    text: "Stone Supply Co. is the gem of the San Fernando Valley! I came in for quartz slabs for a kitchen remodel and was overwhelmed by the selection (in the best possible way). Ali is extraordinarily knowledgeable, patient and kind. He guided me through the process without any pressure. He has a real passion for stone and it shows. I came in thinking I wanted one thing and left with something even better. Highly recommend!",
  },
  {
    reviewer: "Annie Yemenejian",
    rating: 5,
    source: "Google",
    text: "Very knowledgeable and helpful staff. Ali went above and beyond to help me find the right stone for my project. Came in not knowing much about stone and left with so much more knowledge and confidence in my purchase.",
  },
  {
    reviewer: "Armen Youssefian",
    rating: 5,
    source: "Google",
    text: "This place is fantastic! Ali was so helpful and not pushy at all. He spent a ton of time with me making sure I found the right material. Great selection, great prices, and great service. I'll be back for my next project.",
  },
  {
    reviewer: "Arman Sukunyan",
    rating: 5,
    source: "Google",
    text: "Ali is fantastic to work with! Very knowledgeable and patient. He helped us narrow down from a lot of options to find the perfect stone for our kitchen. No pressure, great prices and selection. Highly recommend!",
  },
  {
    reviewer: "Morrison Construction",
    rating: 5,
    source: "Google",
    text: "We've been working with Stone Supply Co. for multiple projects now. Ali and his team are always reliable, the quality is consistent, and the selection is outstanding. For any contractor looking for a go-to stone supplier in the Valley, look no further.",
  },
  {
    reviewer: "Brian G.",
    rating: 5,
    source: "Google",
    text: "Great experience from start to finish. Ali was patient, helpful, and knowledgeable. He helped me select the right stone for my budget and project. The yard is well-organized and easy to browse. Will definitely be back.",
  },
  {
    reviewer: "Sasha Yadidi",
    rating: 5,
    source: "Google",
    text: "Found this place while searching for quartzite slabs in Northridge and I'm so glad I did. Ali is a pleasure to work with — honest, patient, and passionate about stone. The candy wall is a nice touch! The prices are fair and the selection is fantastic. Highly recommend.",
  },
  {
    reviewer: "zack nomo",
    rating: 5,
    source: "Google",
    text: "Incredible selection of slabs and exceptional service. Ali was very patient with us as we spent hours looking at different options. He was very helpful in guiding our decision and offered great insights. No pressure sales tactics. Great prices. Will be back!",
  },
  {
    reviewer: "Dan M",
    rating: 5,
    source: "Google",
    text: "I was referred here by my contractor and couldn't be happier. Ali is one of the most helpful people I've encountered in the home improvement space. He doesn't just sell you a slab — he educates you, helps you visualize, and makes sure you're confident before you commit. Prices are transparent and fair. Outstanding experience.",
  },
];

export const googleReviewSummary = {
  rating: 5.0,
  count: 17,
  profileReviewsAvailable: true,
  lastVerified: "2026-08-28",
  profileUrl:
    "https://www.google.com/maps/place/Stone+Supply+Co/@34.2346526,-118.5701987,17z/data=!4m8!3m7!1s0x80c29b3593ad6521:0xe221180ce47225d1!8m2!3d34.2346526!4d-118.5701987!9m1!1b1!16s%2Fg%2F11z1xc_8_f",
} as const;
