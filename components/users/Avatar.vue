<template>
  <div v-if="user != null">
    <v-avatar v-if="user.image_url != null" size="32px" class="mr-1">
      <v-img :src="user.image_url.small" />
    </v-avatar>
    <template v-if="!user.deleted">
      {{ user.name }}
      <span v-if="user.destroy_schedule_at != null" :id="`user_destroy_schedule_${user.code}`">
        <v-icon class="ml-1">mdi-delete-clock</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ $dateFormat('ja', user.destroy_schedule_at, 'N/A') }}以降に削除される予定です。
        </v-tooltip>
      </span>
    </template>
    <template v-else>
      N/A
    </template>
  </div>
</template>

<script>
export default defineNuxtComponent({
  props: {
    user: {
      type: Object,
      default: null
    }
  }
})
</script>
