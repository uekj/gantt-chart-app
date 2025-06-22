import { db } from './client'
import { projects, tasks, users, accounts, sessions, verificationTokens, apiKeys } from './schema'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testConnection() {
  try {
    console.log('🔍 データベース接続をテストしています...')
    
    // テーブルの存在確認
    console.log('📋 テーブル構造を確認中...')
    
    // プロジェクトテーブルのテスト
    try {
      const projectCount = await db.select().from(projects).limit(1)
      console.log('✅ projects テーブル: OK')
    } catch (error) {
      console.log('❌ projects テーブル: エラー', error)
    }
    
    // タスクテーブルのテスト
    try {
      const taskCount = await db.select().from(tasks).limit(1)
      console.log('✅ tasks テーブル: OK')
    } catch (error) {
      console.log('❌ tasks テーブル: エラー', error)
    }
    
    // 認証テーブルのテスト
    try {
      const userCount = await db.select().from(users).limit(1)
      console.log('✅ users テーブル: OK')
    } catch (error) {
      console.log('❌ users テーブル: エラー', error)
    }
    
    try {
      const accountCount = await db.select().from(accounts).limit(1)
      console.log('✅ accounts テーブル: OK')
    } catch (error) {
      console.log('❌ accounts テーブル: エラー', error)
    }
    
    try {
      const sessionCount = await db.select().from(sessions).limit(1)
      console.log('✅ sessions テーブル: OK')
    } catch (error) {
      console.log('❌ sessions テーブル: エラー', error)
    }
    
    // テストデータの挿入・取得
    console.log('\n🧪 CRUD操作をテスト中...')
    
    // テストプロジェクトの作成
    const testProject = await db.insert(projects).values({
      name: 'テストプロジェクト',
      startDate: '2025-01-19',
      displayOrder: 999
    }).returning()
    
    console.log('✅ プロジェクト作成:', testProject[0])
    
    // テストタスクの作成
    const testTask = await db.insert(tasks).values({
      projectId: testProject[0].id,
      name: 'テストタスク',
      startDate: '2025-01-20',
      endDate: '2025-01-25',
      displayOrder: 0
    }).returning()
    
    console.log('✅ タスク作成:', testTask[0])
    
    // データの取得
    const allProjects = await db.select().from(projects)
    const allTasks = await db.select().from(tasks)
    
    console.log(`✅ プロジェクト数: ${allProjects.length}`)
    console.log(`✅ タスク数: ${allTasks.length}`)
    
    // テストデータの削除
    await db.delete(tasks).where({ id: testTask[0].id } as any)
    await db.delete(projects).where({ id: testProject[0].id } as any)
    
    console.log('✅ テストデータ削除完了')
    console.log('\n🎉 データベース接続テスト完了！すべて正常に動作しています。')
    
  } catch (error) {
    console.error('❌ データベーステストエラー:', error)
    throw error
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('テスト完了')
      process.exit(0)
    })
    .catch((error) => {
      console.error('テスト失敗:', error)
      process.exit(1)
    })
}