import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'verified', 'createdAt'],
  },
  auth: true,
  fields: [
    // ── Identity ─────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    // ── Role ─────────────────────────────────────────────────────
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      saveToJWT: true,
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Vendor', value: 'vendor' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        // Only admins can change roles
        update: ({ req: { user } }) =>
          Boolean(user?.role === 'admin'),
      },
    },
    // ── Address ───────────────────────────────────────────────────
    {
      name: 'address',
      type: 'group',
      fields: [
        {
          name: 'street',
          type: 'text',
          label: 'Street Address',
        },
        {
          name: 'city',
          type: 'select',
          label: 'City',
          options: [
            { label: 'Suva', value: 'suva' },
            { label: 'Nadi', value: 'nadi' },
            { label: 'Lautoka', value: 'lautoka' },
            { label: 'Labasa', value: 'labasa' },
            { label: 'Savusavu', value: 'savusavu' },
            { label: 'Sigatoka', value: 'sigatoka' },
            { label: 'Ba', value: 'ba' },
            { label: 'Tavua', value: 'tavua' },
            { label: 'Rakiraki', value: 'rakiraki' },
            { label: 'Korovou', value: 'korovou' },
            { label: 'Navua', value: 'navua' },
          ],
        },
        {
          name: 'notes',
          type: 'text',
          label: 'Delivery Notes',
        },
      ],
    },
    // ── Admin Controls ────────────────────────────────────────────
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark this user as verified',
      },
      access: {
        update: ({ req: { user } }) =>
          Boolean(user?.role === 'admin'),
      },
    },
  ],
  access: {
    // Anyone can create (register)
    create: () => true,
    // Admins can read all; users can only read themselves
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Users can update themselves; admins can update anyone
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Only admins can delete users
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}
