<template>
  <v-chip
    :color="props.optional ? 'secondary' : 'accent'"
    size="x-small"
    variant="elevated"
    class="ml-1"
    style="top: 1px"
  >
    {{ props.optional ? '任意' : '必須' }}
  </v-chip>
</template>

<script setup lang="ts">
const props = defineProps({
  optional: {
    type: Boolean,
    default: false
  }
})
</script>
