export const commonConfig = {
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
  }
}
