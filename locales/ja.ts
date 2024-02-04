export const ja = {
  app_name: 'NuxtAppOrigin',
  sub_title: ': ベースアプリケーション',
  env_name: {
    development: '【開発環境】',
    test: '【テスト環境】',
    staging: '【STG環境】',
    production: ''
  },
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
      copy_failure: 'コピーに失敗しました。しばらく時間をあけてから、やり直してください。'
    }
  },
  notice: {
    member: {
      destroy: 'メンバー解除処理が完了しました。' // NOTE: 正常に完了したかは不明
    },
    invitation: {
      copy_success: 'クリップボードにコピーしました。'
    }
  },
  パラメータ不一致: 'パラメータが一致していません。ログを確認してください。',

  '1件': '1件',
  '{total}件': '{total}件',
  '{total}件中 {start}-{end}件を表示': '{total}件中 {start}-{end}件を表示',
  '{name}はありません。': '{name}はありません。',
  一覧: '一覧',

  送信: '送信',
  登録: '登録',
  変更: '変更',
  削除: '削除',
  アップロード: 'アップロード',
  取り消し: '取り消し',
  'いいえ（キャンセル）': 'いいえ（キャンセル）',
  'はい（削除）': 'はい（削除）',
  'はい（削除取り消し）': 'はい（削除取り消し）',

  トップページ: 'トップページ',
  サービス概要: 'Nuxt.js(Vue.js/Vuetify)のベースアプリケーションです。（サービス概要に差し替え）',
  サービス説明: 'サービスを迅速に立ち上げられるように、よく使う機能を予め開発しています。（サービス説明に差し替え）',
  リポジトリ: 'リポジトリ',
  development: 'development',

  テーマカラー確認: 'テーマカラー確認',
  クリップボードコピー成功: '「{text}」をクリップボードにコピーしました。',
  クリップボードコピー失敗: 'コピーに失敗しました。しばらく時間をあけてから、やり直してください。',

  お知らせ: 'お知らせ',
  大切なお知らせ: '大切なお知らせ',

  アカウント登録: 'アカウント登録',
  無料で始める: '無料で始める',
  氏名: '氏名',
  メールアドレス: 'メールアドレス',
  パスワード: 'パスワード',
  'パスワード(確認)': 'パスワード(確認)',

  ログイン: 'ログイン',
  ログアウト: 'ログアウト',
  ログアウト確認メッセージ: 'ログアウトします。よろしいですか？',
  'いいえ（トップページ）': 'いいえ（トップページ）',
  'はい（ログアウト）': 'はい（ログアウト）',

  ユーザー情報: 'ユーザー情報',
  メール確認メッセージ: '「{email}」のメールを確認してください。',
  メール確認補足: '誤っている場合や再送する場合は入力し直してください。',
  '(変更する場合のみ)': '(変更する場合のみ)',
  現在のパスワード: '現在のパスワード',

  画像ファイル: '画像ファイル',
  画像削除: '画像削除',
  画像削除確認メッセージ: '本当に削除しますか？',

  パスワード再設定: 'パスワード再設定',
  新しいパスワード: '新しいパスワード',
  '新しいパスワード(確認)': '新しいパスワード(確認)',

  メールアドレス確認: 'メールアドレス確認',
  アカウントロック解除: 'アカウントロック解除',

  アカウント削除: 'アカウント削除',
  アカウント削除メッセージ: 'アカウントは{days}日後に削除されます。それまでは取り消し可能です。',
  アカウント削除補足: '削除されるまではログインできますが、一部機能が制限されます。',
  アカウント削除情報: 'このアカウントは{date}以降に削除されます。',
  アカウント削除確認メッセージ: '本当に削除しますか？',
  取り消しはこちら: '取り消しはこちら',

  アカウント削除取り消し: 'アカウント削除取り消し',
  アカウント削除取り消しメッセージ: 'このアカウントは{destroy_schedule_at}以降に削除されます。それまでは取り消し可能です。',
  アカウント削除取り消し補足: '（{destroy_requested_at}にアカウント削除依頼を受け付けています）',
  取り消し確認メッセージ: '本当に取り消しますか？'
}
