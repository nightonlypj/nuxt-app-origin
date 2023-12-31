import { redirectAuth, redirectError } from '~/utils/redirect'

// ユーザー情報更新 // NOTE: 最新の状態で確認する為
async function updateAuthUser ($t: any) {
  const [response, data] = await useAuthUser()
  if (response?.ok) { return true }

  if (response?.status === 401) {
    useAuthSignOut(true)
    redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') })
  } else if (data == null) {
    redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
  } else {
    redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
  }
  return false
}

// レスポンスのuidチェック // NOTE: 無限スクロールの途中で未ログインや別ユーザーに変わったらリロードする
function checkHeadersUid (response: any, page: Ref<number>, uid: Ref<string | null>) {
  if (!response?.ok) { return true }

  if (page.value === 1) {
    uid.value = response.headers.get('uid')
  } else if (uid.value !== (response.headers.get('uid'))) {
    location.reload()
    return false
  }
  return true
}

export {
  updateAuthUser,
  checkHeadersUid
}
