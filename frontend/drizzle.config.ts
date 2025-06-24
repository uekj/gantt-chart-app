import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL || 'file:./local.db'
const isTurso = databaseUrl.startsWith('libsql://')

// Turso使用時は認証トークンが必須
if (isTurso && !process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    'TURSO_AUTH_TOKEN environment variable is required when using Turso database. ' +
    'Please set TURSO_AUTH_TOKEN in your environment variables.'
  )
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: isTurso 
    ? {
        url: databaseUrl,
        token: process.env.TURSO_AUTH_TOKEN as string,
      }
    : {
        url: databaseUrl,
      },
})