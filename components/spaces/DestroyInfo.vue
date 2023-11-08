<template>
  <v-alert v-if="space.destroy_schedule_at != null" type="warning" class="mb-4">
    このスペースは{{ dateFormat('ja', space.destroy_schedule_at, 'N/A') }}以降に削除されます。
    <NuxtLink v-if="currentMemberAdmin(space)" :to="`/spaces/undo_delete/${space.code}`">取り消しはこちら</NuxtLink>
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
</script>
