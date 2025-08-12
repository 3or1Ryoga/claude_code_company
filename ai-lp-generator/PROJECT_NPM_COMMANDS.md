## AI LP Generator の npm コマンド集

このプロジェクト（`ai-lp-generator`）で利用できる特有の npm スクリプトと使い方をまとめています。実行前に必ず `ai-lp-generator` ディレクトリに移動してください。

```bash
cd /Users/RyogaSakai/dev/claude_code_demo/claude_code_company/ai-lp-generator
```

### 共通の事前準備
- **環境変数**（`.env.local`）
  - 必須: `V0_API_KEY`
  - 推奨: `GEMINI_API_KEY`（AI 自動修復で利用）
  - Next.js アプリで使用: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 基本コマンド

### 開発サーバー
```bash
npm run dev
```
- **説明**: Next.js の開発サーバーを起動します。

### ビルド / 本番起動
```bash
npm run build
npm start
```
- **説明**: 本番ビルドを作成し、本番サーバーを起動します。

### Lint
```bash
npm run lint
```
- **説明**: ESLint を実行します。

---

## 生成系コマンド

### LP プロジェクト生成（V0 利用）
```bash
npm run generate -- [concept] [--name <サイト名>] [--file <指示md>] [--start] [--skip-ai-fix]
```
- **説明**: V0 により LP 用の `page.tsx` を生成し、`generated_projects/<name>-<timestamp>/` に Next.js プロジェクトを作成します。
- **主なオプション**:
  - **`--file <path>`**: PASONA などの要件を含む Markdown 指示を読み込み（推奨。相対パスは `ai-lp-generator` 基準）
  - **`--name <サイト名>`**: 生成プロジェクトのベース名（未指定時は concept/Markdown タイトルから推定）
  - **`[concept]`**: 位置引数で簡易コンセプトを渡せます（`--file` がある場合は併用可）
  - **`--start`**: 生成完了後に対象プロジェクトで `npm run dev` を起動
  - **`--skip-ai-fix`**: 生成直後の自動修復（`ai-fix`）をスキップ
- **自動処理**:
  - `create-next-app` を非対話で実行（`--yes`, `--disable-git`, `--use-npm`, `--app`, `--src-dir`, `--ts`, `--tailwind`, `--eslint`）
  - 生成 TSX の構文チェックと簡易修復（未終了 JSX 属性など）
  - 追加依存関係の自動検出・インストール
  - 生成直後に **自動 `ai-fix`** を実行（`--skip-ai-fix` 指定時は省略）
- **実行例**:
```bash
# Markdown 指示を優先して生成（推奨）
npm run generate -- --file ./concepts/flighter-20250812175036.md --name "Flighter"

# コンセプト文字列だけで生成（簡易）
npm run generate -- "美容院向けのLP。温かみのあるデザイン。"

# 自動修復をスキップ
npm run generate -- --file ./concepts/project-20250812174240.md --name "Test" --skip-ai-fix
```

### コンセプト作成 + 自動生成
```bash
npm run concept
```
- **説明**: 対話式プロンプトで PASONA 入力を収集し、Markdown（`concepts/*.md`）を作成。その後自動的に `npm run generate` を実行します。
- **Gemini 連携**: `GEMINI_API_KEY` が設定されていれば、より高品質な Markdown を生成。未設定でもフォールバック動作します。

---

## コード自動修復コマンド

### AI ベースの構文/ビルドエラー修復
```bash
npm run ai-fix -- --path <file-or-directory>
```
- **説明**: 生成物の `page.tsx` などに起きがちな **未終了文字列** や **改行で途切れた JSX 属性値** を自動修復します。
  1) まずローカルヒューリスティックで修復
  2) 直らない場合は Gemini（`GEMINI_API_KEY` 必須）で全文修正
