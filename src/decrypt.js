/**
 * AllAnime video source URL decryption.
 *
 * Based on the ani-cli project's reverse-engineered decryption process.
 *
 * The AllAnime API returns encrypted video source URLs wrapped in a
 * "tobeparsed" prefix with base64-encoded data. The decryption uses
 * AES-256-CTR mode with a key derived from SHA-256("Xot36i3lK3:v1").
 *
 * Process:
 *   1. Extract the base64 payload after "tobeparsed"
 *   2. Decode base64 → binary buffer
 *   3. Skip 1 byte (header), take next 12 bytes as IV
 *   4. Append "00000002" to IV to create 16-byte counter
 *   5. Ciphertext = bytes[13 .. (len - 16)] (last 16 bytes = auth tag)
 *   6. Decrypt with aes-256-ctr using key + counter
 *   7. Parse the decrypted text for sourceName / sourceUrl pairs
 */

const crypto = require('crypto');

// Key = SHA-256("Xot36i3lK3:v1") in hex (as a Buffer)
const ALLANIME_KEY = crypto.createHash('sha256').update('Xot36i3lK3:v1').digest();

/**
 * Decrypt a single AllAnime "tobeparsed" payload.
 * Returns the decrypted plaintext string.
 */
function decryptTobeparsed(payload) {
  // Check if this is a tobeparsed payload
  if (typeof payload !== 'string' || !payload.includes('tobeparsed')) {
    return payload;
  }

  // Extract the base64 data after "tobeparsed"
  const b64 = payload.replace('tobeparsed', '');
  const buf = Buffer.from(b64, 'base64');

  if (buf.length < 29) {
    // Too small to contain header(1) + iv(12) + min ciphertext(0) + tag(16)
    return payload;
  }

  // IV: 12 bytes starting at offset 1 (skip header byte)
  const ivPart = buf.slice(1, 13);
  // Append counter "00000002" as hex bytes for 16-byte IV
  const counter = Buffer.from('00000002', 'hex');
  const iv = Buffer.concat([ivPart, counter]);

  // Ciphertext: from offset 13 to (length - 16), last 16 bytes are tag
  const ciphertext = buf.slice(13, buf.length - 16);

  // Decrypt with AES-256-CTR (no padding)
  const decipher = crypto.createDecipheriv('aes-256-ctr', ALLANIME_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Remove null bytes padding
  const plaintext = decrypted.toString('utf8').replace(/\0+$/, '');

  return plaintext;
}

/**
 * Parse decrypted source data into an array of source objects.
 * Format is like: "sourceName :: https://... sourceName :: https://..."
 * with entries separated by spaces or newlines.
 */
function parseSources(decryptedText) {
  if (!decryptedText || typeof decryptedText !== 'string') return [];

  const sources = [];

  // Try to find sourceName::sourceUrl patterns
  // The decrypted text contains entries like: "SourceName::https://url.com"
  const regex = /([^::\s][^:]*?)::\s*(\S+)/g;
  let match;
  while ((match = regex.exec(decryptedText)) !== null) {
    const sourceName = match[1].trim();
    const sourceUrl = match[2].trim();
    if (sourceName && sourceUrl && sourceUrl.startsWith('http')) {
      sources.push({ sourceName, sourceUrl });
    }
  }

  return sources;
}

/**
 * Decrypt the sourceUrls field from an AllAnime episode response.
 * Returns the parsed array of { sourceName, sourceUrl } objects.
 */
function decryptSourceUrls(sourceUrls) {
  if (!sourceUrls) return [];

  // sourceUrls may be a string or already an object/array
  let data = sourceUrls;

  // If it's a string, try to parse as JSON first (non-encrypted case)
  if (typeof data === 'string') {
    // Check if it's the "tobeparsed" encrypted format
    if (data.includes('tobeparsed')) {
      const decrypted = decryptTobeparsed(data);
      return parseSources(decrypted);
    }

    // Maybe it's a JSON stringified array
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(s => ({
          sourceName: s.sourceName || s.source_name || 'Unknown',
          sourceUrl: s.sourceUrl || s.source_url || s.sourceName,
        }));
      }
    } catch {
      // Not JSON, treat as a plain URL string
      if (data.startsWith('http')) {
        return [{ sourceName: 'Direct', sourceUrl: data }];
      }
    }
  }

  // Already an array
  if (Array.isArray(data)) {
    return data.map(s => ({
      sourceName: s.sourceName || s.source_name || 'Unknown',
      sourceUrl: s.sourceUrl || s.source_url || s.sourceName,
    }));
  }

  return [];
}

/**
 * Parse the decrypted JSON data into an array of provider source objects.
 * The decrypted data is a JSON string like:
 * {
 *   "episode": {
 *     "episodeString": "9",
 *     "sourceUrls": [
 *       { "sourceName": "Mp4", "sourceUrl": "https://mp4upload.com/embed-xxx", ... },
 *       { "sourceName": "Fm-Hls", "sourceUrl": "https://bysekoze.com/e/xxx", ... },
 *       ...
 *     ]
 *   }
 * }
 */
function parseJsonSources(decryptedText) {
  if (!decryptedText || typeof decryptedText !== 'string') return [];

  try {
    const parsed = JSON.parse(decryptedText);
    const episode = parsed.episode || parsed;
    const sourceUrls = episode.sourceUrls || [];

    if (!Array.isArray(sourceUrls)) return [];

    return sourceUrls.map(s => ({
      sourceName: s.sourceName || s.sourceOriginalName || 'Unknown',
      sourceUrl: s.sourceUrl || '',
      sourceOriginalName: s.sourceOriginalName || '',
      priority: s.priority || 0,
      type: s.sourceUrl && s.sourceUrl.includes('embed') ? 'embed' : 'direct',
    })).filter(s => s.sourceUrl);
  } catch (e) {
    // Not JSON, try the legacy format
    return [];
  }
}

module.exports = {
  decryptTobeparsed,
  decryptSourceUrls,
  parseSources,
  parseJsonSources,
  ALLANIME_KEY,
};
