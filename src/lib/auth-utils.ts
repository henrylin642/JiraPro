import { createHmac, timingSafeEqual } from 'crypto';

const SECRET_KEY = process.env.AUTH_SECRET || 'dev-secret-key-do-not-use-in-prod';

/**
 * Signs a payload with HMAC-SHA256 and returns a signed token.
 * Format: base64url(payload).signature
 */
export function signToken(payload: string): string {
    const payloadBase64 = Buffer.from(payload).toString('base64url');
    const signature = createHmac('sha256', SECRET_KEY)
        .update(payloadBase64)
        .digest('base64url');
    return `${payloadBase64}.${signature}`;
}

/**
 * Verifies a signed token and returns the original payload if valid.
 * Returns null if the signature is invalid or token is malformed.
 */
export function verifyToken(token: string): string | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;

    // Verify signature
    const expectedSignature = createHmac('sha256', SECRET_KEY)
        .update(payloadBase64)
        .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // Use constant-time comparison to prevent timing attacks
    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
    }

    // Decode payload
    try {
        return Buffer.from(payloadBase64, 'base64url').toString();
    } catch {
        return null;
    }
}