- **対象拡張子**: `.ts`, `.tsx`, `.js`, `.jsx`
- **実行例**:
```bash
# 単一ファイル
npm run ai-fix -- --path ./generated_projects/project-20250812221014/src/app/page.tsx

# ディレクトリ丸ごと
npm run ai-fix -- --path ./generated_projects/project-20250812221014/src
```

---

## 補足・トラブルシュート
- **非対話で止まる場合**（グローバル環境依存で `npx` が確認プロンプトを出すケース）
```bash
NPM_CONFIG_YES=true npm run generate -- --file ./concepts/flighter-20250812175036.md --name "Flighter"
```
- **`--file` のパス基準**: 相対パスは `ai-lp-generator` 直下基準。絶対パス指定も可。
- **複数 lockfile 警告**: 生成物配下でも `package-lock.json` が作られます。気になる場合は片方を削除してください。
- **Node バージョン**: Next.js 15 系は Node 18.18+（推奨 Node 20 LTS）。

---

## 出力先
- 生成結果: `generated_projects/<name>-<timestamp>/`
  - 起動例:
  ```bash
  cd ./generated_projects/<name>-<timestamp>
  npm run dev
  ```

---

## 環境変数一覧（`.env.local`）

- **V0_API_KEY**: 必須。Vercel V0 の API キー（`npm run generate` で使用）
- **V0_MODEL**: 任意。V0 モデル名（既定: `v0-1.5-md`）
- **GEMINI_API_KEY**: 推奨。AI 自動修復（`ai-fix`）/ コンセプト生成（`concept`）で使用
- **GEMINI_MODEL**: 任意。Gemini モデル名（既定: `gemini-1.5-flash`）
- **NEXT_PUBLIC_SUPABASE_URL**: 任意。生成アプリのランタイムで使用
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: 任意。生成アプリのランタイムで使用

`.env.local` は Git 管理外（`.gitignore`）です。API キーは第三者と共有しないでください。

---

## よくあるエラーと対処

- **V0_API_KEY が未設定**
  - 対処: `ai-lp-generator/.env.local` に `V0_API_KEY=...` を設定

- **指定ファイルが読み込めませんでした（--file パス不正）**
  - 対処: `--file` は `ai-lp-generator` 直下基準の相対パス、または絶対パスで指定

- **実行が対話待ちで止まる**（環境によって `npx` が確認を促す場合）
  - 対処: `NPM_CONFIG_YES=true npm run generate -- ...` を利用

- **Node バージョン不整合**
  - 対処: Node 18.18+（推奨 20 LTS）を使用

- **構文エラー（未終了文字列/JSX 属性の改行など）**
  - 対処: `npm run ai-fix -- --path <file-or-dir>` で自動修復

---

## FAQ

- **自動 ai-fix を無効化したい**
  - `npm run generate -- ... --skip-ai-fix`

- **生成直後に開発サーバーまで起動したい**
  - `npm run generate -- ... --start`

- **生成結果はどこにできる？**
  - `ai-lp-generator/generated_projects/<name>-<timestamp>/`

- **生成結果を削除したい**
  - 例: `rm -rf ./generated_projects/<name>-<timestamp>`

- **別の Markdown を使って再生成したい**
  - `npm run generate -- --file ./concepts/xxx.md --name "YourSite"`

---

## 付録: コマンド早見表

```bash
# 生成（Markdown 指示を使用・推奨）
npm run generate -- --file ./concepts/your.md --name "Your Site"

# 生成（コンセプト文字列のみ）
npm run generate -- "シンプルで温かみのある美容院LP"

# 自動修復をスキップ
npm run generate -- --file ./concepts/your.md --name "Your Site" --skip-ai-fix

# 生成直後に dev 起動まで
npm run generate -- --file ./concepts/your.md --name "Your Site" --start

# 構文/ビルドエラーを AI で自動修復
npm run ai-fix -- --path ./generated_projects/<name>-<ts>/src

# コンセプト作成（対話式）→ 自動生成
npm run concept
```


