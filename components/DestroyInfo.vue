<template>
  <v-alert v-if="$auth.loggedIn && $auth.user != null && $auth.user.destroy_schedule_at != null && $route.path !== '/users/undo_delete'" type="warning">
    このアカウントは{{ $dateFormat($auth.user.destroy_schedule_at, 'ja') || 'N/A' }}以降に削除されます。
    <NuxtLink to="/users/undo_delete">取り消しはこちら</NuxtLink>
  </v-alert>
</template>
