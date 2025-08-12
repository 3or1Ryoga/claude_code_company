interface ErrorInfo {
  title: string
  message: string
  variant: 'default' | 'destructive'
  actionText?: string
  actionHref?: string
  troubleshoot?: string[]
}

export function getSignupErrorInfo(error: string): ErrorInfo {
  switch (error) {
    case 'User already exists':
      return {
        title: 'アカウントが既に存在します',
        message: '指定されたメールアドレスは既に登録されています。',
        variant: 'default',
        actionText: 'ログインページへ',
        actionHref: '/login',
        troubleshoot: [
          '既に登録済みの場合はログインしてください',
          'パスワードを忘れた場合はパスワードリセットをお試しください'
        ]
      }
    case 'Invalid email format':
      return {
        title: 'メールアドレスの形式が正しくありません',
        message: '有効なメールアドレスを入力してください。',
        variant: 'destructive',
        troubleshoot: [
          '例: user@example.com の形式で入力してください',
          '特殊文字や空白が含まれていないか確認してください'
        ]
      }
    case 'Password too weak':
      return {
        title: 'パスワードが弱すぎます',
        message: 'より強力なパスワードを設定してください。',
        variant: 'destructive',
        troubleshoot: [
          '8文字以上の長さにしてください',
          '大文字・小文字・数字・記号を組み合わせてください'
        ]
      }
    default:
      return {
        title: 'サインアップエラー',
        message: error || '新規登録中に問題が発生しました。',
        variant: 'destructive',
        troubleshoot: [
          'しばらく時間をおいてから再度お試しください',
          '問題が続く場合はサポートまでお問い合わせください'
        ]
      }
  }
}

export function getAuthErrorInfo(error: string): ErrorInfo {
  switch (error) {
    case 'Invalid login credentials':
      return {
        title: 'ログインに失敗しました',
        message: 'メールアドレスまたはパスワードが正しくありません。',
        variant: 'destructive',
        troubleshoot: [
          'メールアドレスとパスワードを再度確認してください',
          'パスワードの大文字・小文字に注意してください',
          'アカウントが存在しない場合は新規登録を行ってください'
        ]
      }
    case 'Email not confirmed':
      return {
        title: 'メール認証が必要です',
        message: '登録時に送信されたメール認証を完了してください。',
        variant: 'default',
        troubleshoot: [
          'メールボックスを確認し、認証リンクをクリックしてください',
          'スパムフォルダもご確認ください',
          '認証メールが届かない場合は再送信をお試しください'
        ]
      }
    default:
      return {
        title: 'エラーが発生しました',
        message: error || '認証処理中に問題が発生しました。',
        variant: 'destructive',
        troubleshoot: [
          'しばらく時間をおいてから再度お試しください',
          '問題が続く場合はサポートまでお問い合わせください'
        ]
      }
  }
}
