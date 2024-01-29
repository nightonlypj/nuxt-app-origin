<template>
  <v-alert
    v-if="$auth.loggedIn && $auth.user.destroy_schedule_at != null && !$route.path.match(/\/users\/undo_delete$/)"
    type="warning"
    class="mb-4"
  >
    {{ $t('アカウント削除情報', { date: dateFormat(locale, $auth.user.destroy_schedule_at, 'N/A') }) }}
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
