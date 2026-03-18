// src/payload.config.ts
// ============================================================
// FIX SUMMARY:
//   Fix #2: r2Storage plugin added — wires R2_BUCKET to media uploads
//   Fix #3: PAYLOAD_SECRET read from process.env (set via wrangler secret)
//   Fix #4: serverURL read from NEXT_PUBLIC_SERVER_URL env var
//   Bonus: Cloudflare-compatible logger kept (no pino-pretty in Workers)
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
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// ── Smart Cloudflare context detection ───────────────────────
// During `payload migrate:create` or `payload generate:*`, we use
// Wrangler's getPlatformProxy() to get D1 bindings locally.
// At runtime (in the actual Worker), we use getCloudflareContext().
const isMigrateOrGenerate = process.argv.find((value) =>
  value.match(/^(generate|migrate):?/),
)

const cloudflare = isMigrateOrGenerate
  ? await getPlatformProxy<CloudflareEnv>()
  : await getCloudflareContext({ async: true })

// ── Fix #4: serverURL ─────────────────────────────────────────
// Set NEXT_PUBLIC_SERVER_URL in wrangler.jsonc vars to your deployed URL.
// Example: "https://multistore.<your-subdomain>.workers.dev"
const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'https://multistore.workers.dev'

// ── Cloudflare-compatible logger ──────────────────────────────
// Payload's default pino-pretty logger uses Node.js fs APIs not
// available in Workers. This routes logs through console.* instead.
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
  // ── Fix #4: serverURL ───────────────────────────────────────
  serverURL,

  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [Users, Media],

  editor: lexicalEditor(),

  // ── Fix #3: PAYLOAD_SECRET ───────────────────────────────────
  // This is read from the Worker Secret you set via:
  //   pnpm wrangler secret put PAYLOAD_SECRET
  // It will be available as process.env.PAYLOAD_SECRET at runtime.
  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── D1 database adapter ───────────────────────────────────────
  db: sqliteD1Adapter({
    database: cloudflare.env.DB as D1Database,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  // ── Fix #2: R2 storage plugin ─────────────────────────────────
  // Wires the "multistore" R2 bucket to the Media collection.
  // Files will be stored in R2 and served from R2_PUBLIC_DOMAIN.
  plugins: [
    r2Storage({
      collections: {
        media: true,
      },
      bucket: cloudflare.env.R2_BUCKET as R2Bucket,
      // Optional: set a public base URL for serving uploaded files.
      // This should be your R2 public bucket domain or custom domain.
      // Set R2_PUBLIC_DOMAIN in wrangler.jsonc vars.
      acl: undefined, // R2 doesn't use ACLs — access is controlled by Cloudflare
    }),
  ],

  // ── Cloudflare-compatible logger ──────────────────────────────
  logger: isProduction ? cloudflareLogger : undefined,
})
