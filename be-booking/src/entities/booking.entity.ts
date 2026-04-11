import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Court } from './court.entity';
import { User } from './user.entity';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'paid';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  user: User;

  @ManyToOne(() => Court, { eager: true, onDelete: 'SET NULL' })
  court: Court;

  @Column({ name: 'start_time', nullable: true })
  startTime: string; // e.g., '14:00'

  @Column({ name: 'end_time', nullable: true })
  endTime: string; // e.g., '17:00'

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod?: string;

  @Column({ type: 'int', default: 50 })
  paymentPercentage: number; // 50 hay 100

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 120, nullable: true })
  customerName?: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 30, nullable: true })
  customerPhone?: string;

  @Column({ type: 'text', nullable: true })
  bookingItems?: string; // JSON array of {productId, quantity, price} hoặc {racketRentalId, hours, price}

  @Column({ type: 'varchar', default: 'pending' })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  courtPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  productPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rentalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
