# AI Chat App - API Routes仕様書

## 概要
Next.js App Router (src/app/api/) を使用したRESTful API設計

## 認証API

### POST /api/auth/login
ユーザーログイン

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token"
}
```

### POST /api/auth/register
ユーザー登録

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/logout
ログアウト

### GET /api/auth/me
現在のユーザー情報取得

## チャット関連API

### GET /api/chat/conversations
チャット会話一覧取得

**Query Parameters:**
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Chat about AI",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "messageCount": 5
    }
  ],
  "total": 10,
  "hasMore": false
}
```

### POST /api/chat/conversations
新しいチャット会話作成

**Request Body:**
```json
{
  "title": "New Chat"
}
```

### GET /api/chat/conversations/[id]
特定の会話詳細取得

### DELETE /api/chat/conversations/[id]
会話削除

## メッセージ関連API

### GET /api/messages/[conversationId]
会話内のメッセージ一覧取得

**Query Parameters:**
- `limit`: number (default: 50)
- `before`: string (cursor-based pagination)

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "content": "メッセージ内容",
      "role": "user|assistant",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "nextCursor": "cursor_string"
}
```

### POST /api/messages/[conversationId]
新しいメッセージ送信

**Request Body:**
```json
{
  "content": "ユーザーのメッセージ",
  "role": "user"
}
```

**Response:**
```json
{
  "userMessage": {
    "id": "uuid",
    "content": "ユーザーのメッセージ",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "assistantMessage": {
    "id": "uuid",
    "content": "AIの応答",
    "role": "assistant",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/messages/stream
ストリーミングチャット (Server-Sent Events)

**Request Body:**
```json
{
  "conversationId": "uuid",
  "content": "ユーザーのメッセージ"
}
```

**Response:** Text/Event-Stream形式

## ユーザー管理API

### GET /api/users/profile
ユーザープロフィール取得

### PUT /api/users/profile
ユーザープロフィール更新

**Request Body:**
```json
{
  "name": "Updated Name",
  "avatar": "avatar_url"
}
```

### GET /api/users/settings
ユーザー設定取得

### PUT /api/users/settings
ユーザー設定更新

## エラーハンドリング

### 標準的なエラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": "詳細情報"
  }
}
```

### HTTPステータスコード
- `200`: 成功
- `201`: 作成成功
- `400`: リクエストエラー
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソースが見つからない
- `429`: レート制限
- `500`: サーバーエラー

## セキュリティ

### 認証
- JWT トークンベース認証
- Authorization ヘッダーでトークン送信
- `Bearer <token>` 形式

### バリデーション
- Zod スキーマによる入力検証
- SQLインジェクション対策
- XSS対策

### レート制限
- IP/ユーザー単位でのレート制限
- メッセージ送信: 30回/分
- 認証API: 5回/分

## ミドルウェア

### 共通ミドルウェア
- 認証チェック
- CORS設定
- レート制限
- ログ記録
- エラーハンドリング

## テスト仕様

### 単体テスト
- 各エンドポイントのテスト
- エラーケースのテスト
- バリデーションテスト

### 統合テスト
- データベース連携テスト
- 認証フローテスト
- エンドツーエンドテスト