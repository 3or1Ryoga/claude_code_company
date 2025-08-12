# AI Sales Assistant - API仕様書

## API エンドポイント詳細仕様

### 1. 認証・ユーザー管理 API

#### 1.1 POST /api/auth/login
**概要**: ユーザーログイン処理

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "田中太郎"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

#### 1.2 GET /api/auth/user
**概要**: 現在のユーザー情報取得

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "田中太郎",
  "created_at": "2025-08-07T00:00:00Z"
}
```

### 2. 商談管理 API

#### 2.1 POST /api/meetings
**概要**: 新規商談セッション作成

**Request Body:**
```json
{
  "title": "株式会社サンプル 商談",
  "bant_answers": {
    "budget": "年間200万円程度を想定",
    "authority": "私が最終決定権者です",
    "need": "営業効率の改善が急務",
    "timeline": "来四半期までに導入したい"
  }
}
```

**Response:**
```json
{
  "id": "meeting_uuid",
  "title": "株式会社サンプル 商談",
  "status": "preparation",
  "bant_answers": {...},
  "created_at": "2025-08-07T00:00:00Z"
}
```

#### 2.2 GET /api/meetings
**概要**: ユーザーの商談一覧取得

**Query Parameters:**
- `status`: preparation | active | completed
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```json
{
  "meetings": [
    {
      "id": "uuid",
      "title": "商談タイトル",
      "status": "preparation",
      "created_at": "2025-08-07T00:00:00Z"
    }
  ],
  "total": 15,
  "has_more": true
}
```

### 3. ToDo管理 API

#### 3.1 POST /api/todos
**概要**: BANT回答からAI ToDo生成

**Request Body:**
```json
{
  "meeting_id": "meeting_uuid",
  "bant_answers": {
    "budget": "年間200万円程度を想定",
    "authority": "私が最終決定権者です",
    "need": "営業効率の改善が急務",
    "timeline": "来四半期までに導入したい"
  }
}
```

**Response:**
```json
{
  "todos": [
    {
      "id": "todo_uuid",
      "meeting_id": "meeting_uuid",
      "text": "予算200万円の範囲で提案資料を準備する",
      "priority": "high",
      "category": "preparation",
      "completed": false,
      "created_at": "2025-08-07T00:00:00Z"
    }
  ],
  "generated_count": 6
}
```

#### 3.2 PUT /api/todos/[id]
**概要**: ToDo項目更新

**Request Body:**
```json
{
  "text": "更新されたToDo内容",
  "priority": "medium",
  "completed": true
}
```

**Response:**
```json
{
  "id": "todo_uuid",
  "text": "更新されたToDo内容",
  "priority": "medium",
  "completed": true,
  "completed_at": "2025-08-07T10:30:00Z",
  "updated_at": "2025-08-07T10:30:00Z"
}
```

### 4. 音声処理 API

#### 4.1 POST /api/audio/transcribe
**概要**: 音声ファイルの文字起こし処理

**Request Body (multipart/form-data):**
```
audio_file: File (wav, mp3, m4a)
meeting_id: string
```

**Response:**
```json
{
  "transcription_id": "transcription_uuid",
  "transcription": "予算についてですが、年間で約200万円程度を想定しています...",
  "confidence_score": 0.95,
  "processing_duration": 2340,
  "created_at": "2025-08-07T10:30:00Z"
}
```

#### 4.2 POST /api/audio/similarity
**概要**: 文字起こし結果とToDo項目の類似度判定

**Request Body:**
```json
{
  "transcription_id": "transcription_uuid",
  "meeting_id": "meeting_uuid",
  "threshold": 0.7
}
```

**Response:**
```json
{
  "matches": [
    {
      "todo_id": "todo_uuid",
      "similarity_score": 0.85,
      "matched_keywords": ["予算", "200万円", "提案資料"],
      "auto_completed": true
    }
  ],
  "total_matches": 1
}
```

### 5. 商談分析 API

#### 5.1 GET /api/analytics/meeting/[id]
**概要**: 特定商談の詳細分析データ取得

**Response:**
```json
{
  "meeting_id": "meeting_uuid",
  "completion_rate": 83.3,
  "total_todos": 6,
  "completed_todos": 5,
  "priority_breakdown": {
    "high_priority_completed": 3,
    "medium_priority_completed": 2,
    "low_priority_completed": 0
  },
  "meeting_duration": 1800,
  "average_similarity_score": 0.78,
  "transcription_count": 12,
  "performance_insights": [
    "高優先度項目の完了率が高く、効率的な商談進行でした",
    "音声認識の精度が良好で、自動ToDo完了が機能しています"
  ]
}
```

#### 5.2 GET /api/analytics/performance
**概要**: ユーザー全体のパフォーマンス統計

**Query Parameters:**
- `period`: week | month | quarter (default: month)
- `start_date`: ISO 8601 date
- `end_date`: ISO 8601 date

**Response:**
```json
{
  "period": "month",
  "total_meetings": 15,
  "average_completion_rate": 76.4,
  "average_meeting_duration": 1620,
  "trends": {
    "completion_rate_trend": "+5.2%",
    "efficiency_trend": "+12.3%"
  },
  "top_categories": [
    {
      "category": "preparation",
      "completion_rate": 89.2
    },
    {
      "category": "solution",
      "completion_rate": 78.5
    }
  ]
}
```

## エラーハンドリング仕様

### エラーレスポンス形式
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "入力データに不正な値が含まれています",
  "details": {
    "field": "email",
    "reason": "Invalid email format"
  }
}
```

### エラーコード一覧

| コード | HTTP Status | 説明 |
|--------|-------------|------|
| VALIDATION_ERROR | 400 | 入力データ検証エラー |
| UNAUTHORIZED | 401 | 認証エラー |
| FORBIDDEN | 403 | アクセス権限なし |
| NOT_FOUND | 404 | リソース未発見 |
| RATE_LIMIT | 429 | レート制限超過 |
| AI_SERVICE_ERROR | 502 | AI処理サービスエラー |
| DATABASE_ERROR | 503 | データベース接続エラー |

## レート制限

### API エンドポイント別制限

| エンドポイント | 制限 | 単位 |
|---------------|------|------|
| /api/auth/* | 5 requests | 1分 |
| /api/meetings | 30 requests | 1分 |
| /api/todos | 60 requests | 1分 |
| /api/audio/* | 10 requests | 1分 |
| /api/analytics/* | 100 requests | 1分 |

## 開発・テスト用データ

### サンプル BANT回答
```json
{
  "budget": "年間予算300万円、月額25万円程度まで",
  "authority": "部長承認が必要だが、私が決裁権を持っています",
  "need": "営業チームの効率化と顧客管理の改善が急務",
  "timeline": "今四半期中に導入、来月から本格運用開始"
}
```

### サンプル ToDo生成結果
```json
[
  {
    "text": "予算300万円の範囲で提案資料を準備する",
    "priority": "high",
    "category": "preparation"
  },
  {
    "text": "部長承認のための稟議書類を用意する",
    "priority": "high", 
    "category": "authority"
  },
  {
    "text": "営業効率化の具体的な改善策を提案する",
    "priority": "high",
    "category": "solution"
  }
]
```

---

**作成日**: 2025-08-07  
**作成者**: worker2 (技術要件・データベース設計担当)  
**バージョン**: 1.0