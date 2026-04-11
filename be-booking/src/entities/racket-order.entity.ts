import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export type RacketOrderStatus =
  | 'new'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled';
export type RacketPaymentMethod = 'cod' | 'sepay';
export type RacketPaymentStatus = 'pending' | 'paid' | 'cod_pending';

@Entity('racket_orders')
export class RacketOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_code', unique: true })
  orderCode!: string;

  @Column({ name: 'customer_name', nullable: true })
  customerName?: string;

  @Column({ name: 'customer_phone', nullable: true })
  customerPhone?: string;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 20,
    default: 'cod',
  })
  paymentMethod!: RacketPaymentMethod;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  paymentStatus!: RacketPaymentStatus;

  @Column({ name: 'order_status', type: 'varchar', length: 20, default: 'new' })
  orderStatus!: RacketOrderStatus;

  @Column({ type: 'json' })
  items!: Array<{
    racketId: string;
    name: string;
    price: number;
    quantity: number;
  }>;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total!: number;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
