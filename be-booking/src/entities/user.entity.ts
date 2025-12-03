import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'admin' | 'manager' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ name: 'full_name', nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'varchar', default: 'user' })
  role: UserRole;

  @Column({ name: 'reset_token', nullable: true })
  resetToken?: string;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
