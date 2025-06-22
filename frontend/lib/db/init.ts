import { createClient } from '@libsql/client'

let isInitialized = false

export async function initializeLocalDatabase() {
  if (isInitialized) return
  
  try {
    // ローカル開発時のみスキーマを自動作成
    const isDevelopment = !process.env.TURSO_DATABASE_URL || process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      console.log('🔧 ローカルSQLiteデータベースを初期化中...')
      
      const client = createClient({
        url: 'file:./local.db',
      })
      
      // スキーマを作成
      await client.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          start_date TEXT NOT NULL,
          display_order INTEGER DEFAULT 0 NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          display_order INTEGER DEFAULT 0 NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `)
      
      // NextAuth.jsテーブル
      await client.execute(`
        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT,
          email TEXT NOT NULL,
          emailVerified INTEGER,
          image TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS account (
          userId TEXT NOT NULL,
          type TEXT NOT NULL,
          provider TEXT NOT NULL,
          providerAccountId TEXT NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          expires_at INTEGER,
          token_type TEXT,
          scope TEXT,
          id_token TEXT,
          session_state TEXT,
          PRIMARY KEY(provider, providerAccountId),
          FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
        )
      `)
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS session (
          sessionToken TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          expires INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
        )
      `)
      
      await client.execute(`
        CREATE TABLE IF NOT EXISTS verificationToken (
          identifier TEXT NOT NULL,
          token TEXT NOT NULL,
          expires INTEGER NOT NULL,
          PRIMARY KEY(identifier, token)
        )
      `)
      
      // インデックス作成
      await client.execute('CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)')
      await client.execute('CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order)')
      await client.execute('CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(project_id, display_order)')
      
      // サンプルデータ投入（プロジェクトが存在しない場合のみ）
      const existingProjects = await client.execute('SELECT COUNT(*) as count FROM projects')
      if ((existingProjects.rows[0] as any).count === 0) {
        console.log('📋 サンプルデータを投入中...')
        
        const today = new Date()
        const currentMonth = today.getMonth() + 1
        const currentYear = today.getFullYear()
        
        await client.execute({
          sql: 'INSERT INTO projects (name, start_date, display_order) VALUES (?, ?, ?)',
          args: ['Webサイトリニューアル', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`, 0]
        })
        
        await client.execute({
          sql: 'INSERT INTO projects (name, start_date, display_order) VALUES (?, ?, ?)',
          args: ['モバイルアプリ開発', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`, 1]
        })
        
        await client.execute({
          sql: 'INSERT INTO tasks (project_id, name, start_date, end_date, display_order) VALUES (?, ?, ?, ?, ?)',
          args: [1, '要件定義', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`, `${currentYear}-${currentMonth.toString().padStart(2, '0')}-07`, 0]
        })
        
        await client.execute({
          sql: 'INSERT INTO tasks (project_id, name, start_date, end_date, display_order) VALUES (?, ?, ?, ?, ?)',
          args: [1, '設計', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-08`, `${currentYear}-${currentMonth.toString().padStart(2, '0')}-21`, 1]
        })
        
        await client.execute({
          sql: 'INSERT INTO tasks (project_id, name, start_date, end_date, display_order) VALUES (?, ?, ?, ?, ?)',
          args: [2, '調査', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`, `${currentYear}-${currentMonth.toString().padStart(2, '0')}-20`, 0]
        })
      }
      
      client.close()
      console.log('✅ ローカルSQLiteデータベース初期化完了')
    }
    
    isInitialized = true
  } catch (error) {
    console.warn('⚠️ データベース初期化でエラー:', error)
    isInitialized = true
  }
}

// 自動初期化
if (typeof window === 'undefined') {
  initializeLocalDatabase().catch(console.error)
}