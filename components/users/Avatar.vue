<template>
  <div v-if="user != null">
    <v-avatar v-if="user.image_url != null" size="32px">
      <v-img :src="user.image_url.small" />
    </v-avatar>
    {{ user.name }}
  </div>
</template>

<script>
export default {
  props: {
    user: {
      type: Object,
      default: null
    }
  }
}
</script>
