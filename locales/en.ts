export const en = {
  app_name: 'NuxtAppOrigin',
  sub_title: ': base application',
  env_name: {
    development: ' [Development]',
    test: ' [Test]',
    staging: ' [Staging]',
    production: ''
  },
  my_name: 'My name',
  my_url: 'https://example.com',
  enums: {
    invitation: {
      power: {
        admin: 'Administrator',
        writer: 'Writer',
        reader: 'Reader'
      }
    },
    member: {
      power: {
        admin: 'Administrator',
        writer: 'Writer',
        reader: 'Reader'
      }
    },
    download: {
      target: {
        select: 'Selected items',
        search: 'Search',
        all: 'All'
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
  network: {
    failure: 'Communication failed. Please wait a while and try again.',
    failure_short: 'Communication failed.',
    error: 'A communication error has occurred. Please wait a while and try again.',
    error_short: 'A communication error has occurred.'
  },
  system: {
    notfound: 'Page Not Found.',
    error: 'A system error has occurred. Please wait a while and try again.',
    error_short: 'A system error has occurred.',
    default: 'An error has occurred. Please wait a while and try again.',
    default_short: 'An error has occurred.',
    timeout: 'Timed out. Please wait a while and try again.'
  },
  auth: {
    signed_out: 'logged out.',
    already_authenticated: 'You are already logged in.',
    already_signed_out: 'You are already logged out.',
    unauthenticated: 'Please login.',
    reset_password_token_blank: 'URL is incorrect. Please start over.',
    destroy_reserved: 'This operation is not possible because your account is scheduled to be deleted.',
    not_destroy_reserved: 'It has already been canceled or the account has not been deleted.',
    forbidden: 'You do not have access privileges.'
  },
  alert: {
    space: {
      destroy_reserved: 'This operation cannot be performed because the space is scheduled to be deleted.',
      not_destroy_reserved: 'It has already been canceled or the space has not been deleted.'
    },
    invitation: {
      email_joined: 'You cannot perform this operation because you have already participated.',
      copy_failure: 'Copy failed. Please wait a while and try again.'
    }
  },
  notice: {
    member: {
      destroy: 'Member cancellation processing has completed.' // NOTE: 正常に完了したかは不明
    },
    invitation: {
      copy_success: 'Copied to clipboard.'
    }
  },
  'Not Found': 'Not Found',
  エラー: 'Error',
  パラメータ不一致: 'Parameter mismatch. Please check the log.',

  選択: 'Select',
  '{total}件（単数）': '{total} item',
  '{total}件（複数）': '{total} items',
  '{total}名（単数）': '{total} person',
  '{total}名（複数）': '{total} persons',
  '{total}名中（単数）': 'Total {total} person',
  '{total}名中（複数）': 'Total {total} persons',
  '{total}件中 {start}-{end}件を表示': '{start}-{end} of {total} in total',
  '{name}はありません。': 'There is no {name}.',
  '対象の{name}が見つかりません。': 'Target {name} not found.',
  '対象が見つかりません。': 'Target not found.',

  '続きを取得できませんでした。': 'Could not get more.',
  再取得: 'Reacquisition',

  必須: 'Required',
  任意: 'Optional',
  入力: 'Input',
  プレビュー: 'Preview',
  'Markdownに対応しています。': 'Compatible with Markdown.',

  送信: 'Send',
  登録: 'Create',
  作成: 'Create',
  変更: 'Update',
  更新: 'Update',
  削除: 'Delete',
  検索: 'Search',
  検索オプション: 'Options',
  アップロード: 'Upload',
  取り消し: 'Cancel',
  キャンセル: 'Cancel',
  'いいえ（キャンセル）': 'No (Cancel)',
  'はい（削除）': 'Yes (Delete)',
  'はい（削除取り消し）': 'Yes (Cancel deletion)',

  作成情報: 'Created',
  作成者: 'Author',
  作成日時: 'Creation datetime',
  更新情報: 'Updated',
  更新者: 'Changer',
  更新日時: 'Updated datetime',

  トップページ: 'Top page',
  サービス概要: 'This is an Nuxt.js(Vue.js/Vuetify) base application. (Replaced with service overview)',
  サービス説明: 'We have developed frequently used functions in advance so that you can quickly launch your service. (Replaced with service description)',
  リポジトリ: 'Repository',
  development: 'development',

  テーマカラー確認: 'Confirm theme color',
  クリップボードコピー成功: 'I copied "{text}" to my clipboard.',
  クリップボードコピー失敗: 'Copy failed. Please wait a while and try again.',
  Markdown確認: 'Markdown confirmation',

  大切なお知らせ: 'Important infomation',
  お知らせ: 'Infomation',
  一覧: 'List',

  アカウント登録: 'Create account',
  無料で始める: 'Get started for free',
  氏名: 'Full name',
  メールアドレス: 'Email address',
  パスワード: 'Password',
  'パスワード(確認)': 'Password confirmation',

  ログイン: 'Login',
  ログアウト: 'Logout',
  ログアウト確認メッセージ: 'Log out. Is it OK?',
  'いいえ（トップページ）': 'No (Top page)',
  'はい（ログアウト）': 'Yes (Logout)',

  ユーザー情報: 'User information',
  メール確認メッセージ: 'Please check your email at "{email}".',
  メール確認補足: 'If it is incorrect or you would like to resend it, please re-enter it.',
  '(変更する場合のみ)': '(Only when changing)',
  現在のパスワード: 'Current Password',

  画像ファイル: 'Image file',
  画像削除: 'Delete',
  画像削除確認メッセージ: 'Do you really want to delete this?',

  パスワード再設定: 'Resetting a password',
  新しいパスワード: 'New Password',
  '新しいパスワード(確認)': 'New Password confirmation',

  メールアドレス確認: 'Confirm email address',
  アカウントロック解除: 'Account unlock',

  アカウント削除: 'Account deletion',
  アカウント削除メッセージ: 'Your account will be deleted in {days} days. You can cancel until then.',
  アカウント削除補足: 'You can log in until it is deleted, but some functions will be restricted.',
  アカウント削除情報: 'This account will be deleted after {date}.',
  アカウント削除確認メッセージ: 'Do you really want to delete this?',
  取り消しはこちら: 'Click here to cancel',

  アカウント削除取り消し: 'Cancel account deletion',
  アカウント削除取り消しメッセージ: 'This account will be deleted after {date}. You can cancel until then.',
  アカウント削除取り消し補足: '(Accepting account deletion requests at {date})',
  アカウント削除取り消し確認メッセージ: 'Are you sure you want to cancel?',

  スペース: 'Space',
  公開スペース: 'Public space',
  新しい公開スペース: 'New public space',
  参加スペース: 'Joining space',
  スペースなしメッセージ: 'Create a new space or contact the administrator of the space you want to join to add you!',

  スペース削除情報: 'This space will be removed after {date}.',
  探す: 'Look for',
  名称や説明を入力: 'Enter name and description',
  範囲: 'Scope',
  公開: 'Public',
  非公開: 'Private',
  状況: 'Situation',
  参加: 'Joining',
  未参加: 'Not Joining',
  状態: 'Condition',
  有効: 'Active',
  削除予定: 'To be deleted',
  'あなたは{power}です。': 'You are {power}.',
  '{date}以降に削除される予定です。': 'It will be deleted after {date}.',

  スペース作成: 'Create space',
  スペース設定: 'Space settings',
  名称: 'Name',
  スペース名を入力: 'Enter space name',
  説明: 'Description',
  スペースの説明を入力: 'Enter space description',
  '誰でも表示できる（公開）': 'Anyone can view (Public)',
  'メンバーのみ表示できる（非公開）': 'Only members can view (Private)',
  画像: 'Image',
  '削除（初期画像に戻す）': 'Delete (Return to initial image)',

  スペース削除: 'Space deletion',
  スペース削除メッセージ: 'Space will be deleted after {days} days. You can cancel until then.',
  スペース削除補足: 'You can access it until it is deleted, but some functions will be restricted.',
  スペース削除確認メッセージ: 'Do you really want to delete this?',

  スペース削除取り消し: 'Cancel space deletion',
  スペース削除取り消しメッセージ: 'This space will be deleted after {date}. You can cancel until then.',
  スペース削除取り消し補足: '(We are accepting space deletion requests at {date})',
  スペース削除取り消し確認メッセージ: 'Are you sure you want to cancel?',

  メンバー一覧: 'Member list',
  ユーザー名を入力: 'Enter username',
  ユーザー名やメールアドレスを入力: 'Enter username and email address',
  権限: 'Power',
  メンバー: 'Member',
  招待者: 'Invitee',
  招待日時: 'Invitation datetime',
  '「{power}」のみ表示': 'Display only "{power}"',

  メンバー招待: 'Member invitation',
  'メンバー招待（ボタン）': 'Invitation',
  メンバー招待メッセージ: 'You will only be invited if your account exists.',
  'メンバー招待（結果）': 'Member invitation (Result)',
  招待: 'Invitation',
  参加中: 'Joining',
  未登録: 'Unregistered',
  結果: 'Result',

  メンバー情報変更: 'Change member information',
  招待情報: 'Invitation',

  メンバー解除: 'Cancel membership',
  メンバー解除確認メッセージ: 'Do you want to remove the selected members?',
  'はい（解除）': 'Yes (Release)',

  招待URL一覧: 'Invitation URL list',
  招待URL: 'Invitation URL',
  期限: 'Period',
  メモ: 'Memo',
  クリップボードにコピー: 'Copy to clipboard',

  招待URL作成: 'Create invitation URL',
  メール: 'Email',
  許可ドメイン: 'Allowed domains',

  招待URL設定変更: 'Change invitation URL settings',
  削除して使用できないようにする: 'Delete and make it unusable',
  招待URL削除メッセージ: '(It will be permanently deleted in {days} days. You can undo it until then.)',
  削除を取り消して使用できるようにする: 'Undelete and make available',
  招待URL削除取り消しメッセージ: '(Delete accepted at {date})',

  設定: 'Setting',
  設定変更: 'Setting change',
  表示項目: 'Display items',
  全選択: 'Select all',
  全解除: 'Full release',

  ダウンロード: 'Download',
  対象: 'Target',
  形式: 'Format',
  文字コード: 'Character code',
  改行コード: 'New line code',
  出力項目: 'Output items',

  ダウンロード結果: 'Download results',
  依頼日時: 'Request datetime',
  完了日時: 'Completion datetime',
  ステータス: 'Status',
  ファイル: 'File',
  // eslint-disable-next-line quote-props
  '対象・形式等': 'Target/format etc.'
}
