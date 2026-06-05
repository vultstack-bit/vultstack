import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.vultstack.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
  ];
}
