import 'reflect-metadata';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';

const uuid = () => crypto.randomUUID();
const databaseUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL;

if (!databaseUrl) {
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

  console.log('Connected to cloud DB. Seeding products...');

  const products = [
    {
      name: 'Nuoc Suoi Aquafina 500ml',
      category: 'water',
      price: 10000,
      stock: 200,
      description: 'Nuoc tinh khiet, bo sung nang luong sau khi choi.',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    },
    {
      name: 'Nuoc Tang Luc Redbull',
      category: 'drink',
      price: 25000,
      stock: 100,
      description: 'Tang luc, tinh tao, phu hop truoc khi vao san.',
      image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400',
    },
    {
      name: 'Nuoc Gatorade Xanh',
      category: 'drink',
      price: 20000,
      stock: 150,
      description: 'Bu dien giai, danh cho van dong vien.',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
    },
    {
      name: 'Banh Snack Oishi',
      category: 'snack',
      price: 10000,
      stock: 300,
      description: 'Banh snack gion, an nhe giua gio.',
      image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400',
    },
    {
      name: 'Keo Nang Luong GU',
      category: 'snack',
      price: 35000,
      stock: 80,
      description: 'Keo deo bo sung carb va dien giai cho van dong.',
      image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fb6b8?w=400',
    },
    {
      name: 'Nuoc Dua Tuoi',
      category: 'drink',
      price: 30000,
      stock: 60,
      description: 'Nuoc dua tuoi nguyen chat, bu nuoc tot.',
      image: 'https://images.unsplash.com/photo-1544806628-38c4b614e8a2?w=400',
    },
  ];

  for (const p of products) {
    await q.query(
      `
      INSERT INTO products (id, name, description, category, price, stock, image, is_active, created_at, updated_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = ?)
      `,
      [uuid(), p.name, p.description, p.category, p.price, p.stock, p.image, p.name],
    );
  }

  const rows = await q.query('SELECT COUNT(*) AS c FROM products');
  console.log(`Seed complete: products=${rows[0]?.c ?? 0}`);

  await q.release();
  await ds.destroy();
}

run().catch((err) => {
  console.error('Seed failed:', err?.message || err);
  process.exit(1);
});
