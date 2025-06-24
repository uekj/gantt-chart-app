import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// ローカル開発時はローカルSQLite、本番時はTursoを使用
const isDevelopment = !process.env.TURSO_DATABASE_URL || process.env.NODE_ENV === 'development'

let db: any

if (isDevelopment) {
  // 開発時はbetter-sqlite3を使用（Apple Silicon対応）
  try {
    const sqlite = new Database('./local.db')
    db = drizzleSqlite(sqlite, { schema })
  } catch (error) {
    console.error('Failed to initialize better-sqlite3, falling back to libsql:', error)
    // フォールバック: libsqlを使用
    const client = createClient({
      url: 'file:./local.db',
    })
    db = drizzle(client, { schema })
  }
} else {
  // 本番時はTursoを使用
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
  db = drizzle(client, { schema })
}

export { db }