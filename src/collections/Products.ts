import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'vendor', 'category', 'price', 'stock', 'active', 'createdAt'],
  },
  access: {
    // Anyone can read active products
    read: ({ req: { user } }) => {
      // Admins see everything
      if (user?.role === 'admin') return true
      // Vendors see their own products (active or not)
      if (user?.role === 'vendor') {
        return {
          or: [
            { active: { equals: true } },
          ],
        }
      }
      // Customers and guests only see active products
      return {
        active: {
          equals: true,
        },
      }
    },
    // Vendors can create products (for their own store)
    create: ({ req: { user } }) =>
      Boolean(user?.role === 'vendor' || user?.role === 'admin'),
    // Vendors can update their own; admins update any
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return user.role === 'vendor'
    },
    // Only admins can delete (vendors should deactivate instead)
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, originalDoc }) => {
        if (req.user?.role === 'vendor' && operation === 'update') {
          if (originalDoc?.vendor) {
            const vendorDoc = await req.payload.find({
              collection: 'vendors',
              where: { 'user.value': { equals: req.user.id } },
              limit: 1,
              overrideAccess: false,
              req,
            })
            if (vendorDoc.docs.length === 0) {
              throw new Error('You can only update your own products')
            }
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'vendor',
      type: 'relationship',
      relationTo: 'vendors',
      required: true,
      admin: {
        description: 'The store this product belongs to',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Groceries', value: 'groceries' },
        { label: 'Fresh Produce', value: 'produce' },
        { label: 'Bakery', value: 'bakery' },
        { label: 'Beverages', value: 'beverages' },
        { label: 'Dairy & Eggs', value: 'dairy' },
        { label: 'Meat & Seafood', value: 'meat' },
        { label: 'Frozen Foods', value: 'frozen' },
        { label: 'Snacks & Confectionery', value: 'snacks' },
        { label: 'Household & Cleaning', value: 'household' },
        { label: 'Personal Care', value: 'personal_care' },
        { label: 'Baby & Kids', value: 'baby' },
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Hardware', value: 'hardware' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Price (FJD)',
      min: 0,
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      label: 'Compare At Price (FJD)',
      min: 0,
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Stock Quantity',
      min: 0,
    },
    {
      name: 'unit',
      type: 'select',
      label: 'Unit of Measure',
      defaultValue: 'item',
      options: [
        { label: 'Item', value: 'item' },
        { label: 'Kilogram (kg)', value: 'kg' },
        { label: 'Gram (g)', value: 'g' },
        { label: 'Litre (L)', value: 'L' },
        { label: 'Millilitre (ml)', value: 'ml' },
        { label: 'Pack', value: 'pack' },
        { label: 'Bundle', value: 'bundle' },
        { label: 'Dozen', value: 'dozen' },
      ],
    },
    {
      name: 'sku',
      type: 'text',
      label: 'SKU / Barcode',
    },
    {
      name: 'images',
      type: 'array',
      label: 'Product Images',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          label: 'Alt Text',
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Listed (visible to customers)',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Featured Product',
    },
  ],
  timestamps: true,
}
