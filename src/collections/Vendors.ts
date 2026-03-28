import type { CollectionConfig } from 'payload'

export const Vendors: CollectionConfig = {
  slug: 'vendors',
  admin: {
    useAsTitle: 'storeName',
    defaultColumns: ['storeName', 'location', 'approved', 'deliveryType', 'createdAt'],
  },
  // Vendors can read/update their own store; admins can do everything
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'vendor') {
        return {
          'user.value': {
            equals: user.id,
          },
        }
      }
      // Customers can read approved vendors
      return {
        approved: {
          equals: true,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        'user.value': {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    // ── Relationship to User account ──────────────────────────────
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: {
        description: 'The user account that owns this store',
      },
    },
    // ── Store Identity ────────────────────────────────────────────
    {
      name: 'storeName',
      type: 'text',
      required: true,
    },
    {
      name: 'storeLogo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Store Description',
    },
    {
      name: 'category',
      type: 'select',
      label: 'Store Category',
      options: [
        { label: 'Grocery & Supermarket', value: 'grocery' },
        { label: 'Fresh Produce', value: 'produce' },
        { label: 'Bakery', value: 'bakery' },
        { label: 'Restaurant & Food', value: 'restaurant' },
        { label: 'Pharmacy', value: 'pharmacy' },
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing & Fashion', value: 'clothing' },
        { label: 'Hardware & Tools', value: 'hardware' },
        { label: 'General Store', value: 'general' },
      ],
    },
    // ── Location ──────────────────────────────────────────────────
    {
      name: 'location',
      type: 'select',
      required: true,
      label: 'City / Town (Fiji)',
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
      name: 'address',
      type: 'text',
      label: 'Physical Address',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Store Phone Number',
    },
    // ── Delivery ──────────────────────────────────────────────────
    {
      name: 'deliveryType',
      type: 'select',
      required: true,
      defaultValue: 'own_delivery',
      options: [
        { label: 'Own Delivery', value: 'own_delivery' },
        { label: 'Platform Delivery', value: 'platform_delivery' },
      ],
    },
    {
      name: 'deliveryFee',
      type: 'number',
      label: 'Delivery Fee (FJD)',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'minimumOrder',
      type: 'number',
      label: 'Minimum Order Amount (FJD)',
      defaultValue: 0,
      min: 0,
    },
    // ── Payout ───────────────────────────────────────────────────
    {
      name: 'payoutDetails',
      type: 'group',
      label: 'Payout / Bank Details',
      admin: {
        description: 'Bank details for commission payouts',
      },
      fields: [
        {
          name: 'bankName',
          type: 'text',
          label: 'Bank Name',
        },
        {
          name: 'accountNumber',
          type: 'text',
          label: 'Account Number',
        },
        {
          name: 'accountName',
          type: 'text',
          label: 'Account Holder Name',
        },
        {
          name: 'bsbCode',
          type: 'text',
          label: 'BSB / Branch Code',
        },
      ],
    },
    // ── Admin Controls ────────────────────────────────────────────
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      label: 'Approved by Admin',
      admin: {
        description: 'Only approved vendors appear on the marketplace',
      },
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Store Active',
    },
    // ── Commission ────────────────────────────────────────────────
    {
      name: 'commissionRate',
      type: 'number',
      label: 'Commission Rate (%)',
      defaultValue: 10,
      min: 0,
      max: 100,
      admin: {
        description: 'Platform commission percentage on each order',
        condition: (data, siblingData, { user }) => user?.role === 'admin',
      },
      access: {
        read: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
  timestamps: true,
}
