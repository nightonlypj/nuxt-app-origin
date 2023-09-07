export default defineNuxtPlugin((_nuxtApp) => {
  const { status: authStatus, data: authData } = useAuthState()
  return {
    provide: {
      auth: reactive({
        loggedIn: computed(() => authStatus.value === 'authenticated'),
        // data: computed(() => authData.value),
        user: computed(() => authData.value?.user),
        setData: (data: object) => { authData.value = data },
        // setUser: (user: object) => { authData.value.user = user }
        resetUserInfomationUnreadCount: () => { authData.value.user.infomation_unread_count = 0 }
      })
    }
  }
})
