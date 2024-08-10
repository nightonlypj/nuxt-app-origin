export const commonConfig = {
  // 公開スペース使用可否  ※後からfalseに変更しても作成済みの公開スペースは表示されます。
  enablePublicSpace: true,
  defaultPrivateSpace: true,

  reloading: {
    maxCount: 50,
    sleepMs: 100
  },

  member: {
    powerIcon: {
      admin: 'mdi-account-cog',
      writer: 'mdi-account-edit',
      default: 'mdi-account'
    },
    createIcon: {
      create: 'mdi-check-circle',
      exist: 'mdi-information',
      notfound: 'mdi-alert'
    },
    createColor: {
      create: 'success',
      exist: 'info',
      notfound: 'error'
    }
  },

  apiLocale: {
    en: '/en',
    ja: ''
  },
  // ログインAPI
  authSignInURL: '/users/auth/sign_in.json',
  authRedirectSignInURL: '/users/sign_in',
  authRedirectHomeURL: '/',
  // ログアウトAPI
  authSignOutURL: '/users/auth/sign_out.json',
  authRedirectLogOutURL: '/users/sign_in',
  // トークン検証API
  authUserURL: '/users/auth/validate_token.json',
  // 招待情報取得API
  userInvitationUrl: '/users/auth/invitation.json',
  // アカウント登録API
  singUpUrl: '/users/auth/sign_up.json',
  singUpSuccessUrl: '/users/sign_in',
  // メールアドレス確認API
  confirmationUrl: '/users/auth/confirmation.json',
  confirmationSuccessUrl: '/users/sign_in',
  // アカウントロック解除API
  unlockUrl: '/users/auth/unlock.json',
  unlockRedirectUrl: '/users/sign_in',
  // パスワード再設定API
  passwordUrl: '/users/auth/password.json',
  passwordRedirectUrl: '/users/password',
  passwordUpdateUrl: '/users/auth/password/update.json',
  // ユーザー情報詳細API
  userDetailUrl: '/users/auth/detail.json',
  // ユーザー情報変更API
  userUpdateUrl: '/users/auth/update.json',
  // ユーザー画像変更API
  userImageUpdateUrl: '/users/auth/image/update.json',
  // ユーザー画像削除API
  userImageDeleteUrl: '/users/auth/image/delete.json',
  // アカウント削除API
  userDeleteUrl: '/users/auth/delete.json',
  userSendUndoDeleteUrl: '/users/undo_delete',
  // アカウント削除取り消しAPI
  userUndoDeleteUrl: '/users/auth/undo_delete.json',

  infomations: {
    // 大切なお知らせ一覧API
    importantUrl: '/infomations/important.json',
    // お知らせ一覧API
    listUrl: '/infomations.json',
    // お知らせ詳細API
    detailUrl: '/infomations/:id.json'
  },
  spaces: {
    // スペース一覧API
    listUrl: '/spaces.json',
    headers: [
      { title: '名称', key: 'name', required: true },
      { title: '説明', key: 'description' },
      { key: 'action', required: true }
    ],
    // スペース詳細API
    detailUrl: '/-/:code.json',
    // スペース作成API
    createUrl: '/spaces/create.json',
    // スペース設定変更API
    updateUrl: '/spaces/update/:code.json',
    // スペース削除API
    deleteUrl: '/spaces/delete/:code.json',
    // スペース削除取り消しAPI
    undoDeleteUrl: '/spaces/undo_delete/:code.json'
  },
  invitations: {
    // 招待URL一覧API
    listUrl: '/invitations/:space_code.json',
    headers: [
      { title: '招待URL', key: 'code', sortable: false, required: true, align: 'center' },
      { title: 'ステータス', key: 'status', sortable: false, required: true, cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { title: 'メールアドレス', key: 'email', sortable: false },
      { title: '権限', key: 'power', sortable: false, cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { title: '期限', key: 'ended_at', sortable: false, align: 'center' },
      { title: 'メモ', key: 'memo', sortable: false },
      { title: '作成者', key: 'created_user.name', defaultHidden: true, sortable: false },
      { title: '作成日時', key: 'created_at', defaultHidden: true, sortable: false, align: 'center' },
      { title: '更新者', key: 'last_updated_user.name', defaultHidden: true, sortable: false },
      { title: '更新日時', key: 'last_updated_at', defaultHidden: true, sortable: false, align: 'center' }
    ],
    // 招待URL詳細API
    detailUrl: '/invitations/:space_code/detail/:code.json',
    // 招待URL作成API
    createUrl: '/invitations/:space_code/create.json',
    // 招待URL設定変更API
    updateUrl: '/invitations/:space_code/update/:code.json'
  },
  members: {
    // メンバー一覧API
    listUrl: '/members/:space_code.json',
    headers: [
      { key: 'data-table-select', adminOnly: true },
      { title: 'メンバー', key: 'user.name', required: true },
      { title: 'メールアドレス', key: 'user.email', adminOnly: true },
      { title: '権限', key: 'power', cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { title: '招待者', key: 'invitationed_user.name', adminOnly: true },
      { title: '招待日時', key: 'invitationed_at', align: 'center' },
      { title: '更新者', key: 'last_updated_user.name', adminOnly: true, defaultHidden: true },
      { title: '更新日時', key: 'last_updated_at', adminOnly: true, defaultHidden: true, align: 'center' }
    ],
    // メンバー詳細API
    detailUrl: '/members/:space_code/detail/:user_code.json',
    // メンバー招待API
    createUrl: '/members/:space_code/create.json',
    resultHeaders: [
      { title: 'メールアドレス', key: 'email', sortable: false },
      { title: '結果', key: 'result', sortable: false }
    ],
    // メンバー情報変更API
    updateUrl: '/members/:space_code/update/:user_code.json',
    // メンバー解除API
    deleteUrl: '/members/:space_code/delete.json'
  },
  downloads: {
    // ダウンロード結果一覧API
    listUrl: '/downloads.json',
    headers: [
      { title: '依頼日時', key: 'requested_at', sortable: false, cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { title: '完了日時', key: 'completed_at', sortable: false, cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { title: 'ステータス', key: 'status', sortable: false, cellProps: { class: 'px-1 py-2 text-no-wrap' } },
      { title: 'ファイル', key: 'file', sortable: false, headerProps: { class: 'text-no-wrap text-center' }, cellProps: { class: 'px-1 py-2 text-center' } },
      { title: '対象・形式等', key: 'target', sortable: false }
    ],
    // ダウンロードファイル取得
    fileUrl: '/downloads/file/:id.csv',
    // ダウンロード依頼API
    createUrl: '/downloads/create.json'
  }
}
