export default defineNuxtPlugin(() => {
  const { status: authStatus, data: authData } = useAuthState()
  return {
    provide: {
      auth: reactive({
        loggedIn: computed(() => authStatus.value === 'authenticated'),
        data: computed(() => authData.value),
        user: computed(() => (authData.value as any)?.user),
        setData: (data: object) => { (authData.value as any) = data },
        setUser: (user: object) => { (authData.value as any) = { ...authData.value, user } },
        resetUserInfomationUnreadCount: () => { (authData.value as any).user.infomation_unread_count = 0 },
        updateUserUndownloadedCount: (count: number) => { (authData.value as any).user.undownloaded_count = count }
      })
    }
  }
})
