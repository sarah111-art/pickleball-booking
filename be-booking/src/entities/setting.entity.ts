import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
