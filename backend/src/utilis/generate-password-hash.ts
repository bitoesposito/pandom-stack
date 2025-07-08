import * as bcrypt from 'bcryptjs';

/**
 * Password Hash Generator Utility
 * 
 * Standalone utility script for generating bcrypt password hashes.
 * Useful for creating initial passwords, testing, or manual hash generation
 * outside of the main application context.
 * 
 * Features:
 * - Generates bcrypt hashes with configurable salt rounds
 * - Uses the same salt rounds as the main application (12)
 * - Provides both password and hash output for verification
 * - Error handling for hash generation failures
 * 
 * Usage:
 * - Modify the password variable to generate hash for different passwords
 * - Run with: npx ts-node src/utilis/generate-password-hash.ts
 * - Use the generated hash in database seeding or testing
 * 
 * Security:
 * - Uses bcryptjs for secure password hashing
 * - Salt rounds set to 12 (same as application)
 * - Generates cryptographically secure hashes
 * 
 * @example
 * // Output:
 * // Password: Password1!
 * // Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKqKq
 * 
 * @example
 * // Usage in database seeding
 * const hashedPassword = await bcrypt.hash('admin123', 12);
 * // Use hashedPassword in user creation
 */
async function generateHash() {
    // Configuration
    const password = 'Password1!'; // Password to hash - modify as needed
    const saltRounds = 12; // Same salt rounds used in the main application

    try {
        // Generate bcrypt hash
        const hash = await bcrypt.hash(password, saltRounds);
        
        // Output results for verification
        console.log('Password:', password);
        console.log('Hash:', hash);
        console.log('Salt Rounds:', saltRounds);
        
        // Optional: Verify the hash works correctly
        const isValid = await bcrypt.compare(password, hash);
        console.log('Hash Verification:', isValid ? 'SUCCESS' : 'FAILED');
        
    } catch (error) {
        console.error('Error generating hash:', error);
        process.exit(1);
    }
}

// Execute the hash generation
generateHash(); 