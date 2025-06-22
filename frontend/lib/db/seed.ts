import { db } from './client';
import { projects, tasks } from './schema';

export async function seedDatabase() {
  try {
    console.log('🌱 データベースのシードを開始します...');

    // 既存のデータをクリア（開発時のみ）
    await db.delete(tasks);
    await db.delete(projects);

    // サンプルプロジェクトを挿入
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const formatDate = (year: number, month: number, day: number) => {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };

    const sampleProjects = [
      {
        name: 'Webサイトリニューアル',
        startDate: formatDate(currentYear, currentMonth, 1),
        displayOrder: 0,
      },
      {
        name: 'モバイルアプリ開発',
        startDate: formatDate(currentYear, currentMonth, 15),
        displayOrder: 1,
      },
      {
        name: 'マーケティングキャンペーン',
        startDate: formatDate(currentYear, currentMonth + 1, 1),
        displayOrder: 2,
      },
    ];

    const insertedProjects = await db.insert(projects).values(sampleProjects).returning();
    console.log(`✅ ${insertedProjects.length}個のプロジェクトを作成しました`);

    // サンプルタスクを挿入
    const sampleTasks = [
      // Webサイトリニューアルのタスク
      {
        projectId: insertedProjects[0].id,
        name: '要件定義',
        startDate: formatDate(currentYear, currentMonth, 1),
        endDate: formatDate(currentYear, currentMonth, 5),
        displayOrder: 0,
      },
      {
        projectId: insertedProjects[0].id,
        name: 'デザイン作成',
        startDate: formatDate(currentYear, currentMonth, 6),
        endDate: formatDate(currentYear, currentMonth, 15),
        displayOrder: 1,
      },
      {
        projectId: insertedProjects[0].id,
        name: 'フロントエンド開発',
        startDate: formatDate(currentYear, currentMonth, 16),
        endDate: formatDate(currentYear, currentMonth + 1, 5),
        displayOrder: 2,
      },
      {
        projectId: insertedProjects[0].id,
        name: 'バックエンド開発',
        startDate: formatDate(currentYear, currentMonth, 20),
        endDate: formatDate(currentYear, currentMonth + 1, 10),
        displayOrder: 3,
      },
      {
        projectId: insertedProjects[0].id,
        name: 'テスト・デバッグ',
        startDate: formatDate(currentYear, currentMonth + 1, 6),
        endDate: formatDate(currentYear, currentMonth + 1, 15),
        displayOrder: 4,
      },
      {
        projectId: insertedProjects[0].id,
        name: 'リリース',
        startDate: formatDate(currentYear, currentMonth + 1, 16),
        endDate: formatDate(currentYear, currentMonth + 1, 18),
        displayOrder: 5,
      },

      // モバイルアプリ開発のタスク
      {
        projectId: insertedProjects[1].id,
        name: 'プロトタイプ作成',
        startDate: formatDate(currentYear, currentMonth, 15),
        endDate: formatDate(currentYear, currentMonth, 25),
        displayOrder: 0,
      },
      {
        projectId: insertedProjects[1].id,
        name: 'UI/UX設計',
        startDate: formatDate(currentYear, currentMonth, 20),
        endDate: formatDate(currentYear, currentMonth + 1, 5),
        displayOrder: 1,
      },
      {
        projectId: insertedProjects[1].id,
        name: 'iOS開発',
        startDate: formatDate(currentYear, currentMonth + 1, 1),
        endDate: formatDate(currentYear, currentMonth + 1, 20),
        displayOrder: 2,
      },
      {
        projectId: insertedProjects[1].id,
        name: 'Android開発',
        startDate: formatDate(currentYear, currentMonth + 1, 1),
        endDate: formatDate(currentYear, currentMonth + 1, 20),
        displayOrder: 3,
      },

      // マーケティングキャンペーンのタスク
      {
        projectId: insertedProjects[2].id,
        name: '市場調査',
        startDate: formatDate(currentYear, currentMonth + 1, 1),
        endDate: formatDate(currentYear, currentMonth + 1, 7),
        displayOrder: 0,
      },
      {
        projectId: insertedProjects[2].id,
        name: 'キャンペーン企画',
        startDate: formatDate(currentYear, currentMonth + 1, 8),
        endDate: formatDate(currentYear, currentMonth + 1, 15),
        displayOrder: 1,
      },
      {
        projectId: insertedProjects[2].id,
        name: 'クリエイティブ制作',
        startDate: formatDate(currentYear, currentMonth + 1, 10),
        endDate: formatDate(currentYear, currentMonth + 1, 25),
        displayOrder: 2,
      },
      {
        projectId: insertedProjects[2].id,
        name: 'キャンペーン実施',
        startDate: formatDate(currentYear, currentMonth + 1, 26),
        endDate: formatDate(currentYear, currentMonth + 2, 10),
        displayOrder: 3,
      },
    ];

    const insertedTasks = await db.insert(tasks).values(sampleTasks).returning();
    console.log(`✅ ${insertedTasks.length}個のタスクを作成しました`);

    console.log('🎉 データベースのシードが完了しました！');
    return { projects: insertedProjects, tasks: insertedTasks };
  } catch (error) {
    console.error('❌ シード実行中にエラーが発生しました:', error);
    throw error;
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('シード完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('シード失敗:', error);
      process.exit(1);
    });
}