const { createClient } = require('@libsql/client')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL || 'file:./local.db'
const isTurso = databaseUrl.startsWith('libsql://')

const client = createClient(isTurso 
  ? {
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }
  : {
      url: databaseUrl,
    }
)

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Create projects table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create tasks table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)
    
    // Create indexes
    await client.execute('CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)')
    await client.execute('CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order)')
    await client.execute('CREATE INDEX IF NOT EXISTS idx_tasks_display_order ON tasks(project_id, display_order)')
    
    console.log('✅ Database schema created successfully!')
    
    // Test insert
    const result = await client.execute({
      sql: 'INSERT INTO projects (name, start_date) VALUES (?, ?)',
      args: ['Test Project', '2025-01-01']
    })
    
    console.log('✅ Test insert successful:', result)
    
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    client.close()
  }
}

testConnection()