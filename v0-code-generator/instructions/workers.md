# 👷 WORKERS指示書 - AI LP Generator

## 共通の役割
AI LP Generator（PASONAベースSaaS）の具体的な開発作業の実行 + 完了確認・報告 + 品質管理

## BOSSから指示を受けたら実行する内容
1. 割り当てられた専門領域の開発作業を実行
2. 自分の完了ファイル作成
3. 他のworkerの完了確認
4. 全員完了していれば（自分が最後なら）boss1に報告

## 共通実行コマンド
```bash
# 自分の完了ファイル作成
touch ./tmp/worker1_done.txt  # worker1の場合
# touch ./tmp/worker2_done.txt  # worker2の場合
# touch ./tmp/worker3_done.txt  # worker3の場合

# 全員の完了確認
if [ -f ./tmp/worker1_done.txt ] && [ -f ./tmp/worker2_done.txt ] && [ -f ./tmp/worker3_done.txt ]; then
    echo "全員のAI LP Generator作業完了を確認（最後の完了者として報告）"
    ./agent-send.sh boss1 "全員のAI LP Generator作業完了しました"
else
    echo "他のworkerの完了を待機中..."
fi
```

---

## 🔐 WORKER1: Supabase認証・DB スペシャリスト

### 専門領域
Supabase Authentication + Database Design + Security Implementation

### 主要タスク
#### 1. Supabaseプロジェクトセットアップ
```bash
# Supabaseプロジェクト初期化
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

#### 2. 認証システム実装
- **メール/パスワード認証**
  - サインアップページの実装
  - ログインページの実装
  - セッション管理の実装
- **Google OAuth認証**
  - ソーシャルログインボタンの実装
  - OAuth認証フローの実装
- **認証状態管理**
  - Next.js App Routerでの認証ガード実装
  - ログアウト機能の実装

#### 3. データベース設計・構築
```sql
-- projectsテーブルの作成
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    project_name TEXT NOT NULL,
    pasona_problem TEXT,
    pasona_affinity TEXT,
    pasona_solution TEXT,
    pasona_offer TEXT,
    pasona_narrowing_down TEXT,
    pasona_action TEXT,
    generated_project_path TEXT,
    preview_url TEXT
);

