import crypto from 'crypto';

/**
 * Parse and verify a Meta (Facebook/Instagram) `signed_request`.
 *
 * Meta POSTs `signed_request` to the Deauthorize and Data Deletion callbacks.
 * Format: `<base64url(HMAC-SHA256 sig)>.<base64url(JSON payload)>`
 * The signature is HMAC-SHA256 of the raw payload segment, keyed by the app secret.
 *
 * Returns the decoded payload object on success, or null if the signature is
 * invalid / malformed. Never throws on bad input.
 *
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
export interface MetaSignedRequest {
  /** App-scoped Facebook user id of the person who triggered the callback. */
  user_id?: string;
  algorithm?: string;
  issued_at?: number;
  [key: string]: unknown;
}

function base64UrlDecode(input: string): Buffer {
  // Restore standard base64 padding/charset before decoding.
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

export function parseSignedRequest(
  signedRequest: string | null | undefined,
  appSecret = process.env.FACEBOOK_APP_SECRET
): MetaSignedRequest | null {
  if (!signedRequest || !appSecret) return null;

  const parts = signedRequest.split('.');
  if (parts.length !== 2) return null;

  const [encodedSig, payload] = parts;

  let providedSig: Buffer;
  let expectedSig: Buffer;
  try {
    providedSig = base64UrlDecode(encodedSig);
    expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();
  } catch {
    return null;
  }

  // Constant-time comparison; lengths must match for timingSafeEqual.
  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(providedSig, expectedSig)
  ) {
    return null;
  }

  try {
    const json = base64UrlDecode(payload).toString('utf8');
    const data = JSON.parse(json) as MetaSignedRequest;
    if (data.algorithm && data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
