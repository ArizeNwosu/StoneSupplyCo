-- Stone Supply Co — corrected material detail updates
-- Generated 2026-08-29 with actual DB slugs
-- Run in Supabase SQL Editor

UPDATE materials SET
  description = 'Polished brown quartz with warm Emperador-style movement and lighter mineral accents',
  dimensions = '55" × 119"',
  thickness = '2cm',
  quantity = 7,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/0a737898-8b1d-44ad-a336-f469a3fcc9d1.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1ff84f6e-fb5f-48e3-985a-12f30edd4819.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Bar Tops','Commercial Countertops','Office Counters'],
  availability = 'available'
WHERE slug = 'emperador';

UPDATE materials SET
  description = 'Polished clay-beige quartz with fine pebble-style speckling and warm neutral surface suitable for kitchens, vanities, and commercial applications',
  dimensions = '55" × 119"',
  thickness = '2cm',
  quantity = 3,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/028afc2b-1d3d-41f7-acb4-9a39cf368a56.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1a51fde9-b9da-4338-8f86-5935a1172aad.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'clay-pebble';

UPDATE materials SET
  description = 'Polished beige quartz with dense speckled movement and warm neutral surface. Practical, consistent, and easy to pair with white, cream, beige, wood, black, stainless steel, or brushed metal finishes.',
  dimensions = '119" × 55"',
  thickness = '2cm',
  quantity = 17,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3def947f-e02a-4433-a3a4-09777dfa4938.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'clavaria';

UPDATE materials SET
  description = 'Polished ash-gray quartz with subtle speckled movement and a clean, consistent surface. Neutral, modern finish suitable for various applications.',
  dimensions = '55" × 119"',
  thickness = '2cm',
  quantity = 2,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/2c2ca652-a97f-4c32-8ab2-6317a85cc04f.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/c925b331-c94f-41f3-9c58-8629ca2cfc88.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'cendre';

UPDATE materials SET
  description = 'Leather finish 2cm engineered quartz with soft cement-inspired surface, subtle tonal movement, and modern concrete look in gray',
  dimensions = '126" × 61"',
  thickness = '2cm',
  quantity = 3,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/a52dbb97-d07c-44f0-9f03-842cfe68f4e6.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/822f310c-869d-4708-8000-4ce9dcc130e6.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'cemento';

UPDATE materials SET
  description = 'Polished gray quartz with soft concrete-style appearance and subtle tonal movement. Neutral finish suitable for kitchen countertops, vanities, and commercial applications.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 5,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1710eacf-de01-45c9-82e8-2bb6d6ce4aaf.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/9ea8a3ac-441c-4d2b-9330-4fb32470ceff.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'caldaza';

UPDATE materials SET
  description = 'Polished white quartz with fine speckled movement and clean, consistent surface. Soft background ideal for kitchens, vanities, and rental upgrades.',
  dimensions = '55" × 120"',
  thickness = '2cm',
  quantity = 1,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/293f5bf1-4f08-4243-ac2f-79b3e77ac601.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/7b074bc3-465a-4fef-a565-b9ef2cc104c5.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'bianco-city';

UPDATE materials SET
  description = 'Polished gray, taupe, cream, and white quartz with dense stone-look movement and textured natural pattern. More decorative than basic solid-color quartz while remaining neutral.',
  dimensions = '55" × 119"',
  thickness = '2cm',
  quantity = 6,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/a11dc1df-7fa0-49ad-993b-745d01cf66b3.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/9c3dcffb-b5e9-44bc-aa6c-0fd2d664bf2a.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'bizana';

UPDATE materials SET
  description = 'Polished beige quartz with dense speckled movement and warm neutral surface. Budget-friendly option suitable for kitchens, vanities, and commercial applications.',
  dimensions = '62" × 127"',
  thickness = '2cm',
  quantity = 4,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/56d7d9f5-c140-4b96-84bd-18542eb202ae.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/16cb4cbb-4139-473f-9223-2900b2955d30.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Bar Tops','Office Counters'],
  availability = 'low'
WHERE slug = 'bamboo';

UPDATE materials SET
  description = 'Suede finish charcoal gray quartz with subtle soapstone-style movement. Dark, modern aesthetic suitable for various applications.',
  dimensions = '128" × 63"',
  thickness = '2cm',
  quantity = 3,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/e1f95870-e1ac-4fc4-a036-9b7b7cbf434a.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/65bf5c66-eecd-4416-8e25-4abd980ed396.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Bar Tops'],
  availability = 'low'
WHERE slug = 'charcoal-soapstone';

