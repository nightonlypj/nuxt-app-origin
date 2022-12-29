<template>
  <div>
    <v-avatar v-if="space.image_url != null" :id="`space_image_${space.code}`" size="32px">
      <v-img :src="space.image_url.small" />
    </v-avatar>
    <a :href="`/-/${space.code}`" class="text-decoration-none" style="color: inherit" target="_blank" rel="noopener noreferrer">{{ $textTruncate(space.name, 64) }}</a>
    <SpacesIcon :space="space" />
  </div>
</template>

<script>
import SpacesIcon from '~/components/spaces/Icon.vue'

export default {
  components: {
    SpacesIcon
  },

  props: {
    space: {
      type: Object,
      required: true
    }
  }
}
</script>
