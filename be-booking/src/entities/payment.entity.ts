import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from './booking.entity';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE', eager: true })
  booking: Booking;

  @Column()
  provider: string; // momo/vnpay/zalo

  @Column({ type: 'varchar', nullable: true })
  providerOrderId?: string;

  @Column({ type: 'text', nullable: true })
  qrUrl?: string;

  @Column({ type: 'text', nullable: true })
  paymentUrl?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: PaymentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
