<template>
  <div v-if="loading" class="text-center">
    <v-progress-circular indeterminate color="primary" :size="50" style="height: 80vh" />
  </div>
</template>

<script>
export default {
  props: {
    loading: {
      type: Boolean,
      default: true
    }
  }
}
</script>
