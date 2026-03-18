// src/collections/Media.ts
// ============================================================
// FIX #2 (continued): Media collection configured for R2 storage.
//   - skipSafeFetch: true — uses native Workers fetch instead of
//     undici, avoiding "Failed to publish diagnostic channel message"
//     errors in Cloudflare observability logs.
//   - disableLocalStorage: true — disables disk storage fallback
//     (disk doesn't persist in Workers — R2 handles all file storage)
// ============================================================

import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Fix: disable local disk storage — R2 handles all uploads
    disableLocalStorage: true,

    // Fix: use native Workers fetch instead of undici for uploads
    // This is safe because Cloudflare Workers blocks private IP ranges
    // by default, providing built-in SSRF protection.
    skipSafeFetch: true,
  },
}
