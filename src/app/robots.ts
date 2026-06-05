import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.vultstack.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
