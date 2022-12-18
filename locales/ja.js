module.exports = {
  app_name: 'NuxtAppOrigin',
  my_name: 'My name',
  my_url: 'https://example.com',
  enums: {
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
    download: [
      { text: '依頼日時', value: 'requested_at' },
      { text: 'ステータス', value: 'status' },
      { text: 'ファイル', value: 'file' },
      { text: '対象・形式等', value: 'target' }
    ],
    space: [
      { text: '名称', value: 'name', required: true },
      { text: '説明', value: 'description', required: false }
    ],
    member: [
      { text: 'メンバー', value: 'user.name', required: true, adminOnly: false },
      { text: 'メールアドレス', value: 'user.email', required: false, adminOnly: true },
      { text: '権限', value: 'power', required: false, adminOnly: false },
      { text: '招待者', value: 'invitationed_user.name', required: false, adminOnly: true },
      { text: '招待日時', value: 'invitationed_at', required: false, adminOnly: false },
      { text: '最終更新者', value: 'last_updated_user.name', required: false, adminOnly: true },
      { text: '最終更新日時', value: 'last_updated_at', required: false, adminOnly: true }
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
  notice: {
    download: {
      status: {
        waiting: 'ダウンロードファイルの作成を開始しました。完了まで暫くお待ちください。',
        processing: 'ダウンロードファイルの作成を開始しました。完了まで暫くお待ちください。',
        success: 'ダウンロードファイルの作成が完了しました。ダウンロード結果からダウンロードしてください。',
        failure: 'ダウンロードファイルの作成に失敗しました。お問い合わせ頂くか、やり直してください。'
      }
    }
  }
}
