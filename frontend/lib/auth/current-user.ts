export interface CurrentUser {
  id: string;
  username: string;
  roles: string[];
}

/**
 * Placeholder for future auth wiring.
 * RFC-001 scope keeps this as a boundary contract only.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return null;
}
