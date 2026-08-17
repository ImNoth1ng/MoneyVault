export interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

/**
 * Safely parses the JSON payload from a JWT token string without external dependencies.
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    if (!base64Url) return null;

    // Replace base64url characters with standard base64 characters
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64 string handling potential UTF-8 characters
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is missing, invalid, or expired.
 * @param token JWT token string or null
 * @param bufferSeconds Optional safety margin in seconds (default: 5s)
 */
export function isTokenExpired(token: string | null, bufferSeconds: number = 5): boolean {
  if (!token) return true;

  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true; // Malformed or missing exp claim -> treat as expired
  }

  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTimeInSeconds + bufferSeconds;
}
