module.exports = {
  app_name: 'NuxtAppOrigin',
  my_name: 'My name',
  my_url: 'https://example.com',
  network: {
    failure: '通信に失敗しました。しばらく時間をあけてから、やり直してください。',
    error: '通信エラーが発生しました。しばらく時間をあけてから、やり直してください。'
  },
  system: {
    error: 'エラーが発生しました。しばらく時間をあけてから、やり直してください。',
    default: 'エラーが発生しました。'
  },
  auth: {
    signed_out: 'ログアウトしました。',
    already_authenticated: '既にログインしています。',
    already_signed_out: '既にログアウトされています。',
    unauthenticated: 'ログインしてください。',
    reset_password_token_blank: 'URLが正しくありません。最初からやり直してください。',
    destroy_reserved: 'アカウント削除予定の為、この操作はできません。',
    not_destroy_reserved: '既に取り消し済みか、アカウント削除していません。'
  }
}