UPDATE materials SET
  description = 'Polished smoke gray quartz with subtle speckled detail and clean, consistent surface. Neutral modern finish suitable for kitchens, bathrooms, and commercial applications.',
  dimensions = '127" × 63"',
  thickness = '2cm',
  quantity = 1,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/ccd93376-6075-4b8a-9f8a-080f0477c445.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/81a11af4-c75b-4ca9-a734-a4c4499b7a1c.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'smoke-grey';

UPDATE materials SET
  description = 'Brushed silver-gray quartz with clean, soft, minimal surface pattern. Neutral appearance suitable for modern kitchens and commercial applications.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 14,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/10700c59-4d38-4300-a74f-931345c19671.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1096217d-56dc-4dbe-8621-82f1d51365ff.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'silver';

UPDATE materials SET
  description = 'Polished white and gray quartz with bold Calacatta-breccia movement and marble-look surface. More dramatic than basic white quartz.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 6,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/fbe79f10-e919-4202-b4d6-743d1ffc007e.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6069bf6b-4785-45ed-a263-41bf4f2fa6dd.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'calacatta-breccia-jumbo';

UPDATE materials SET
  description = 'Brushed white quartz with clean minimal surface and soft modern finish. Bright, simple, and easy to pair with various design elements.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 28,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1c615e47-6c5e-44a8-9b7b-5c5e263e401c.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/33e33408-34f7-496d-9253-439436b7e46a.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'super-white-jumbo-brushed';

-- Oyster is stored as 'metropolis-oyster' in the DB
UPDATE materials SET
  description = 'Polished 2cm engineered quartz with soft oyster-beige background and cloudy gray movement. Suited for kitchens, bathrooms, rentals, and commercial applications.',
  dimensions = '126" × 61"',
  thickness = '2cm',
  quantity = 12,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/692fa626-5cd2-4309-991e-223b76ce87c5.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/79bb9ad0-d6e4-4b20-842c-575df9142a47.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'metropolis-oyster';

UPDATE materials SET
  description = 'Polished white quartz slab with fine gray veining and marble-look surface, ideal for countertops, vanities, and rental upgrades',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 4,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/9b99257e-1215-4294-9d23-dc4526395543.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/8eb82fa7-4237-454c-b4e3-c6a8901d4bb2.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'calacatta-avenza-polished';

UPDATE materials SET
  description = 'Honed white Calacatta-style quartz with fine gray veining and clean marble-look surface for kitchens, islands, and vanities',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 6,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1bff91e5-4549-49dc-9367-cb1e4fc3cbd0.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/bab007c7-04ef-460e-a96c-27d4d7056213.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'calacatta-avenza-honed';

UPDATE materials SET
  description = 'Light gray polished quartz with dense speckled movement and stone-like texture. Ideal for kitchens, vanities, and budget projects.',
  dimensions = '126" × 61"',
  thickness = '2cm',
  quantity = 39,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/e7dba74c-56fb-4f04-8219-8bd3c89a342d.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/e3984f05-0373-42dd-a86e-036eb3e0e688.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'palomino';

UPDATE materials SET
  description = 'Polished charcoal gray quartz with fine speckled detail and consistent modern surface. Neutral, practical finish suitable for kitchens, bathrooms, and commercial applications.',
  dimensions = '61" × 126"',
  thickness = '2cm',
  quantity = 41,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/b36ffb8f-db38-42bc-b883-4ed306e986bf.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/ef1a7e85-a2db-436d-877f-0e289f3d7a34.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Bar Tops','Office Counters'],
  availability = 'available'
WHERE slug = 'charcoal-polished';

UPDATE materials SET
  description = 'Polished white Carrara-style quartz with soft gray movement and clean finish',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 55,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/d15316b3-ef4b-4c56-9c94-71f249552be7.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/dd2410a9-fd5e-411f-be1d-9020eb2983e7.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'carrara-jumbo-polished';

-- Carrara Jumbo Brushed is stored as 'carrara-jumbo' in the DB
UPDATE materials SET
  description = 'Brushed white Carrara-style quartz with soft gray movement and clean, subtle surface. Bright and easy to pair with various finishes.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 21,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/80535407-b1ec-42cc-9546-0f2cafb13dd1.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/fe4ca53f-6330-4c21-abf2-ec18b22db603.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'carrara-jumbo';

UPDATE materials SET
  description = 'Honed white Carrara-style quartz with soft gray movement and smooth surface. Ideal for kitchens, islands, vanities, and commercial applications.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 25,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3fcca937-0f9d-443d-97e7-d24b8dbdf411.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3af3b495-5636-4901-9793-293c0f2e417f.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'carrara-jumbo-honed';

UPDATE materials SET
  description = 'Matte white quartz with clean minimal surface and soft modern finish. Bright, simple, and easy to pair with white, gray, black, wood, stainless steel, or brushed metal finishes.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 38,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/0f291b63-61fa-40e6-8883-465a297ea5c0.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1c615e47-6c5e-44a8-9b7b-5c5e263e401c.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'super-white-jumbo-matte';

