<template>
  <v-avatar v-if="space.image_url != null" :id="`space_image_${space.code}`" size="32px" class="mr-2">
    <v-img :src="space.image_url.small" />
  </v-avatar>
  <a :href="localePath(`/-/${space.code}`)" class="text-decoration-none" style="color: inherit" target="_blank" rel="noopener noreferrer">{{ textTruncate(space.name, 64) }}</a>
  <SpacesIcon :space="space" />
</template>

<script setup lang="ts">
import SpacesIcon from '~/components/spaces/Icon.vue'
import { textTruncate } from '~/utils/display'

defineProps({
  space: {
    type: Object,
    required: true
  }
})
const localePath = useLocalePath()
</script>
