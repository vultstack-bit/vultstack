import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Administration',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'Vultstack',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      defaultValue: 'info@vultstack.com',
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
    {
      name: 'heroHeadline',
      type: 'text',
    },
    {
      name: 'heroSubheadline',
      type: 'textarea',
    },
    {
      name: 'featuredListingsTitle',
      type: 'text',
    },
    {
      name: 'stats',
      type: 'group',
      fields: [
        { name: 'homesSold', type: 'number', defaultValue: 500 },
        { name: 'yearsExperience', type: 'number', defaultValue: 20 },
        { name: 'clientSatisfaction', type: 'number', defaultValue: 98 },
        { name: 'avgDaysOnMarket', type: 'number', defaultValue: 21 },
      ],
    },
    {
      name: 'metaTitle',
      type: 'text',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
    },
  ],
};
