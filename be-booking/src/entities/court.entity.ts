import { Column, CreateDateColumn, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Venue } from './venue.entity';

@Entity('courts')
export class Court {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'court_name' })
  courtName: string;

  @Column({ name: 'surface_type', nullable: true })
  surfaceType?: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ name: 'price_per_hour', type: 'decimal', precision: 10, scale: 2, default: 0 })
  pricePerHour: number;

  @Column({ name: 'images', type: 'text', nullable: true, transformer: {
    to: (value: string[] | null) => value ? JSON.stringify(value) : null,
    from: (value: string | null) => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        // If it's a plain URL string, wrap it in array
        return value.startsWith('http') ? [value] : null;
      }
    }
  }})
  images?: string[];

  @Column({ name: 'venue_id', nullable: true })
  venueId: string;

  @ManyToOne(() => Venue, { nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue?: Venue;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
