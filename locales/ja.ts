export const ja = {
  app_name: 'NuxtAppOrigin',
  sub_title: ': ベースアプリケーション',
  my_name: 'My name',
  my_url: 'https://example.com',
  enums: {
    invitation: {
      power: {
        admin: '管理者',
        writer: '投稿者',
        reader: '閲覧者'
      }
    },
    member: {
      power: {
        admin: '管理者',
        writer: '投稿者',
        reader: '閲覧者'
      }
    },
    download: {
      target: {
        select: '選択項目',
        search: '検索',
        all: '全て'
      },
      format: {
        csv: 'CSV',
        tsv: 'TSV'
      },
      char_code: {
        sjis: 'Shift_JIS',
        eucjp: 'EUC-JP',
        utf8: 'UTF-8'
      },
      newline_code: {
        crlf: 'CR+LF',
        lf: 'LF',
        cr: 'CR'
      }
    }
  },
  items: {
    space: [
      { title: '名称', key: 'name', required: true },
      { title: '説明', key: 'description', required: false }
    ],
    invitation: [
      { title: '招待URL', key: 'code', required: true },
      { title: 'ステータス', key: 'status', required: true },
      { title: 'メールアドレス', key: 'email', required: false },
      { title: '権限', key: 'power', required: false },
      { title: '期限', key: 'ended_at', required: false },
      { title: 'メモ', key: 'memo', required: false },
      { title: '作成者', key: 'created_user.name', required: false },
      { title: '作成日時', key: 'created_at', required: false },
      { title: '更新者', key: 'last_updated_user.name', required: false },
      { title: '更新日時', key: 'last_updated_at', required: false }
    ],
    member: [
      { title: 'メンバー', key: 'user.name', required: true, adminOnly: false },
      { title: 'メールアドレス', key: 'user.email', required: false, adminOnly: true },
      { title: '権限', key: 'power', required: false, adminOnly: false },
      { title: '招待者', key: 'invitationed_user.name', required: false, adminOnly: true },
      { title: '招待日時', key: 'invitationed_at', required: false, adminOnly: false },
      { title: '更新者', key: 'last_updated_user.name', required: false, adminOnly: true },
      { title: '更新日時', key: 'last_updated_at', required: false, adminOnly: true }
    ],
    download: [
      { title: '依頼日時', key: 'requested_at' },
      { title: '完了日時', key: 'completed_at' },
      { title: 'ステータス', key: 'status' },
      { title: 'ファイル', key: 'file' },
      { title: '対象・形式等', key: 'target' }
    ]
  },
  network: {
    failure: '通信に失敗しました。しばらく時間をあけてから、やり直してください。',
    failure_short: '通信に失敗しました。',
    error: '通信エラーが発生しました。しばらく時間をあけてから、やり直してください。',
    error_short: '通信エラーが発生しました。'
  },
  system: {
    notfound: 'ページが見つかりません。',
    error: 'システムエラーが発生しました。しばらく時間をあけてから、やり直してください。',
    error_short: 'システムエラーが発生しました。',
    default: 'エラーが発生しました。しばらく時間をあけてから、やり直してください。',
    default_short: 'エラーが発生しました。',
    timeout: 'タイムアウトしました。しばらく時間をあけてから、やり直してください。'
  },
  auth: {
    signed_out: 'ログアウトしました。',
    already_authenticated: '既にログインしています。',
    already_signed_out: '既にログアウトされています。',
    unauthenticated: 'ログインしてください。',
    reset_password_token_blank: 'URLが正しくありません。最初からやり直してください。',
    destroy_reserved: 'アカウント削除予定の為、この操作はできません。',
    not_destroy_reserved: '既に取り消し済みか、アカウント削除されていません。',
    forbidden: 'アクセス権限がありません。'
  },
  alert: {
    space: {
      destroy_reserved: 'スペース削除予定の為、この操作はできません。',
      not_destroy_reserved: '既に取り消し済みか、スペース削除されていません。'
    },
    invitation: {
      email_joined: '参加済みの為、この操作はできません。',
      copy_failure: 'コピーに失敗しました。'
    }
  },
  notice: {
    invitation: {
      copy_success: 'クリップボードにコピーしました。'
    }
  }
}
