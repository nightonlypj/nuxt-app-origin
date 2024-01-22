<template>
  <v-alert
    v-if="$auth.loggedIn && $auth.user.destroy_schedule_at != null && $route.path !== '/users/undo_delete'"
    type="warning"
    class="mb-4"
  >
    {{ $t('このアカウントは{date}以降に削除されます。', { date: dateFormat(locale, $auth.user.destroy_schedule_at, 'N/A') }) }}
    <NuxtLink :to="localePath('/users/undo_delete')">{{ $t('取り消しはこちら') }}</NuxtLink>
  </v-alert>
</template>

<script setup lang="ts">
import { dateFormat } from '~/utils/display'

const localePath = useLocalePath()
const { $auth } = useNuxtApp()
const $route = useRoute()
const { t: $t, locale } = useI18n()
</script>
