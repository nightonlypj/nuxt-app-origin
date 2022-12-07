module.exports = {
  reloading: {
    maxCount: 50,
    sleepMs: 100
  },
  enum: {
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
    }
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

  // 大切なお知らせ一覧API
  importantInfomationsUrl: '/infomations/important.json',
  // お知らせ一覧API
  infomationsUrl: '/infomations.json',
  // お知らせ詳細API
  infomationDetailUrl: '/infomations/:id.json',

  // ダウンロード結果一覧API
  downloadsUrl: '/downloads.json',
  // ダウンロードAPI
  downloadFileUrl: '/downloads/file/:id.json',
  // ダウンロード依頼API
  downloadCreateUrl: '/downloads/create.json',

  // スペース一覧API
  spacesUrl: '/spaces.json',
  // スペース詳細API
  spaceDetailUrl: '/-/:code.json',

  // メンバー一覧API
  membersUrl: '/members/:code.json',
  // メンバー招待API
  memberCreateUrl: '/members/:code/create.json',
  // メンバー情報変更API
  memberUpdateUrl: '/members/:code/update/:user_code.json',
  // メンバー解除API
  memberDeleteUrl: '/members/:code/delete.json'
}
