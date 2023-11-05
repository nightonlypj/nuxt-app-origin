import { redirectAuth, redirectError } from '~/utils/redirect'

// ユーザー情報更新
async function updateAuthUser ($t: any) {
  const [response, data] = await useAuthUser()
  if (response?.ok) { return true }

  if (response?.status === 401) {
    useAuthSignOut(true)
    redirectAuth({ notice: $t('auth.unauthenticated') })
  } else if (data == null) {
    redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
  } else {
    redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
  }
  return false
}

export {
  updateAuthUser
}
