import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Court } from './court.entity';
import { User } from './user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Court, { onDelete: 'CASCADE', eager: true })
  court: Court;

  @ManyToOne(() => User, { onDelete: 'SET NULL', eager: true })
  user: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
