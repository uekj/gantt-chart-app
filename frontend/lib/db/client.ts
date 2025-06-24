import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// 環境判定: NODE_ENVを基準とし、DATABASE_URLで接続先を決定
const isDevelopment = process.env.NODE_ENV === 'development'
const databaseUrl = process.env.DATABASE_URL || 'file:./local.db'

let db: any

if (isDevelopment && databaseUrl.startsWith('file:')) {
  // ローカル開発時: better-sqlite3を使用（Apple Silicon対応）
  try {
    const sqlite = new Database(databaseUrl.replace('file:', ''))
    db = drizzleSqlite(sqlite, { schema })
  } catch (error) {
    console.error('Failed to initialize better-sqlite3, falling back to libsql:', error)
    // フォールバック: libsqlを使用
    const client = createClient({ url: databaseUrl })
    db = drizzle(client, { schema })
  }
} else {
  // プロダクション環境またはリモートDB: Turso/libsqlを使用
  const client = createClient({
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN, // Turso使用時のみ必要
  })
  db = drizzle(client, { schema })
}

export { db }