UPDATE materials SET
  description = 'Polished gray quartz with soft white veining and stone-look surface. Medium-gray background with soft white veining and a polished finish.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 35,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6a6909f5-7b22-4628-96aa-7db9ca99ddcb.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/0708121c-373d-4de9-9428-f5b414354736.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'ponente-grey';

UPDATE materials SET
  description = 'Polished grey quartz with fine speckled detail and consistent modern surface. Clean, neutral finish suitable for kitchens, vanities, and commercial applications.',
  dimensions = '126" × 61"',
  thickness = '2cm',
  quantity = 7,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/d2a05ce5-e934-4edc-b39c-1d3ed9e96c5e.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6874c345-a7d2-4102-8832-7dab9b28404f.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'sparkle-grey';

UPDATE materials SET
  description = 'Clean white quartz with subtle minimal pattern and honed finish. Bright, simple, and easy to pair with various design elements.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 20,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/2acdd4a5-e887-4e5f-970c-0aa39b0b1f53.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6c9c338c-213b-4b0f-9b67-d2ae34f011dd.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'city-white';

UPDATE materials SET
  description = 'White Carrara-style quartz with soft gray movement and silk finish for kitchen countertops, islands, vanities, and commercial applications',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 26,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/8fdac35c-3d19-4dc1-8afc-cfe68c6ca294.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/af4ee395-3ffc-4d4e-8966-b659b8f29398.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'carrara-jumbo-silk';

UPDATE materials SET
  description = 'Polished engineered quartz with light gray-white background and long gray veining. Suitable for kitchen countertops, bathroom vanities, and commercial applications.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 20,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/c0e5c655-76cb-4394-ba2c-b194ca7e08a6.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/81e11e0a-ff8a-4344-acd3-593cea490096.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'calacatta-grey-vein';

UPDATE materials SET
  description = 'Matte gray quartz with soft stone-look background and thin white linear veining. Engineered quartz offering refined stone appearance with consistency benefits.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 26,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/5b1a4184-f7d7-4090-a2fb-1d8f66e68ea8.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/a4347bd4-6265-49d2-a013-4d07c51f7c7e.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'pietra-grey-matte';

-- Pietra Grey Polished is stored as 'pietra-grey' in the DB
UPDATE materials SET
  description = 'Polished gray quartz with soft stone-look background and thin white linear veining. Clean, modern, and easy to pair with white, black, wood, stainless steel, or brushed metal finishes.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 15,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/ceb0e467-ecc9-4fcd-b813-858c3f30c2a4.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/e5301e3a-6777-450d-a5ee-a4c1223a3d62.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'pietra-grey';

UPDATE materials SET
  description = 'Polished beige quartz with warm sandstone-style background and fine speckled texture. Neutral finish suitable for kitchens, islands, vanities, and commercial applications.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 29,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/98efca7a-0e72-4db4-bc84-66199335658b.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/f619ab68-53bf-4f2d-981a-f17171ae01ec.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'sandstone-beige-jumbo';

UPDATE materials SET
  description = 'Polished beige quartz with warm sandstone-style background and fine speckled texture. Neutral, practical finish suitable for kitchens, vanities, and commercial applications.',
  dimensions = '55" × 120"',
  thickness = '2cm',
  quantity = 13,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6697c154-2223-4ecd-b0d2-2c46d84d48c6.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/5947d218-321f-4c1e-a51a-52687db24643.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'sandstone-beige';

UPDATE materials SET
  description = 'Polished 2cm engineered quartz with clean concrete-look surface and subtle fine texture. Simple, neutral, modern design suitable for various applications.',
  dimensions = '55" × 120"',
  thickness = '2cm',
  quantity = 22,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/2f847ea6-ddec-4edc-86bb-65d9587b3a25.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/38c88250-9d0b-496e-b328-d1915f260842.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'silver-concrete';

UPDATE materials SET
  description = 'Matte taupe-gray quartz with soft concrete-look surface and subtle fine texture. Warm, neutral, modern finish suitable for kitchens, vanities, and commercial applications.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 1,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6b3000b4-89d8-4c5f-ba33-1605d285a6e1.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/5f37f422-0115-4f64-9348-9ce1cee5c705.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Bar Tops','Office Counters'],
  availability = 'low'
WHERE slug = 'taupe-gray';

UPDATE materials SET
  description = 'Matte gray quartz with sleek concrete-look surface and subtle fine texture. Clean, modern, minimal design suitable for various applications.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 4,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/4a9148d8-fbb7-4240-ae96-092b3fb07bf4.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6dbefa07-aab3-46cc-88b1-c402af7a03b4.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'sleek-concrete';

