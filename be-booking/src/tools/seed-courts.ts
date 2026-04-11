import 'reflect-metadata';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';

const uuid = () => crypto.randomUUID();

const databaseUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL;

if (!databaseUrl) {
	// Keep this script explicit to avoid accidentally seeding local DB.
	console.error('Missing DATABASE_URL (or MYSQL_URL).');
	process.exit(1);
}

const ds = new DataSource({
	type: 'mysql',
	url: databaseUrl,
	synchronize: false,
});

async function run() {
	await ds.initialize();
	const q = ds.createQueryRunner();
	await q.connect();

	console.log('Connected to cloud DB. Seeding locations/courts/rackets...');

	const locations = [
		{
			name: 'Pickleball Q1 Center',
			address: '12 Le Loi, Quan 1, TP.HCM',
			mapUrl: 'https://maps.google.com/?q=10.7769,106.6963',
		},
		{
			name: 'Pickleball Binh Thanh Hub',
			address: '45 Dinh Bo Linh, Binh Thanh, TP.HCM',
			mapUrl: 'https://maps.google.com/?q=10.8049,106.7437',
		},
		{
			name: 'Pickleball Thu Duc Arena',
			address: '88 Vo Van Ngan, Thu Duc, TP.HCM',
			mapUrl: 'https://maps.google.com/?q=10.8042,106.7693',
		},
	];

	const locationIdByName = new Map<string, string>();

	for (const loc of locations) {
		await q.query(
			`
			INSERT INTO locations (id, name, address, map_url, created_at, updated_at)
			SELECT ?, ?, ?, ?, NOW(), NOW()
			WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = ?)
			`,
			[uuid(), loc.name, loc.address, loc.mapUrl, loc.name],
		);

		const rows = await q.query('SELECT id FROM locations WHERE name = ? LIMIT 1', [loc.name]);
		if (rows?.[0]?.id) locationIdByName.set(loc.name, rows[0].id as string);
	}

	const courts = [
		{
			courtName: 'Court Q1 - A1',
			description: 'Indoor court, LED lighting, standard dimensions.',
			province: '79',
			district: '760',
			ward: '26743',
			address: '12 Le Loi',
			surfaceType: 'hard',
			pricePerHour: 150000,
			images: JSON.stringify(['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800']),
			locationName: 'Pickleball Q1 Center',
		},
		{
			courtName: 'Court Binh Thanh - B1',
			description: 'Outdoor court, airy, easy parking.',
			province: '79',
			district: '765',
			ward: '26908',
			address: '45 Dinh Bo Linh',
			surfaceType: 'outdoor',
			pricePerHour: 120000,
			images: JSON.stringify(['https://images.unsplash.com/photo-1529926706528-db9e5010cd8e?w=800']),
			locationName: 'Pickleball Binh Thanh Hub',
		},
		{
			courtName: 'Court Thu Duc - C1',
			description: 'Modern sports complex with clean changing rooms.',
			province: '79',
			district: '769',
			ward: '26998',
			address: '88 Vo Van Ngan',
			surfaceType: 'hard',
			pricePerHour: 130000,
			images: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']),
			locationName: 'Pickleball Thu Duc Arena',
		},
	];

	for (const c of courts) {
		const locationId = locationIdByName.get(c.locationName) ?? null;
		await q.query(
			`
			INSERT INTO courts (
				id, court_name, description, province, district, ward, address,
				surface_type, price_per_hour, images, location_id, is_active, created_at, updated_at
			)
			SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW()
			WHERE NOT EXISTS (SELECT 1 FROM courts WHERE court_name = ?)
			`,
			[
				uuid(),
				c.courtName,
				c.description,
				c.province,
				c.district,
				c.ward,
				c.address,
				c.surfaceType,
				c.pricePerHour,
				c.images,
				locationId,
				c.courtName,
			],
		);
	}

	const rackets = [
		{
			name: 'Paddle Beginner X1',
			type: 'beginner',
			description: 'Lightweight paddle for new players.',
			price: 350000,
			stock: 20,
			brand: 'ProLite',
			image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400',
		},
		{
			name: 'Paddle Intermediate Pro',
			type: 'intermediate',
			description: 'Balanced power and control for regular play.',
			price: 950000,
			stock: 10,
			brand: 'Engage',
			image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400',
		},
		{
			name: 'Paddle Tournament Elite',
			type: 'professional',
			description: 'Competition-grade paddle with high spin response.',
			price: 2100000,
			stock: 5,
			brand: 'Paddletek',
			image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400',
		},
	];

	for (const r of rackets) {
		await q.query(
			`
			INSERT INTO rackets (id, name, type, description, price, stock, brand, image, is_active, created_at, updated_at)
			SELECT ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW()
			WHERE NOT EXISTS (SELECT 1 FROM rackets WHERE name = ?)
			`,
			[uuid(), r.name, r.type, r.description, r.price, r.stock, r.brand, r.image, r.name],
		);
	}

	await q.release();
	await ds.destroy();

	console.log('Seed complete: locations, courts, rackets.');
}

run().catch((err) => {
	console.error('Seed failed:', err?.message || err);
	process.exit(1);
});
