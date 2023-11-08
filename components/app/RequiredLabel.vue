<template>
  <v-chip
    :color="optional ? 'secondary' : 'accent'"
    size="x-small"
    variant="elevated"
    class="ml-1"
    style="top: 1px"
  >
    {{ optional ? '任意' : '必須' }}
  </v-chip>
</template>

<script setup lang="ts">
defineProps({
  optional: {
    type: Boolean,
    default: false
  }
})
</script>
