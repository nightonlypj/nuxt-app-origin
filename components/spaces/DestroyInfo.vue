<template>
  <v-alert v-if="space.destroy_schedule_at != null" type="warning">
    このスペースは{{ $dateFormat('ja', space.destroy_schedule_at, 'N/A') }}以降に削除されます。
    <NuxtLink v-if="currentMemberAdmin" :to="`/spaces/undo_delete/${space.code}`">取り消しはこちら</NuxtLink>
  </v-alert>
</template>

<script>
export default {
  props: {
    space: {
      type: Object,
      required: true
    }
  },

  computed: {
    currentMemberAdmin () {
      return this.space?.current_member?.power === 'admin'
    }
  }
}
</script>
