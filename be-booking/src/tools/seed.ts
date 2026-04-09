/**
 * Seed script - chạy: npx ts-node -r tsconfig-paths/register src/tools/seed.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Đọc .env thủ công
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const uuid = () => crypto.randomUUID();

// ───────────────────────────── DataSource ─────────────────────────────
const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_DATABASE || 'pickleball_booking',
  synchronize: false,
  entities: [],
});

async function run() {
  await ds.initialize();
  const q = ds.createQueryRunner();
  await q.connect();

  console.log('✅ Kết nối DB thành công\n');

  // ─── 1. USERS ───────────────────────────────────────────────────────
  console.log('📦 Seeding users...');
  const pwAdmin   = await bcrypt.hash('Admin@123', 10);
  const pwManager = await bcrypt.hash('Manager@123', 10);
  const pwStaff   = await bcrypt.hash('Staff@123', 10);
  const pwUser    = await bcrypt.hash('User@123', 10);

  const adminId   = uuid();
  const managerId = uuid();
  const staffId   = uuid();
  const user1Id   = uuid();
  const user2Id   = uuid();
  const user3Id   = uuid();

  const users = [
    { id: adminId,   email: 'admin@pickleball.vn',   password: pwAdmin,   full_name: 'Admin Hệ Thống', phone: '0900000001', role: 'admin' },
    { id: managerId, email: 'manager@pickleball.vn', password: pwManager, full_name: 'Quản Lý Sân',    phone: '0900000002', role: 'manager' },
    { id: staffId,   email: 'staff@pickleball.vn',   password: pwStaff,   full_name: 'Nhân Viên 1',    phone: '0900000003', role: 'user' },
    { id: user1Id,   email: 'nguyenvana@gmail.com',  password: pwUser,    full_name: 'Nguyễn Văn A',   phone: '0912345671', role: 'user' },
    { id: user2Id,   email: 'tranthib@gmail.com',    password: pwUser,    full_name: 'Trần Thị B',     phone: '0912345672', role: 'user' },
    { id: user3Id,   email: 'lehongc@gmail.com',     password: pwUser,    full_name: 'Lê Hồng C',      phone: '0912345673', role: 'user' },
  ];

  for (const u of users) {
    await q.query(
      `INSERT IGNORE INTO users (id, email, password, full_name, phone, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [u.id, u.email, u.password, u.full_name, u.phone, u.role],
    );
  }
  console.log(`  → ${users.length} users\n`);

  // ─── 2. COURTS ──────────────────────────────────────────────────────
  console.log('📦 Seeding courts...');
  const court1Id = uuid();
  const court2Id = uuid();
  const court3Id = uuid();
  const court4Id = uuid();

  const courts = [
    {
      id: court1Id, court_name: 'Sân Pickleball Quận 1 - A1',
      description: 'Sân pickleball tiêu chuẩn quốc tế, mặt sân nhựa tổng hợp, hệ thống đèn LED hiện đại.',
      province: '79', district: '760', ward: '26743', address: '12 Lê Lợi',
      surface_type: 'hard', price_per_hour: 150000,
      images: JSON.stringify(['https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800']),
    },
    {
      id: court2Id, court_name: 'Sân Pickleball Quận 1 - A2',
      description: 'Sân trong nhà, điều hòa mát mẻ, phù hợp thi đấu cả ngày.',
      province: '79', district: '760', ward: '26743', address: '12 Lê Lợi',
      surface_type: 'hard', price_per_hour: 180000,
      images: JSON.stringify(['https://images.unsplash.com/photo-1544991875-5dc1b05f5eb8?w=800']),
    },
    {
      id: court3Id, court_name: 'Sân Pickleball Bình Thạnh - B1',
      description: 'Sân ngoài trời thoáng mát, view đẹp, bãi đỗ xe rộng.',
      province: '79', district: '765', ward: '26908', address: '45 Đinh Bộ Lĩnh',
      surface_type: 'outdoor', price_per_hour: 120000,
      images: JSON.stringify(['https://images.unsplash.com/photo-1529926706528-db9e5010cd8e?w=800']),
    },
    {
      id: court4Id, court_name: 'Sân Pickleball Thủ Đức - C1',
      description: 'Khu phức hợp thể thao hiện đại, đầy đủ tiện nghi, phòng thay đồ sạch sẽ.',
      province: '79', district: '769', ward: '26998', address: '88 Võ Văn Ngân',
      surface_type: 'hard', price_per_hour: 130000,
      images: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']),
    },
  ];

  for (const c of courts) {
    await q.query(
      `INSERT IGNORE INTO courts (id, court_name, description, province, district, ward, address, surface_type, price_per_hour, images, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [c.id, c.court_name, c.description, c.province, c.district, c.ward, c.address, c.surface_type, c.price_per_hour, c.images],
    );
  }
  console.log(`  → ${courts.length} courts\n`);

  // ─── 3. TIMESLOTS ───────────────────────────────────────────────────
  console.log('📦 Seeding timeslots...');
  const timeRanges = [
    { start: '06:00', end: '07:30' },
    { start: '07:30', end: '09:00' },
    { start: '09:00', end: '10:30' },
    { start: '10:30', end: '12:00' },
    { start: '14:00', end: '15:30' },
    { start: '15:30', end: '17:00' },
    { start: '17:00', end: '18:30' },
    { start: '18:30', end: '20:00' },
    { start: '20:00', end: '21:30' },
  ];

  // Tạo timeslots cho 7 ngày tới
  const today = new Date();
  let slotCount = 0;
  for (const court of [court1Id, court2Id, court3Id, court4Id]) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];

      for (const t of timeRanges) {
        await q.query(
          `INSERT IGNORE INTO timeslots (id, courtId, date, start_time, end_time, is_booked, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
          [uuid(), court, dateStr, t.start, t.end],
        );
        slotCount++;
      }
    }
  }
  console.log(`  → ${slotCount} timeslots\n`);

  // ─── 4. PRODUCTS ────────────────────────────────────────────────────
  console.log('📦 Seeding products...');
  const products = [
    { name: 'Nước Suối Aquafina 500ml', category: 'water', price: 10000, stock: 200, description: 'Nước tinh khiết, bổ sung năng lượng sau khi chơi.',         image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
    { name: 'Nước Tăng Lực Redbull',   category: 'drink', price: 25000, stock: 100, description: 'Tăng lực, tỉnh táo, phù hợp trước khi vào sân.',             image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=400' },
    { name: 'Nước Gatorade Xanh',       category: 'drink', price: 20000, stock: 150, description: 'Bù điện giải, dành cho vận động viên.',                      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400' },
    { name: 'Bánh Snack Oishi',         category: 'snack', price: 10000, stock: 300, description: 'Bánh snack giòn, vị khoai tây, ăn nhẹ giữa giờ.',           image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400' },
    { name: 'Kẹo Năng Lượng GU',        category: 'snack', price: 35000, stock: 80,  description: 'Kẹo dẻo bổ sung carb và điện giải cho vận động.',            image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fb6b8?w=400' },
    { name: 'Chuối Tươi',               category: 'snack', price: 8000,  stock: 50,  description: 'Bổ sung kali tự nhiên, phù hợp ăn trước và sau chơi.',      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
    { name: 'Nước Dừa Tươi',            category: 'drink', price: 30000, stock: 60,  description: 'Nước dừa tươi nguyên chất, bù nước cực tốt.',               image: 'https://images.unsplash.com/photo-1544806628-38c4b614e8a2?w=400' },
    { name: 'Khăn Lạnh Thể Thao',       category: 'other', price: 15000, stock: 120, description: 'Khăn làm mát da sau khi vận động mạnh.',                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  ];

  const productIds: string[] = [];
  for (const p of products) {
    const id = uuid();
    productIds.push(id);
    await q.query(
      `INSERT IGNORE INTO products (id, name, description, category, price, stock, image, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [id, p.name, p.description, p.category, p.price, p.stock, p.image],
    );
  }
  console.log(`  → ${products.length} products\n`);

  // ─── 5. RACKETS ─────────────────────────────────────────────────────
  console.log('📦 Seeding rackets...');
  const rackets = [
    { name: 'Vợt Pickleball Beginner X1', type: 'beginner',     price: 350000, stock: 20, brand: 'ProLite',   description: 'Vợt dành cho người mới chơi, nhẹ, dễ điều khiển.', image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400' },
    { name: 'Vợt Pickleball Beginner X2', type: 'beginner',     price: 420000, stock: 15, brand: 'Gamma',     description: 'Mặt vợt sợi carbon cơ bản, phù hợp tập luyện.',    image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400' },
    { name: 'Vợt Pickleball Selkirk Pro', type: 'intermediate', price: 850000, stock: 10, brand: 'Selkirk',   description: 'Cân bằng tốt giữa lực và control, phù hợp trung cấp.', image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400' },
    { name: 'Vợt Pickleball Engage Pro', type: 'intermediate',  price: 950000, stock: 8,  brand: 'Engage',    description: 'Vợt polymer cao cấp, kiểm soát bóng xuất sắc.',     image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400' },
    { name: 'Vợt Pickleball Head Extreme', type: 'professional', price: 1800000, stock: 5, brand: 'HEAD',      description: 'Vợt thi đấu chuyên nghiệp, độ nảy cực tốt.',       image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400' },
    { name: 'Vợt Pickleball Paddletek Pro', type: 'professional', price: 2100000, stock: 3, brand: 'Paddletek', description: 'Top-tier, dành cho vận động viên chuyên nghiệp.',   image: 'https://images.unsplash.com/photo-1617083934555-ac7aa4a2571f?w=400' },
  ];

  const racketIds: string[] = [];
  for (const r of rackets) {
    const id = uuid();
    racketIds.push(id);
    await q.query(
      `INSERT IGNORE INTO rackets (id, name, type, description, price, stock, brand, image, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [id, r.name, r.type, r.description, r.price, r.stock, r.brand, r.image],
    );
  }
  console.log(`  → ${rackets.length} rackets\n`);

  // ─── 6. RACKET RENTALS ──────────────────────────────────────────────
  console.log('📦 Seeding racket rentals...');
  const rentals = [
    { racket_id: racketIds[0], rental_price: 30000,  duration_hours: 1, stock: 10 },
    { racket_id: racketIds[1], rental_price: 40000,  duration_hours: 1, stock: 8  },
    { racket_id: racketIds[2], rental_price: 60000,  duration_hours: 1, stock: 6  },
    { racket_id: racketIds[3], rental_price: 70000,  duration_hours: 1, stock: 5  },
    { racket_id: racketIds[4], rental_price: 100000, duration_hours: 1, stock: 3  },
    { racket_id: racketIds[0], rental_price: 50000,  duration_hours: 2, stock: 10 },
    { racket_id: racketIds[2], rental_price: 100000, duration_hours: 2, stock: 6  },
  ];

  for (const r of rentals) {
    await q.query(
      `INSERT IGNORE INTO racket_rentals (id, racketId, rentalPrice, durationHours, stock, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [uuid(), r.racket_id, r.rental_price, r.duration_hours, r.stock],
    );
  }
  console.log(`  → ${rentals.length} racket rentals\n`);

  // ─── 7. REVIEWS ─────────────────────────────────────────────────────
  console.log('📦 Seeding reviews...');
  const reviews = [
    { court_id: court1Id, user_id: user1Id, rating: 5, comment: 'Sân đẹp, sạch sẽ, nhân viên thân thiện. Sẽ quay lại!' },
    { court_id: court1Id, user_id: user2Id, rating: 4, comment: 'Sân tốt, ánh sáng đầy đủ. Giá hơi cao nhưng chất lượng xứng đáng.' },
    { court_id: court2Id, user_id: user3Id, rating: 5, comment: 'Sân trong nhà rất mát mẻ, đặt lịch dễ dàng qua app.' },
    { court_id: court3Id, user_id: user1Id, rating: 4, comment: 'Vị trí thuận tiện, bãi đỗ xe rộng. Sân ngoài trời thoáng mát.' },
    { court_id: court4Id, user_id: user2Id, rating: 5, comment: 'Khu phức hợp hiện đại, phòng thay đồ sạch sẽ, có café nghỉ ngơi.' },
    { court_id: court4Id, user_id: user3Id, rating: 3, comment: 'Sân ổn nhưng hơi xa trung tâm. Cần cải thiện bãi đỗ xe.' },
  ];

  for (const r of reviews) {
    await q.query(
      `INSERT IGNORE INTO reviews (id, courtId, userId, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [uuid(), r.court_id, r.user_id, r.rating, r.comment],
    );
  }
  console.log(`  → ${reviews.length} reviews\n`);

  await q.release();
  await ds.destroy();

  console.log('🎉 Seed hoàn tất!\n');
  console.log('📋 Tài khoản đăng nhập admin panel:');
  console.log('   Admin   : admin@pickleball.vn   / Admin@123');
  console.log('   Manager : manager@pickleball.vn / Manager@123');
  console.log('   Staff   : staff@pickleball.vn   / Staff@123\n');
}

run().catch((err) => {
  console.error('❌ Seed thất bại:', err.message);
  process.exit(1);
});
