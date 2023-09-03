<template>
  <v-alert v-if="loggedIn && authData.user.destroy_schedule_at != null && $route.path !== '/users/undo_delete'" type="warning">
    このアカウントは{{ $dateFormat('ja', authData.user.destroy_schedule_at, 'N/A') }}以降に削除されます。
    <NuxtLink to="/users/undo_delete">取り消しはこちら</NuxtLink>
  </v-alert>
</template>

<script>
const { status:authStatus, data:authData } = useAuthState()

export default {
  computed: {
    loggedIn () {
      return authStatus.value === 'authenticated'
    },
    authData () {
      return authData.value
    }
  }
}
</script>
