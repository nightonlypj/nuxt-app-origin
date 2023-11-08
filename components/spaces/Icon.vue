<template>
  <span v-if="space.private" :id="`space_icon_private_${space.code}`">
    <v-icon size="x-small" class="ml-1">mdi-lock</v-icon>
    <v-tooltip activator="parent" location="bottom">非公開</v-tooltip>
  </span>
  <span v-if="space.current_member != null" :id="`space_icon_power_${space.code}`">
    <v-icon size="x-small" class="ml-1">{{ memberPowerIcon(space.current_member.power) }}</v-icon>
    <v-tooltip activator="parent" location="bottom">
      あなたは「{{ space.current_member.power_i18n }}」です。
    </v-tooltip>
  </span>
  <span v-if="space.destroy_schedule_at != null" :id="`space_icon_destroy_schedule_${space.code}`">
    <v-icon size="x-small" class="ml-1">mdi-delete-clock</v-icon>
    <v-tooltip activator="parent" location="bottom">
      {{ dateFormat('ja', space.destroy_schedule_at, 'N/A') }}以降に削除される予定です。
    </v-tooltip>
  </span>
</template>

<script setup lang="ts">
import { memberPowerIcon } from '~/utils/members'
import { dateFormat } from '~/utils/display'

defineProps({
  space: {
    type: Object,
    required: true
  }
})
</script>
