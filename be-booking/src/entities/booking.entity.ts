import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Court } from './court.entity';
import { TimeSlot } from './timeslot.entity';
import { User } from './user.entity';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'paid';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  user: User;

  @ManyToOne(() => Court, { eager: true, onDelete: 'SET NULL' })
  court: Court;

  @ManyToOne(() => TimeSlot, { eager: true, onDelete: 'SET NULL' })
  slot: TimeSlot;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