UPDATE materials SET
  description = 'Polished white quartz with soft gray Calacatta-style veining and a clean consistent surface. Bright, classic, and easy to pair with white, gray, black, wood, and brushed metal finishes.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 2,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/a1416f81-90f1-4154-a473-c108cd2278fa.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'low'
WHERE slug = 'calacatta-lincoln';

UPDATE materials SET
  description = 'Polished concrete-look gray quartz with soft cloudy movement and fine dark speckled detail. Neutral, modern finish.',
  dimensions = '130" × 65"',
  thickness = '2cm',
  quantity = 5,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/8ff9ba74-5914-4334-987a-0878772f2eb3.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/722bb386-d6c2-4954-a631-52724034d94d.webp'
  ],
  applications = ARRAY['Countertops','Kitchen Islands','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'chateau-concrete-grey';

UPDATE materials SET
  description = 'Polished white quartz with bold gray Calacatta-style veining. Gives buyers the dramatic look of white marble with the consistency of engineered quartz.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 22,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/28b85e17-ffa2-4995-a3a9-329d4df64c38.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1ba54606-5926-4696-8ad5-205578a1ef18.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'calacatta-invisible';

-- 'cloudy-grey-matte' and 'cloudy-grey' are two separate rows (both Cloudy Grey, Matte)
UPDATE materials SET
  description = 'Gray quartz with cloudy background, soft white veining, and clean matte surface. Neutral modern tone works well for kitchens, vanities, and commercial applications.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 23,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/82235737-21bc-42db-8e50-9e584cfc7d74.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/b9977040-52b8-47d8-b429-19af12c92459.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'cloudy-grey-matte';

UPDATE materials SET
  description = 'Matte gray quartz with cloudy background, soft white veining, and clean modern surface. Neutral tone works well for kitchens, bathrooms, and commercial applications.',
  dimensions = '126" × 63"',
  thickness = '2cm',
  quantity = 7,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/20703cf0-e8c9-4b3e-bf17-9b19aea80bba.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/57038770-cafa-439a-b680-3d10989134f3.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Office Counters','Bar Tops'],
  availability = 'available'
WHERE slug = 'cloudy-grey';

UPDATE materials SET
  description = 'Polished mocha brown quartz with warm neutral background, subtle light veining, and clean consistent surface. Engineered quartz ideal for budget-friendly countertop installations.',
  dimensions = '64" × 127"',
  thickness = '2cm',
  quantity = 1,
  price = 299,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/71e95dd8-3ea6-4631-adc9-30a8b58badf4.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/b55a1671-344b-4b35-ba0c-4519c538c451.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Bar Tops'],
  availability = 'low'
WHERE slug = 'mocha-brown';

UPDATE materials SET
  description = 'Polished beige quartz with clean, consistent surface and subtle fine texture. Warm, simple, neutral tone.',
  dimensions = '55" × 120"',
  thickness = '2cm',
  quantity = 23,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/7796bad8-9434-476f-8d12-73e86c7b287f.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/8d157ba1-d983-4fd3-a792-f7ff2b355d95.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Laundry Room Counters','Commercial Countertops','Bar Tops','Office Counters'],
  availability = 'available'
WHERE slug = 'neveda-beige';

UPDATE materials SET
  description = 'Polished gray concrete-look quartz for kitchen countertops and commercial projects',
  dimensions = '120" × 55"',
  thickness = '2cm',
  quantity = 17,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3eacf1d9-aa09-4958-b377-fd0315b21bde.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3acffbab-7a8c-4f87-a1fc-0f79463acd95.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Commercial Countertops','Bar Tops','Laundry Room Counters','Backsplashes'],
  availability = 'available'
WHERE slug = 'breda-concrete';

UPDATE materials SET
  description = 'Modern gray terrazzo pattern with scattered stone-chip movement in black, white, beige, and soft gray tones. Honed finish provides smooth matte appearance with contemporary design feel.',
  dimensions = '120" × 55"',
  thickness = '2cm',
  quantity = 22,
  price = 300,
  image_urls = ARRAY[
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/690ab61d-eb8f-4260-a951-a9acc7a92694.webp',
    'https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/85e9410a-6b77-464b-a991-c782fa182225.webp'
  ],
  applications = ARRAY['Countertops','Bathroom Vanities','Commercial Countertops','Bar Tops','Laundry Room Counters','Backsplashes'],
  availability = 'available'
WHERE slug = 'terrazzo-cinder';

-- Verify all 44 rows were touched
SELECT slug, name, finish, quantity, availability,
       array_length(image_urls, 1) AS imgs,
       left(description, 40) AS desc_preview
FROM materials
ORDER BY name, finish;
