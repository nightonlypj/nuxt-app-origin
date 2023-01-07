module.exports = {
  // 公開スペース使用可否  ※後からfalseに変更しても作成済みの公開スペースは表示されます。
  enablePublicSpace: true,
  defaultPrivateSpace: true,

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
  // スペース作成API
  spaceCreateUrl: '/spaces/create.json',
  // スペース設定変更API
  spaceUpdateUrl: '/spaces/update/:code.json',
  // スペース削除API
  spaceDeleteUrl: '/spaces/delete/:code.json',
  // スペース削除取り消しAPI
  spaceUndoDeleteUrl: '/spaces/undo_delete/:code.json',

  // 招待URL一覧API
  invitationsUrl: '/invitations/:space_code.json',
  // 招待URL詳細API
  invitationDetailUrl: '/invitations/:space_code/detail/:code.json',
  // 招待URL作成API
  invitationCreateUrl: '/invitations/:space_code/create.json',
  // 招待URL設定変更API
  invitationUpdateUrl: '/invitations/:space_code/update/:code.json',

  // メンバー一覧API
  membersUrl: '/members/:space_code.json',
  // メンバー詳細API
  memberDetailUrl: '/members/:space_code/detail/:user_code.json',
  // メンバー招待API
  memberCreateUrl: '/members/:space_code/create.json',
  // メンバー情報変更API
  memberUpdateUrl: '/members/:space_code/update/:user_code.json',
  // メンバー解除API
  memberDeleteUrl: '/members/:space_code/delete.json'
}
