// src/payload.config.ts
// ============================================================
// Viliniu Multi-Merchant Marketplace
// Phase 1: Core collections — Users, Vendors, Products, Orders
// ============================================================

import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getPlatformProxy } from 'wrangler'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { Vendors } from './collections/Vendors'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// ── Smart Cloudflare context detection ───────────────────────
const isMigrateOrGenerate = process.argv.find((value) =>
  value.match(/^(generate|migrate):?/),
)

const cloudflare = isMigrateOrGenerate
  ? await getPlatformProxy<CloudflareEnv>()
  : await getCloudflareContext({ async: true })

// ── serverURL ─────────────────────────────────────────────────
const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'https://multistore.workers.dev'

// ── Cloudflare-compatible logger ──────────────────────────────
const isProduction = process.env.NODE_ENV === 'production'

const cloudflareLogger = {
  error: (msg: string | object, ...args: unknown[]) =>
    console.error(JSON.stringify({ level: 'error', msg, ...args })),
  warn: (msg: string | object, ...args: unknown[]) =>
    console.warn(JSON.stringify({ level: 'warn', msg, ...args })),
  info: (msg: string | object, ...args: unknown[]) =>
    console.log(JSON.stringify({ level: 'info', msg, ...args })),
  debug: (msg: string | object, ...args: unknown[]) =>
    console.debug(JSON.stringify({ level: 'debug', msg, ...args })),
  fatal: (msg: string | object, ...args: unknown[]) =>
    console.error(JSON.stringify({ level: 'fatal', msg, ...args })),
  child: () => cloudflareLogger,
  silent: () => {},
}

export default buildConfig({
  serverURL,

  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Viliniu Admin',
    },
  },

  // ── All Collections ──────────────────────────────────────────
  collections: [
    Users,
    Vendors,
    Products,
    Orders,
    Media,
  ],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── D1 SQLite database adapter ────────────────────────────────
  db: sqliteD1Adapter({
    database: cloudflare.env.DB as D1Database,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  // ── R2 storage plugin ─────────────────────────────────────────
  plugins: [
    r2Storage({
      collections: {
        media: true,
      },
      bucket: cloudflare.env.R2_BUCKET as R2Bucket,
      acl: undefined,
    }),
  ],

  // ── Cloudflare-compatible logger ──────────────────────────────
  logger: isProduction ? cloudflareLogger : undefined,
})
