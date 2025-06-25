import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserRole } from '../auth.interface';
import { UserProfile } from '../../users/entities/user-profile.entity';

/**
 * User entity representing a system user
 * Maps to the 'auth_users' table in the database
 */
@Entity('auth_users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ name: 'password_hash' })
    password_hash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
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

    @Column({ name: 'profile_uuid', nullable: true, unique: true, type: 'uuid' })
    profile_uuid: string | null;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @OneToOne(() => UserProfile, profile => profile.user)
    @JoinColumn({ name: 'profile_uuid', referencedColumnName: 'uuid' })
    profile: UserProfile;
}