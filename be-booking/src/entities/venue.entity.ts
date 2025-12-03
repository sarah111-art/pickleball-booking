import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Location } from './location.entity';
import { Court } from './court.entity';

@Entity('venues')
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'time', nullable: true })
  open_time: string;

  @Column({ type: 'time', nullable: true })
  close_time: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  location_id: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @OneToMany(() => Court, (court) => court.venue)
  courts: Court[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

