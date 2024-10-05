<template>
  <v-alert v-if="space.destroy_schedule_at != null" type="warning" class="mb-4">
    {{ $t('スペース削除情報', { date: dateFormat(locale, space.destroy_schedule_at, 'N/A') }) }}
    <NuxtLink v-if="currentMemberAdmin(space)" :to="localePath(`/spaces/undo_delete/${space.code}`)">{{ $t('取り消しはこちら') }}</NuxtLink>
  </v-alert>
</template>

<script setup lang="ts">
import { dateFormat } from '~/utils/display'
import { currentMemberAdmin } from '~/utils/members'

defineProps({
  space: {
    type: Object,
    required: true
  }
})
const localePath = useLocalePath()
const { t: $t, locale } = useI18n()
</script>
