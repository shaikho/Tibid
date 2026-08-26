import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'

import * as schema from './schema'

/**
 * One database module, two drivers.
 *
 *  - Neon connection string (the Vercel default)  → `neon-http`, the serverless
 *    HTTP driver. No connection pooling headaches on Lambda, fastest cold start.
 *  - Any other Postgres URL (local dev, Supabase, self-hosted, Docker) →
 *    `node-postgres`.
 *
 * The driver is chosen from DATABASE_URL, so nothing needs configuring either way.
 */

type Db = ReturnType<typeof drizzleNeon<typeof schema>>

let instance: Db | null = null

function isNeon(url: string): boolean {
  try {
    return /(^|\.)neon\.(tech|build)$/i.test(new URL(url).hostname)
  } catch {
    return false
  }
}

function connect(): Db {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. In Vercel: Storage → Neon → Connect (it injects DATABASE_URL ' +
        'automatically). Locally: copy .env.example to .env.local and paste your connection string.',
    )
  }

  if (isNeon(connectionString)) {
    return drizzleNeon(neon(connectionString), { schema })
  }

  return drizzlePg(connectionString, { schema }) as unknown as Db
}

/**
 * Lazy singleton. The connection is only created on first query, so importing
 * this module during a build without DATABASE_URL set does not blow up.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    instance ??= connect()
    const value = Reflect.get(instance as object, prop, receiver)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export { schema }
export * from './schema'
