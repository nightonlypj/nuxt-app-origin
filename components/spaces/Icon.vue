<template>
  <span>
    <v-tooltip v-if="space.private" :id="`space_private_${space.code}`" bottom>
      <template #activator="{ on, attrs }">
        <v-icon dense v-bind="attrs" v-on="on">mdi-lock</v-icon>
      </template>
      非公開
    </v-tooltip>
    <v-tooltip v-if="space.current_member != null" :id="`space_power_${space.code}`" bottom>
      <template #activator="{ on, attrs }">
        <v-icon dense v-bind="attrs" v-on="on">{{ appMemberPowerIcon(space.current_member.power) }}</v-icon>
      </template>
      あなたは「{{ space.current_member.power_i18n }}」です。
    </v-tooltip>
    <v-tooltip v-if="space.destroy_schedule_at != null" :id="`space_destroy_schedule_${space.code}`" bottom>
      <template #activator="{ on, attrs }">
        <v-icon dense v-bind="attrs" v-on="on">mdi-delete-clock</v-icon>
      </template>
      {{ $dateFormat('ja', space.destroy_schedule_at, 'N/A') }}以降に削除される予定です。
    </v-tooltip>
  </span>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  mixins: [Application],

  props: {
    space: {
      type: Object,
      required: true
    }
  }
}
</script>
