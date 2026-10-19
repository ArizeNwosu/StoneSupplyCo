-- 38 new materials from Stone Index (6 originals already seeded)
INSERT INTO materials (slug, name, material_type, color_family, finish, dimensions, thickness, quantity, availability, price, applications, image_urls, featured, tags) VALUES

('clay-pebble', 'Clay Pebble', 'Quartz', 'Cream', 'Polished', '119" × 55"', '2 cm', 3, 'low', 299, array['Countertops','Backsplash','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/028afc2b-1d3d-41f7-acb4-9a39cf368a56.webp'], false, array['beige','warm','neutral']),

('clavaria', 'Clavaria', 'Quartz', 'Cream', 'Polished', '119" × 55"', '2 cm', 17, 'available', 299, array['Countertops','Backsplash','Island'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3def947f-e02a-4433-a3a4-09777dfa4938.webp'], false, array['beige','warm','polished']),

('cendre', 'Cendre', 'Quartz', 'Grey', 'Polished', '119" × 55"', '2 cm', 2, 'low', 300, array['Countertops','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/2c2ca652-a97f-4c32-8ab2-6317a85cc04f.webp'], false, array['grey','cool','neutral']),

('cemento', 'Cemento', 'Quartz', 'Grey', 'Leather', '126" × 61"', '2 cm', 3, 'low', 299, array['Countertops','Outdoor','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/a52dbb97-d07c-44f0-9f03-842cfe68f4e6.webp'], false, array['grey','leather','concrete','textured']),

('caldaza', 'Caldaza', 'Quartz', 'Grey', 'Polished', '130" × 65"', null, 5, 'low', 299, array['Countertops','Flooring','Feature Wall'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1710eacf-de01-45c9-82e8-2bb6d6ce4aaf.webp'], false, array['grey','jumbo','polished']),

('bianco-city', 'Bianco City', 'Quartz', 'White', 'Polished', '120" × 55"', '2 cm', 1, 'low', 300, array['Countertops','Bathroom Vanity','Backsplash'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/293f5bf1-4f08-4243-ac2f-79b3e77ac601.webp'], false, array['white','bright','clean']),

('bizana', 'Bizana', 'Quartz', 'Multi', 'Polished', '119" × 55"', '2 cm', 6, 'available', 299, array['Countertops','Feature Wall','Accent'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/a11dc1df-7fa0-49ad-993b-745d01cf66b3.webp'], false, array['multi','decorative','statement']),

('bamboo', 'Bamboo', 'Quartz', 'Cream', 'Polished', '127" × 62"', '2 cm', 4, 'low', 299, array['Countertops','Backsplash','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/56d7d9f5-c140-4b96-84bd-18542eb202ae.webp'], false, array['beige','warm','organic']),

('smoke-grey', 'Smoke Grey', 'Quartz', 'Grey', 'Polished', '127" × 63"', '2 cm', 1, 'low', 300, array['Countertops','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/ccd93376-6075-4b8a-9f8a-080f0477c445.webp'], false, array['grey','subtle','cool']),

('silver', 'Silver', 'Quartz', 'Grey', 'Brushed', '130" × 65"', null, 14, 'available', 299, array['Countertops','Flooring','Island'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/10700c59-4d38-4300-a74f-931345c19671.webp'], false, array['grey','silver','brushed','modern']),

('calacatta-breccia-jumbo', 'Calacatta Breccia Jumbo', 'Quartz', 'White', 'Polished', '130" × 65"', null, 6, 'available', 299, array['Countertops','Island','Feature Wall'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/fbe79f10-e919-4202-b4d6-743d1ffc007e.webp'], false, array['white','veined','dramatic','marble-look']),

('super-white-jumbo-brushed', 'Super White Jumbo', 'Quartz', 'White', 'Brushed', '130" × 65"', null, 28, 'available', 299, array['Countertops','Backsplash','Island','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1c615e47-6c5e-44a8-9b7b-5c5e263e401c.webp'], true, array['white','brushed','jumbo','clean']),

('calacatta-avenza-polished', 'Calacatta Avenza', 'Quartz', 'White', 'Polished', '126" × 63"', '2 cm', 4, 'low', 300, array['Countertops','Island','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/9b99257e-1215-4294-9d23-dc4526395543.webp'], false, array['white','veined','marble-look','elegant']),

('calacatta-avenza-honed', 'Calacatta Avenza', 'Quartz', 'White', 'Honed', '130" × 65"', null, 6, 'available', 299, array['Countertops','Bathroom Vanity','Backsplash'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/1bff91e5-4549-49dc-9367-cb1e4fc3cbd0.webp'], false, array['white','honed','matte','soft']),

('palomino', 'Palomino', 'Quartz', 'Cream', 'Polished', '126" × 61"', '2 cm', 39, 'available', 299, array['Countertops','Flooring','Island','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/e7dba74c-56fb-4f04-8219-8bd3c89a342d.webp'], true, array['beige','warm','versatile']),

('charcoal-polished', 'Charcoal', 'Quartz', 'Grey', 'Polished', '126" × 61"', '2 cm', 41, 'available', 299, array['Countertops','Island','Feature Wall','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/b36ffb8f-db38-42bc-b883-4ed306e986bf.webp'], true, array['grey','dark','modern','bold']),

('carrara-jumbo-polished', 'Carrara Jumbo', 'Quartz', 'White', 'Polished', '130" × 65"', null, 55, 'available', 299, array['Countertops','Backsplash','Island','Bathroom','Flooring'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/d15316b3-ef4b-4c56-9c94-71f249552be7.webp'], true, array['white','carrara','classic','marble-look']),

('carrara-jumbo-honed', 'Carrara Jumbo', 'Quartz', 'White', 'Honed', '130" × 65"', null, 25, 'available', 299, array['Countertops','Bathroom Vanity','Backsplash'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3fcca937-0f9d-443d-97e7-d24b8dbdf411.webp'], true, array['white','honed','soft','matte']),

('super-white-jumbo-matte', 'Super White Jumbo', 'Quartz', 'White', 'Matte', '130" × 65"', null, 38, 'available', 299, array['Countertops','Backsplash','Island','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/0f291b63-61fa-40e6-8883-465a297ea5c0.webp'], true, array['white','matte','jumbo','minimalist']),

('ponente-grey', 'Ponente Grey', 'Quartz', 'Grey', 'Polished', '130" × 65"', null, 35, 'available', 299, array['Countertops','Flooring','Island','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6a6909f5-7b22-4628-96aa-7db9ca99ddcb.webp'], true, array['grey','cool','jumbo','modern']),

('sparkle-grey', 'Sparkle Grey', 'Quartz', 'Grey', 'Polished', '126" × 61"', '2 cm', 7, 'available', 299, array['Countertops','Backsplash','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/d2a05ce5-e934-4edc-b39c-1d3ed9e96c5e.webp'], false, array['grey','sparkle','polished']),

('city-white', 'City White', 'Quartz', 'White', 'Honed', '130" × 65"', null, 20, 'available', 299, array['Countertops','Bathroom Vanity','Island'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/2acdd4a5-e887-4e5f-970c-0aa39b0b1f53.webp'], true, array['white','honed','clean','modern']),

('carrara-jumbo-silk', 'Carrara Jumbo Silk', 'Quartz', 'White', 'Silk', '130" × 65"', null, 26, 'available', 299, array['Countertops','Bathroom Vanity','Backsplash','Island'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/8fdac35c-3d19-4dc1-8afc-cfe68c6ca294.webp'], true, array['white','silk','carrara','elegant']),

('calacatta-grey-vein', 'Calacatta Grey Vein', 'Quartz', 'White', 'Polished', '126" × 63"', '2 cm', 20, 'available', 300, array['Countertops','Island','Feature Wall','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/c0e5c655-76cb-4394-ba2c-b194ca7e08a6.webp'], true, array['white','grey-vein','veined','marble-look']),

('pietra-grey-matte', 'Pietra Grey', 'Quartz', 'Grey', 'Matte', '126" × 63"', '2 cm', 26, 'available', 300, array['Countertops','Flooring','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/5b1a4184-f7d7-4090-a2fb-1d8f66e68ea8.webp'], true, array['grey','matte','modern','minimalist']),

('sandstone-beige-jumbo', 'Sandstone Beige Jumbo', 'Quartz', 'Cream', 'Polished', '130" × 65"', null, 29, 'available', 299, array['Countertops','Flooring','Island','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/98efca7a-0e72-4db4-bc84-66199335658b.webp'], true, array['beige','sandstone','jumbo','warm']),

('sandstone-beige', 'Sandstone Beige', 'Quartz', 'Cream', 'Polished', '120" × 55"', '2 cm', 13, 'available', 300, array['Countertops','Backsplash','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6697c154-2223-4ecd-b0d2-2c46d84d48c6.webp'], false, array['beige','sandstone','warm']),

('silver-concrete', 'Silver Concrete', 'Quartz', 'Grey', 'Polished', '120" × 55"', '2 cm', 22, 'available', 300, array['Countertops','Flooring','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/2f847ea6-ddec-4edc-86bb-65d9587b3a25.webp'], true, array['grey','concrete','silver','industrial']),

('taupe-gray', 'Taupe Gray', 'Quartz', 'Grey', 'Matte', '126" × 63"', '2 cm', 9, 'available', 300, array['Countertops','Bathroom Vanity','Flooring'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/6b3000b4-89d8-4c5f-ba33-1605d285a6e1.webp'], false, array['taupe','matte','neutral','transitional']),

('sleek-concrete', 'Sleek Concrete', 'Quartz', 'Grey', 'Matte', '126" × 63"', '2 cm', 4, 'low', 300, array['Countertops','Commercial','Outdoor'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/4a9148d8-fbb7-4240-ae96-092b3fb07bf4.webp'], false, array['grey','concrete','matte','modern']),

('calacatta-lincoln', 'Calacatta Lincoln', 'Quartz', 'White', 'Polished', '126" × 63"', '2 cm', 2, 'low', 300, array['Countertops','Island','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/a1416f81-90f1-4154-a473-c108cd2278fa.webp'], false, array['white','veined','marble-look','elegant']),

('chateau-concrete-grey', 'Chateau Concrete Grey', 'Quartz', 'Grey', 'Polished', '130" × 65"', null, 5, 'low', 299, array['Countertops','Flooring','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/8ff9ba74-5914-4334-987a-0878772f2eb3.webp'], false, array['grey','concrete','polished','industrial']),

('calacatta-invisible', 'Calacatta Invisible', 'Quartz', 'White', 'Polished', '126" × 63"', '2 cm', 22, 'available', 300, array['Countertops','Island','Feature Wall','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/28b85e17-ffa2-4995-a3a9-329d4df64c38.webp'], true, array['white','subtle','quiet','minimalist']),

('cloudy-grey-matte', 'Cloudy Grey Matte', 'Quartz', 'Grey', 'Matte', '126" × 63"', '2 cm', 23, 'available', 300, array['Countertops','Flooring','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/82235737-21bc-42db-8e50-9e584cfc7d74.webp'], true, array['grey','matte','soft','cloud']),

('mocha-brown', 'Mocha Brown', 'Quartz', 'Brown', 'Polished', '127" × 64"', '2 cm', 1, 'low', 299, array['Countertops','Accent','Bathroom Vanity'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/71e95dd8-3ea6-4631-adc9-30a8b58badf4.webp'], false, array['brown','warm','earthy','mocha']),

('cloudy-grey', 'Cloudy Grey', 'Quartz', 'Grey', 'Matte', '126" × 63"', '2 cm', 7, 'available', 300, array['Countertops','Bathroom Vanity','Flooring'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/20703cf0-e8c9-4b3e-bf17-9b19aea80bba.webp'], false, array['grey','matte','soft','subtle']),

('neveda-beige', 'Neveda Beige', 'Quartz', 'Cream', 'Polished', '120" × 55"', '2 cm', 23, 'available', 300, array['Countertops','Backsplash','Island','Bathroom'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/7796bad8-9434-476f-8d12-73e86c7b287f.webp'], true, array['beige','warm','neutral','versatile']),

('breda-concrete', 'Breda Concrete', 'Quartz', 'Grey', 'Polished', '120" × 55"', null, 17, 'available', 300, array['Countertops','Flooring','Commercial'], array['https://fvaivbcprpyqrmjauoov.supabase.co/storage/v1/object/public/listing-photos/optimized-v2/0401c957-c990-4ed3-aa86-e3dc94e0dfb7/3eacf1d9-aa09-4958-b377-fd0315b21bde.webp'], false, array['grey','concrete','polished','industrial']);
