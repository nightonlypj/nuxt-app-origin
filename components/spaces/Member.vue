<template>
  <v-tooltip v-if="member != null" bottom>
    <template #activator="{ on, attrs }">
      <v-icon dense v-bind="attrs" v-on="on">{{ powerIcon }}</v-icon>
    </template>
    あなたは「{{ member.power_i18n }}」です。
  </v-tooltip>
</template>

<script>
export default {
  props: {
    member: {
      type: Object,
      default: null
    }
  },

  computed: {
    powerIcon () {
      switch (this.member.power) {
        case 'Admin':
          return 'mdi-account-cog'
        case 'Writer':
          return 'mdi-account-edit'
        default:
          return 'mdi-account'
      }
    }
  }
}
</script>
