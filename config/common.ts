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
    ja: '',
    unknown: ''
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
    // メンバー詳細API
    detailUrl: '/members/:space_code/detail/:user_code.json',
    // メンバー招待API
    createUrl: '/members/:space_code/create.json',
    // メンバー情報変更API
    updateUrl: '/members/:space_code/update/:user_code.json',
    // メンバー解除API
    deleteUrl: '/members/:space_code/delete.json'
  },
  downloads: {
    // ダウンロード結果一覧API
    listUrl: '/downloads.json',
    // ダウンロードファイル取得
    fileUrl: '/downloads/file/:id.csv',
    // ダウンロード依頼API
    createUrl: '/downloads/create.json'
  }
}
