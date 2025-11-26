import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Court } from './court.entity';

@Entity('timeslots')
export class TimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Court, { onDelete: 'CASCADE' })
  court: Court;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ name: 'start_time' })
  start: string; // HH:MM

  @Column({ name: 'end_time' })
  end: string; // HH:MM

  @Column({ name: 'is_booked', default: false })
  isBooked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
