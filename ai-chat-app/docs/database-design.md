# AI Chat App - データベース設計書

## 概要
PostgreSQLを使用したリレーショナルデータベース設計

## エンティティ関係図 (ERD)

```
[Users] 1 ────── N [Conversations] 1 ────── N [Messages]
   │                                          │
   └─────────────── 1 ────── N ───────────────┘
```

## テーブル定義

### Users テーブル
ユーザー情報を管理

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Conversations テーブル
チャット会話を管理

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT false
);

-- インデックス
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
```

### Messages テーブル
チャットメッセージを管理

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  token_count INTEGER,
  metadata JSONB
);

-- インデックス
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_user_id ON messages(user_id);
```

### User_Settings テーブル
ユーザー設定を管理

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'ja',
  message_font_size INTEGER DEFAULT 14 CHECK (message_font_size BETWEEN 10 AND 20),
  auto_save BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

### Sessions テーブル
セッション管理（JWT管理用）

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- インデックス
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## Prisma Schema定義

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique @db.VarChar(255)
  name          String    @db.VarChar(100)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  avatarUrl     String?   @map("avatar_url")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  lastLoginAt   DateTime? @map("last_login_at") @db.Timestamptz
  isActive      Boolean   @default(true) @map("is_active")

  conversations Conversation[]
  messages      Message[]
  settings      UserSetting?
  sessions      Session[]

  @@map("users")
}

model Conversation {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  title      String   @db.VarChar(200)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz
  isArchived Boolean  @default(false) @map("is_archived")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@index([userId])
  @@index([updatedAt(sort: Desc)])
  @@index([userId, updatedAt(sort: Desc)])
  @@map("conversations")
}

model Message {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  content        String
  role           Role
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  tokenCount     Int?     @map("token_count")
  metadata       Json?

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([createdAt(sort: Desc)])
  @@index([conversationId, createdAt(sort: Desc)])
  @@index([userId])
  @@map("messages")
}

model UserSetting {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String   @unique @map("user_id") @db.Uuid
  theme           Theme    @default(light)
  language        String   @default("ja") @db.VarChar(10)
  messageFontSize Int      @default(14) @map("message_font_size")
  autoSave        Boolean  @default(true) @map("auto_save")
  soundEnabled    Boolean  @default(true) @map("sound_enabled")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_settings")
}

model Session {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  tokenHash String   @map("token_hash") @db.VarChar(255)
  expiresAt DateTime @map("expires_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  ipAddress String?  @map("ip_address") @db.Inet
  userAgent String?  @map("user_agent")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
  @@index([expiresAt])
  @@map("sessions")
}

enum Role {
  user
  assistant
  system
}

enum Theme {
  light
  dark
  auto
}
```

## データベース制約

### 整合性制約
- 外部キー制約による参照整合性
- CHECK制約による値の範囲制限
- UNIQUE制約による重複防止

### パフォーマンス最適化
- 適切なインデックス設計
- 複合インデックスの活用
- パーティショニング（将来的に検討）

## バックアップ・復旧

### バックアップ戦略
- 日次フルバックアップ
- 継続的な増分バックアップ
- ポイントインタイム リカバリ

### データ保持ポリシー
- ユーザーデータ: アカウント削除後30日間保持
- チャット履歴: 無期限（ユーザー設定による）
- セッション: 有効期限切れ後即座に削除

## セキュリティ

### データ暗号化
- パスワードのハッシュ化（bcrypt）
- 機密データの暗号化
- SSL/TLS通信の強制

### アクセス制御
- ロールベースアクセス制御
- 行レベルセキュリティ
- データマスキング

## モニタリング

### パフォーマンス監視
- クエリ実行時間の監視
- インデックス使用率の確認
- デッドロック検出

### 容量管理
- ディスク使用量の監視
- テーブルサイズの追跡
- 自動バキューム設定