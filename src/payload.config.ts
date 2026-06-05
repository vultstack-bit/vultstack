import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Leads } from './collections/Leads';
import { SiteSettings } from './globals/SiteSettings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' - Vultstack Admin',
    },
  },
  collections: [
    Users,
    Media,
    Leads,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET ?? (() => { throw new Error('PAYLOAD_SECRET env var must be set') })(),
  typescript: {
    outputFile: path.resolve(dirname, 'types/payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Push schema changes to database on startup (creates tables automatically)
    push: true,
  }),
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
});
