<template>
  <div v-if="user != null">
    <v-avatar v-if="user.image_url != null" size="32px">
      <v-img :src="user.image_url.small" />
    </v-avatar>
    <template v-if="!user.deleted">
      {{ user.name }}
      <v-tooltip v-if="user.destroy_schedule_at != null" :id="`user_destroy_schedule_${user.code}`" bottom>
        <template #activator="{ on, attrs }">
          <v-icon dense v-bind="attrs" v-on="on">mdi-delete-clock</v-icon>
        </template>
        {{ $dateFormat(user.destroy_schedule_at, 'ja', 'N/A') }}以降に削除される予定です。
      </v-tooltip>
    </template>
    <template v-else>
      N/A
    </template>
  </div>
</template>

<script>
export default {
  props: {
    user: {
      type: Object,
      default: null
    }
  }
}
</script>
