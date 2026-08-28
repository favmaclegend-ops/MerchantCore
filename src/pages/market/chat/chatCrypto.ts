/**
 * Market Chat — Web Crypto end-to-end encryption.
 *
 * Mirrors the backend primitives in ``app/core/chat_crypto.py``:
 *
 *   * generateKeypair()            -> { publicKeyPem, privateKeyPem }  (RSA-OAEP-2048-SHA256)
 *   * unwrapThreadKey(privatePem, wrappedB64) -> base64 AES-256 key
 *   * encryptPayload(keyB64, text) -> { ciphertext, iv } (AES-256-GCM, base64)
 *   * decryptPayload(keyB64, ctB64, ivB64)     -> plaintext
 *
 * The private key never leaves the client; only the public key (and public-key
 * wrapped secrets) are ever sent to the server.
 */

const KEY_STORAGE = 'market_chat_keys_v1'
const KEY_ALGO = { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }

// ---------------------------------------------------------------------------
// Base64 <-> ArrayBuffer helpers (binary-safe)
// ---------------------------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')
  return base64ToArrayBuffer(b64)
}

function bufferToPem(buffer: ArrayBuffer, label: string): string {
  const b64 = arrayBufferToBase64(buffer)
  const wrapped = b64.match(/.{1,64}/g)?.join('\n') ?? b64
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`
}

// ---------------------------------------------------------------------------
// Key pair lifecycle
// ---------------------------------------------------------------------------

/** Generate a fresh RSA-OAEP key pair exported as PEM (SPKI public, PKCS8 private). */
export async function generateKeypair(): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  const keyPair = await crypto.subtle.generateKey(KEY_ALGO, true, ['encrypt', 'decrypt'])
  const [publicBuf, privateBuf] = await Promise.all([
    crypto.subtle.exportKey('spki', keyPair.publicKey),
    crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
  ])
  return {
    publicKeyPem: bufferToPem(publicBuf, 'PUBLIC KEY'),
    privateKeyPem: bufferToPem(privateBuf, 'PRIVATE KEY'),
  }
}

/**
 * Return (and lazily create + persist) the local key pair for a participant.
 * The private key is stored only in the browser's localStorage.
 */
export async function getOrCreateKeypair(): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  try {
    const raw = localStorage.getItem(KEY_STORAGE)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.publicKeyPem && parsed?.privateKeyPem) return parsed
    }
  } catch {
    // fall through to regeneration
  }
  const fresh = await generateKeypair()
  try {
    localStorage.setItem(KEY_STORAGE, JSON.stringify(fresh))
  } catch {
    // storage unavailable — key is still usable for this session
  }
  return fresh
}

/** Forget the local key pair (used when clearing chat data / logging out). */
export function clearKeypair(): void {
  try {
    localStorage.removeItem(KEY_STORAGE)
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Key unwrap (RSA-OAEP) + payload (AES-256-GCM)
// ---------------------------------------------------------------------------

/** Recover the shared base64 AES-256 thread key from an RSA-wrapped value. */
export async function unwrapThreadKey(privateKeyPem: string, wrappedB64: string): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  )
  const plaintext = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(wrappedB64),
  )
  return arrayBufferToBase64(plaintext)
}

async function importAesKey(keyB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', base64ToArrayBuffer(keyB64), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/** Encrypt a UTF-8 message with the shared thread key. Returns base64 (ciphertext, iv). */
export async function encryptPayload(keyB64: string, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await importAesKey(keyB64)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  return { ciphertext: arrayBufferToBase64(ciphertext), iv: arrayBufferToBase64(iv.buffer) }
}

/** Decrypt an AES-GCM payload produced by encryptPayload or the backend. */
export async function decryptPayload(keyB64: string, ciphertextB64: string, ivB64: string): Promise<string> {
  const key = await importAesKey(keyB64)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(ivB64) },
    key,
    base64ToArrayBuffer(ciphertextB64),
  )
  return new TextDecoder().decode(plaintext)
}
