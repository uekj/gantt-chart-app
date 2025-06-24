import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL || 'file:./local.db'
const isTurso = databaseUrl.startsWith('libsql://')

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: isTurso 
    ? {
        url: databaseUrl,
        token: process.env.TURSO_AUTH_TOKEN!,
      }
    : {
        url: databaseUrl,
      },
})