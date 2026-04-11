import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Racket } from './racket.entity';

@Entity('racket_rentals')
export class RacketRental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'racket_id', type: 'uuid', nullable: true })
  racketId: string | null;

  @ManyToOne(() => Racket, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'racket_id' })
  racket: Racket;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rentalPrice: number;

  @Column({ type: 'int', comment: 'Duration in hours' })
  durationHours: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
