<template>
  <v-chip v-if="infomation != null && infomation.label !== 'Not'" small :color="labelColor">{{ infomation.label_i18n }}</v-chip>
</template>

<script>
export default {
  props: {
    infomation: {
      type: Object,
      default: null
    }
  },

  computed: {
    labelColor () {
      switch (this.infomation.label) {
        case 'Maintenance':
          return 'error'
        case 'Hindrance':
          return 'warning'
        default:
          return 'info'
      }
    }
  }
}
</script>
