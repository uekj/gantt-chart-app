import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// 環境判定: NODE_ENVを基準とし、DATABASE_URLで接続先を決定
const isDevelopment = process.env.NODE_ENV === 'development'
const databaseUrl = process.env.DATABASE_URL || 'file:./local.db'

type DatabaseType = LibSQLDatabase<typeof schema> | BetterSQLite3Database<typeof schema>

function initializeDatabase(): DatabaseType {
  if (isDevelopment && databaseUrl.startsWith('file:')) {
    // ローカル開発時: better-sqlite3を使用（Apple Silicon対応）
    try {
      const sqlite = new Database(databaseUrl.replace('file:', ''))
      return drizzleSqlite(sqlite, { schema })
    } catch (error) {
      console.error('Failed to initialize better-sqlite3, falling back to libsql:', error)
      // フォールバック: libsqlを使用
      const client = createClient({ url: databaseUrl })
      return drizzle(client, { schema })
    }
  } else {
    // プロダクション環境またはリモートDB: Turso/libsqlを使用
    const isTurso = databaseUrl.startsWith('libsql://')
    
    if (isTurso && !process.env.TURSO_AUTH_TOKEN) {
      throw new Error(
        'TURSO_AUTH_TOKEN environment variable is required when using Turso database. ' +
        'Please set TURSO_AUTH_TOKEN in your environment variables.'
      )
    }
    
    const client = createClient({
      url: databaseUrl,
      authToken: isTurso ? process.env.TURSO_AUTH_TOKEN as string : undefined,
    })
    return drizzle(client, { schema })
  }
}

const db: DatabaseType = initializeDatabase()

export { db }