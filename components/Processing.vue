<template>
  <v-overlay :value="processing" absolute>
    <v-progress-circular indeterminate color="primary" :size="50" />
  </v-overlay>
</template>

<script>
export default {
  name: 'Processing',

  props: {
    processing: {
      type: Boolean,
      default: true
    }
  }
}
</script>
