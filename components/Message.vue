<template>
  <div v-if="alert || notice">
    <v-alert v-if="alert" type="error" dismissible @input="$emit('update:alert', null)">{{ alert }}</v-alert>
    <v-alert v-if="notice" type="info" dismissible @input="$emit('update:notice', null)">{{ notice }}</v-alert>
  </div>
</template>

<script>
export default {
  props: {
    alert: {
      type: String,
      default: null
    },
    notice: {
      type: String,
      default: null
    }
  }
}
</script>
