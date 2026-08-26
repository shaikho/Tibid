import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Password hashing with Node's built-in scrypt — no native modules, no extra
 * dependency, and safe defaults. Node runtime only (never import from
 * middleware, which runs on the Edge runtime).
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>

const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH)
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  try {
    const salt = Buffer.from(parts[1], 'base64url')
    const expected = Buffer.from(parts[2], 'base64url')
    const derived = await scryptAsync(password.normalize('NFKC'), salt, expected.length)
    return expected.length === derived.length && timingSafeEqual(expected, derived)
  } catch {
    return false
  }
}
