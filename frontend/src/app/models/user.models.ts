/**
 * enum of available user roles
 */
export type UserRole = 'admin' | 'user';

/**
 * Public user data interface
 * Used for public profile endpoints
 */
export interface User {
  name: string;
  surname: string;
  areaCode: string;
  phone: number;
  website: string;
  isWhatsappEnabled: boolean;
  isWebsiteEnabled: boolean;
  isVcardEnabled: boolean;
  slug: string;
  email: string;
  profilePhoto?: string;
}

/**
 * Private user data interface
 * Used for admin profile and operations endpoints
 */
export interface UserDetails extends User {
  uuid: string;
  role: UserRole;
  createdAt: string;
  is_configured: boolean;
  profile_photo?: string;
}

/**
 * User email interface
 * Used for body requests
 */
export interface UserEmail {
  email: string;
}

/**
 * Language interface
 * Used for language selection
 */
export interface Language {
  iso: string;
  code: string;
  lang: string;
}