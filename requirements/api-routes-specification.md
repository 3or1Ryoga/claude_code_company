# Next.js API Routes仕様書

## 1. API概要

### 1.1 基本設計方針
- RESTful API設計原則に準拠
- JSON形式でのデータ交換
- HTTPステータスコードの適切な使用
- エラーハンドリングの統一化
- レート制限の実装

### 1.2 ベースURL構造
```
/api/v1/[resource]/[action]
```

## 2. 認証API

### 2.1 ユーザー登録
```typescript
POST /api/v1/auth/register
Content-Type: application/json

Request Body:
{
  "email": "string",
  "password": "string",
  "name": "string"
}

Response (201):
{
  "success": true,
  "data": {
    "userId": "string",
    "email": "string",
    "name": "string"
  }
}
```

### 2.2 ログイン
```typescript
POST /api/v1/auth/login
Content-Type: application/json

Request Body:
{
  "email": "string",
  "password": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "string"
    }
  }
}
```

### 2.3 ログアウト
```typescript
POST /api/v1/auth/logout
Authorization: Bearer [token]

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2.4 トークンリフレッシュ
```typescript
POST /api/v1/auth/refresh
Content-Type: application/json

Request Body:
{
  "refreshToken": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string"
  }
}
```

## 3. ユーザー管理API

### 3.1 ユーザー情報取得
```typescript
GET /api/v1/users/me
Authorization: Bearer [token]

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 3.2 ユーザー情報更新
```typescript
PATCH /api/v1/users/me
Authorization: Bearer [token]
Content-Type: application/json

Request Body:
{
  "name": "string",
  "bio": "string",
  "avatar": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "bio": "string",
    "avatar": "string"
  }
}
```

### 3.3 パスワード変更
```typescript
POST /api/v1/users/change-password
Authorization: Bearer [token]
Content-Type: application/json

Request Body:
{
  "currentPassword": "string",
  "newPassword": "string"
}

Response (200):
{
  "success": true,
  "message": "Password changed successfully"
}
```

## 4. リソースAPI（例：Posts）

### 4.1 投稿一覧取得
```typescript
GET /api/v1/posts?page=1&limit=10&sort=createdAt&order=desc
Authorization: Bearer [token] (optional)

Response (200):
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        "author": {
          "id": "string",
          "name": "string"
        },
        "tags": ["string"],
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### 4.2 投稿詳細取得
```typescript
GET /api/v1/posts/[postId]
Authorization: Bearer [token] (optional)

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "author": {
      "id": "string",
      "name": "string",
      "avatar": "string"
    },
    "tags": ["string"],
    "likes": 0,
    "comments": [],
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 4.3 投稿作成
```typescript
POST /api/v1/posts
Authorization: Bearer [token]
Content-Type: application/json

Request Body:
{
  "title": "string",
  "content": "string",
  "tags": ["string"],
  "status": "draft|published"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "tags": ["string"],
    "status": "string"
  }
}
```

### 4.4 投稿更新
```typescript
PUT /api/v1/posts/[postId]
Authorization: Bearer [token]
Content-Type: application/json

Request Body:
{
  "title": "string",
  "content": "string",
  "tags": ["string"],
  "status": "draft|published"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "tags": ["string"],
    "status": "string"
  }
}
```

### 4.5 投稿削除
```typescript
DELETE /api/v1/posts/[postId]
Authorization: Bearer [token]

Response (200):
{
  "success": true,
  "message": "Post deleted successfully"
}
```

## 5. ファイルアップロードAPI

### 5.1 画像アップロード
```typescript
POST /api/v1/upload/image
Authorization: Bearer [token]
Content-Type: multipart/form-data

Request Body:
- file: File (max 5MB, jpg/png/webp)

Response (200):
{
  "success": true,
  "data": {
    "url": "string",
    "key": "string",
    "size": 0,
    "type": "string"
  }
}
```

## 6. 検索API

### 6.1 全文検索
```typescript
GET /api/v1/search?q=keyword&type=posts|users&limit=10
Authorization: Bearer [token] (optional)

Response (200):
{
  "success": true,
  "data": {
    "results": [],
    "total": 0,
    "query": "string"
  }
}
```

## 7. 通知API

### 7.1 通知一覧取得
```typescript
GET /api/v1/notifications?unread=true
Authorization: Bearer [token]

Response (200):
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "string",
        "type": "string",
        "title": "string",
        "message": "string",
        "read": false,
        "createdAt": "datetime"
      }
    ],
    "unreadCount": 0
  }
}
```

### 7.2 通知既読化
```typescript
PUT /api/v1/notifications/[notificationId]/read
Authorization: Bearer [token]

Response (200):
{
  "success": true,
  "message": "Notification marked as read"
}
```

## 8. Webhook API

### 8.1 Webhook登録
```typescript
POST /api/v1/webhooks
Authorization: Bearer [token]
Content-Type: application/json

Request Body:
{
  "url": "string",
  "events": ["post.created", "post.updated"],
  "secret": "string"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "string",
    "url": "string",
    "events": ["string"],
    "active": true
  }
}
```

## 9. エラーレスポンス仕様

### 9.1 標準エラーフォーマット
```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional information
  }
}
```

### 9.2 HTTPステータスコード
- 200: OK
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error
- 503: Service Unavailable

## 10. レート制限

### 10.1 制限値
- 認証済みユーザー: 1000 requests/hour
- 未認証ユーザー: 100 requests/hour
- ファイルアップロード: 10 requests/hour

### 10.2 レート制限ヘッダー
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

## 11. ミドルウェア実装

### 11.1 認証ミドルウェア
```typescript
// middleware/auth.ts
export async function authMiddleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Token required' }},
      { status: 401 }
    );
  }
  // Token validation logic
}
```

### 11.2 バリデーションミドルウェア
```typescript
// middleware/validation.ts
import { z } from 'zod';

export function validateBody(schema: z.ZodSchema) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validated = schema.parse(body);
      return validated;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' }},
        { status: 422 }
      );
    }
  };
}
```

## 12. キャッシング戦略

### 12.1 キャッシュヘッダー
```typescript
// 静的コンテンツ
Cache-Control: public, max-age=31536000, immutable

// 動的コンテンツ
Cache-Control: private, no-cache, no-store, must-revalidate

// API レスポンス
Cache-Control: public, max-age=60, s-maxage=120, stale-while-revalidate=60
```

## 13. CORS設定

### 13.1 許可設定
```typescript
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```