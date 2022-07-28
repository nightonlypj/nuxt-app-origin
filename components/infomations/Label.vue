<template>
  <v-chip v-if="list != null && list.label !== 'Not'" small :color="labelColor">{{ list.label_i18n }}</v-chip>
</template>

<script>
export default {
  props: {
    list: {
      type: Object,
      default: null
    }
  },

  computed: {
    labelColor () {
      switch (this.list.label) {
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
