<template>
  <v-alert
    v-if="$auth.loggedIn && $auth.user.destroy_schedule_at != null && $route.path !== '/users/undo_delete'"
    type="warning"
    class="mb-4"
  >
    このアカウントは{{ $dateFormat('ja', $auth.user.destroy_schedule_at, 'N/A') }}以降に削除されます。
    <NuxtLink to="/users/undo_delete">取り消しはこちら</NuxtLink>
  </v-alert>
</template>