-- Row Level Security (RLS) の設定
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロジェクトのみアクセス可能
CREATE POLICY "Users can only access their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);
```

#### 4. セキュリティ実装
- Row Level Security (RLS) の適切な設定
- API Routes での認証チェック実装
- セッション管理とセキュリティヘッダーの設定

### 完成判定基準
- [ ] Supabase認証（メール・Google）が完全動作
- [ ] projectsテーブルが適切に設計・作成済み
- [ ] RLSが正しく設定され、セキュリティが確保されている
- [ ] Next.js App Routerとの連携が完璧に動作

---

## 🎨 WORKER2: UI/UX フロントエンド アーティスト

### 専門領域
React Components + Tailwind CSS + Responsive Design + User Experience

### 主要タスク
#### 1. PASONAヒアリングフォーム実装
```tsx
// PASONAフォームコンポーネントの例
const PASONAForm = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左側: PASONAフォーム */}
      <div className="space-y-6">
        <FormSection 
          title="Problem (問題提起)"
          placeholder="顧客が抱える悩みや痛みを具体的に記述してください..."
          guide="例: 毎月の経費管理に3時間かかっている"
        />
        {/* 他のPASONA要素... */}
      </div>
      
      {/* 右側: プレビュー領域 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <LivePreview />
      </div>
    </div>
  );
};
```

#### 2. プロジェクト管理ダッシュボード実装
- **プロジェクト一覧表示**
  - カード形式のプロジェクト表示
  - 作成日時・プロジェクト名表示
  - サムネイル画像表示（任意）
- **プロジェクト操作機能**
  - 再編集ボタン（フォーム読み込み）
  - プレビューボタン（新タブ表示）
  - 削除ボタン（確認ダイアログ付き）

#### 3. 全体UI/UXデザイン
- **認証画面のスタイリング**
  - ログイン・サインアップフォームのデザイン
  - Supabase Auth UIのカスタマイズ
- **レスポンシブデザイン**
  - モバイル・タブレット・デスクトップ対応
  - Tailwind CSSでの適切なブレークポイント設定
- **ローディング・エラー状態**
  - スピナー・スケルトンローディング
  - エラーメッセージの適切な表示

#### 4. ユーザビリティ強化
- フォーム入力ガイドとプレースホルダー
- バリデーションメッセージの分かりやすい表示
- アニメーションとマイクロインタラクション

### 完成判定基準
- [ ] PASONAフォームが直感的で使いやすい
- [ ] プロジェクト管理ダッシュボードが完全機能
- [ ] レスポンシブデザインが全デバイスで適切に動作
- [ ] 認証画面が美しくユーザーフレンドリー

---

## ⚙️ WORKER3: バックエンドAPI・統合 魔術師

### 専門領域
Next.js API Routes + V0 API Integration + Data Processing + System Integration

### 主要タスク
#### 1. 既存V0エンジンのリファクタリング
```javascript
// 既存のindex.jsをAPI Routes用に最適化
// /api/generate.js
import { generateText } from 'ai';
import { vercel } from '@ai-sdk/vercel';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pasoraData } = req.body;
    
    // PASONAデータからV0プロンプト生成
    const prompt = generatePASONAPrompt(pasoraData);
    
    // V0 API呼び出し
    const v0 = vercel('v0-1.5-md');
    const { text: generatedCode } = await generateText({ 
      model: v0, 
      prompt: prompt 
    });
    
    // プロジェクト生成・保存処理
    const projectPath = await saveGeneratedProject(generatedCode, pasoraData);
    
    res.status(200).json({ 
      success: true, 
      projectPath,
      previewUrl: generatePreviewUrl(projectPath)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 2. API エンドポイント実装
- **`/api/generate`**: LP生成エンドポイント
  - PASONAフォームデータ受信
  - V0プロンプト生成・API呼び出し
  - 生成されたLPプロジェクトの保存
- **`/api/projects`**: プロジェクト管理API
  - GET: ユーザーのプロジェクト一覧取得
  - POST: 新規プロジェクト保存
  - PUT: プロジェクト更新
  - DELETE: プロジェクト削除

#### 3. Supabase連携ロジック実装
```javascript
// Supabaseとのデータ連携
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const saveProjectToDatabase = async (req, projectData) => {
  const supabase = createServerSupabaseClient({ req, res });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      project_name: projectData.name,
      pasona_problem: projectData.problem,
      // ... 他のPASONAデータ
      generated_project_path: projectData.path,
      preview_url: projectData.previewUrl
    });
    
  if (error) throw error;
  return data;
};
```

#### 4. プロジェクト生成・管理システム
- 生成されたNext.jsプロジェクトの適切な保存
- プレビューURL生成とアクセス管理
- プロジェクトファイルの管理（作成・削除・更新）

### 完成判定基準
- [ ] V0 API連携が安定して動作
- [ ] 全API エンドポイントが正常に機能
- [ ] Supabaseとのデータ連携が完璧
- [ ] プロジェクト生成・管理システムが完全動作

---

## 🔄 統合連携のポイント

### Worker間の連携
- **Worker1 ↔ Worker2**: 認証状態のUI反映
- **Worker1 ↔ Worker3**: データベース操作のAPI連携
- **Worker2 ↔ Worker3**: フォームデータとAPI通信

### 品質管理
各Workerは担当領域完了時に以下を確認：
1. 自分の機能が単体で正常動作
2. 他Workerとの連携部分が適切に動作
3. エラーハンドリングが適切に実装
4. コードの可読性・保守性が確保されている

チーム一丸となって、PASONAベースの革新的なSaaS型LP自動生成システムを完成させよう！