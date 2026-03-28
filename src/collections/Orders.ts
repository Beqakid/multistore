import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'vendor', 'status', 'totalAmount', 'paymentStatus', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'customer') {
        return {
          'customer.value': {
            equals: user.id,
          },
        }
      }
      if (user.role === 'vendor') return true
      return false
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'vendor') return true
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation === 'create') {
          const now = new Date()
          const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
          const randomPart = Math.floor(1000 + Math.random() * 9000)
          data.orderNumber = `VIL-${datePart}-${randomPart}`

          if (req.user?.role === 'customer') {
            data.customer = req.user.id
          }
        }

        if (req.user?.role === 'customer') {
          delete data.status
          delete data.paymentStatus
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      label: 'Order Number',
      unique: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated order reference number',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'vendor',
      type: 'relationship',
      relationTo: 'vendors',
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      label: 'Order Items',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'productName',
          type: 'text',
          label: 'Product Name (snapshot)',
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          label: 'Unit Price at Order Time (FJD)',
          min: 0,
        },
        {
          name: 'subtotal',
          type: 'number',
          label: 'Line Subtotal (FJD)',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      label: 'Subtotal (FJD)',
      min: 0,
    },
    {
      name: 'deliveryFee',
      type: 'number',
      label: 'Delivery Fee (FJD)',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      label: 'Total Amount (FJD)',
      min: 0,
    },
    {
      name: 'commissionAmount',
      type: 'number',
      label: 'Platform Commission (FJD)',
      min: 0,
      access: {
        read: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'deliveryAddress',
      type: 'group',
      label: 'Delivery Address',
      fields: [
        { name: 'recipientName', type: 'text', label: 'Recipient Name' },
        { name: 'phone', type: 'text', label: 'Contact Phone' },
        { name: 'street', type: 'text', label: 'Street Address' },
        {
          name: 'city',
          type: 'select',
          label: 'City / Town',
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
        { name: 'notes', type: 'textarea', label: 'Delivery Instructions' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: '⏳ Pending', value: 'pending' },
        { label: '✅ Confirmed', value: 'confirmed' },
        { label: '👨‍🍳 Preparing', value: 'preparing' },
        { label: '🛵 Out for Delivery', value: 'out_for_delivery' },
        { label: '📦 Delivered', value: 'delivered' },
        { label: '❌ Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      options: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'paymentIntentId',
      type: 'text',
      label: 'Stripe Payment Intent ID',
      admin: { readOnly: true },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      defaultValue: 'stripe',
      options: [
        { label: 'Stripe (Card)', value: 'stripe' },
        { label: 'Cash on Delivery', value: 'cod' },
      ],
    },
    { name: 'customerNote', type: 'textarea', label: 'Customer Note' },
    {
      name: 'vendorNote',
      type: 'textarea',
      label: 'Vendor Note',
      access: {
        update: ({ req: { user } }) =>
          user?.role === 'vendor' || user?.role === 'admin',
      },
    },
    {
      name: 'adminNote',
      type: 'textarea',
      label: 'Admin Note',
      access: {
        read: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
  timestamps: true,
}
