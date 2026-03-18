import type { CollectionConfig } from 'payload'

import { adminOnly } from '../access/adminOnly'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['store', 'customerEmail', 'status', 'total', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return {
        or: [
          { customer: { equals: user.id } },
          { 'store.owner': { equals: user.id } },
        ],
      }
    },
    create: () => true, // Allow guest checkout
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { 'store.owner': { equals: user.id } }
    },
    delete: adminOnly,
  },
  fields: [
    {
      name: 'store',
      type: 'relationship',
      relationTo: 'stores',
      required: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Authenticated customer — empty for guest checkouts',
      },
    },
    {
      name: 'customerEmail',
      type: 'email',
      required: true,
      admin: {
        description: 'Contact email for order confirmation',
      },
    },
    {
      name: 'items',
      type: 'array',
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
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'priceAtPurchase',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Price snapshot at time of purchase',
          },
        },
      ],
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: {
        description: 'Current fulfillment state of the order',
      },
    },
  ],
  timestamps: true,
}
