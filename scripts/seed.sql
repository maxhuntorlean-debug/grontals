-- 3 demo products for local development / initial deploy.
-- Neutral placeholder data only — no real photos, no brand claims.

INSERT INTO products (
	name, slug, sku, price, old_price, short_description, description,
	brand, manufacturer, piece_count, age, model_size, material,
	main_image_key, in_stock, is_active, sort_order, seo_title, seo_description
) VALUES
(
	'Sportsbil 1286 deler', 'sportsbil-1286-deler', 'GT-1001', 1499, 1799,
	'Detaljert sportsbil i kompatible byggeklosser.',
	'Et byggesett med 1286 deler for bygging av en detaljert sportsbil. Kompatibelt med de fleste store byggeklossmerker. Perfekt som gave eller hobbyprosjekt.',
	'Byggeglede', 'Byggeglede', 1286, '8-14 år', '35 x 12 x 9 cm', 'ABS-plast',
	NULL, 1, 1, 1, NULL, NULL
),
(
	'Middelalderslott 2450 deler', 'middelalderslott-2450-deler', 'GT-1002', 2299, NULL,
	'Stort middelalderslott med tårn og bevegelig vindebro.',
	'Et imponerende byggesett på 2450 deler med flere tårn, en indre borggård og en bevegelig vindebro. For viderekomne byggere.',
	'Byggeglede', 'Byggeglede', 2450, '9-14 år', '48 x 38 x 30 cm', 'ABS-plast',
	NULL, 1, 1, 2, NULL, NULL
),
(
	'Romstasjon 1780 deler', 'romstasjon-1780-deler', 'GT-1003', 1899, NULL,
	'Modulær romstasjon med solcellepaneler og landingsmodul.',
	'Bygg din egen romstasjon med 1780 deler, inkludert roterende solcellepaneler og en frittstående landingsmodul.',
	'Byggeglede', 'Byggeglede', 1780, '10+ år', '40 x 25 x 20 cm', 'ABS-plast',
	NULL, 0, 1, 3, NULL, NULL
);

INSERT INTO product_specs (product_id, name, value, sort_order) VALUES
(1, 'Antall deler', '1286', 1),
(1, 'Anbefalt alder', '8-14 år', 2),
(1, 'Mål', '35 x 12 x 9 cm', 3),
(2, 'Antall deler', '2450', 1),
(2, 'Anbefalt alder', '9-14 år', 2),
(2, 'Mål', '48 x 38 x 30 cm', 3),
(3, 'Antall deler', '1780', 1),
(3, 'Anbefalt alder', '10+ år', 2),
(3, 'Mål', '40 x 25 x 20 cm', 3);
