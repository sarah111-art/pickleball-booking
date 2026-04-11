import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Default business hours: Mon–Sun 06:00–22:00
const DEFAULT_BUSINESS_HOURS = [
  { day: 0, label: 'Chủ nhật',  open: '06:00', close: '22:00', enabled: true },
  { day: 1, label: 'Thứ 2',     open: '06:00', close: '22:00', enabled: true },
  { day: 2, label: 'Thứ 3',     open: '06:00', close: '22:00', enabled: true },
  { day: 3, label: 'Thứ 4',     open: '06:00', close: '22:00', enabled: true },
  { day: 4, label: 'Thứ 5',     open: '06:00', close: '22:00', enabled: true },
  { day: 5, label: 'Thứ 6',     open: '06:00', close: '22:00', enabled: true },
  { day: 6, label: 'Thứ 7',     open: '06:00', close: '22:00', enabled: true },
];

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // fee (percentage or fixed) — keep as numeric
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'text', nullable: true })
  policy?: string;

  // minutes before booking allowed to cancel
  @Column({ name: 'cancel_time_limit', type: 'int', default: 60 })
  cancelTimeLimit: number;

  // JSON array of { day, label, open, close, enabled }
  @Column({ name: 'business_hours', type: 'text', nullable: true })
  businessHoursRaw?: string;

  @Column({ name: 'hero_title', type: 'varchar', length: 255, nullable: true })
  heroTitle?: string;

  @Column({ name: 'hero_highlight', type: 'varchar', length: 255, nullable: true })
  heroHighlight?: string;

  @Column({ name: 'hero_description', type: 'text', nullable: true })
  heroDescription?: string;

  @Column({ name: 'hero_image_url', type: 'text', nullable: true })
  heroImageUrl?: string;

  @Column({ name: 'footer_brand_name', type: 'varchar', length: 255, nullable: true })
  footerBrandName?: string;

  @Column({ name: 'footer_description', type: 'text', nullable: true })
  footerDescription?: string;

  @Column({ name: 'footer_phone', type: 'varchar', length: 100, nullable: true })
  footerPhone?: string;

  @Column({ name: 'footer_email', type: 'varchar', length: 255, nullable: true })
  footerEmail?: string;

  @Column({ name: 'footer_address', type: 'text', nullable: true })
  footerAddress?: string;

  @Column({ name: 'footer_copyright', type: 'varchar', length: 255, nullable: true })
  footerCopyright?: string;

  get businessHours() {
    try {
      return this.businessHoursRaw ? JSON.parse(this.businessHoursRaw) : DEFAULT_BUSINESS_HOURS;
    } catch {
      return DEFAULT_BUSINESS_HOURS;
    }
  }
}
