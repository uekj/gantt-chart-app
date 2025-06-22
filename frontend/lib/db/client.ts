import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

// ローカル開発時はローカルSQLite、本番時はTursoを使用
const isDevelopment = !process.env.TURSO_DATABASE_URL || process.env.NODE_ENV === 'development'

let client: any

if (isDevelopment) {
  // 開発時はローカルSQLiteファイルを使用
  client = createClient({
    url: 'file:./local.db',
  })
} else {
  // 本番時はTursoを使用
  client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
}

export const db = drizzle(client, { schema })