import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { UserRole } from '../../auth/auth.interface';
import { UserProfile } from './user-profile.entity';

@Entity('auth_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'text' })
  password_hash: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.user
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'is_verified', default: false })
  is_verified: boolean;

  @Column({ name: 'is_configured', default: false })
  is_configured: boolean;

  @Column({ name: 'verification_token', nullable: true, type: 'text' })
  verification_token: string | null;

  @Column({ name: 'verification_expires', nullable: true, type: 'timestamp' })
  verification_expires: Date | null;

  @Column({ name: 'reset_token', nullable: true, type: 'text' })
  reset_token: string | null;

  @Column({ name: 'reset_token_expiry', nullable: true, type: 'timestamp' })
  reset_token_expiry: Date | null;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  last_login_at: Date | null;

  @Column({ name: 'profile_uuid', nullable: true, unique: true })
  profile_uuid: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToOne(() => UserProfile, profile => profile.user)
  profile: UserProfile;
} 