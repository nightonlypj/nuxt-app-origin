<template>
  <div>
    <v-alert v-if="alert" type="error">
      {{ alert }}
    </v-alert>
    <v-alert v-if="notice" type="info">
      {{ notice }}
    </v-alert>
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
