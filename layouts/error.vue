<template>
  <div>
    <v-card>
      <v-card-title>{{ alertMessage }}</v-card-title>
      <v-card-text v-if="error.notice != null">{{ error.notice }}</v-card-text>
      <v-card-actions>
        <NuxtLink to="/">トップページ</NuxtLink>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    error: {
      type: Object,
      default: null
    }
  },

  head () {
    return {
      title: (this.error.statusCode === 404) ? 'Not Found' : 'エラー'
    }
  },

  computed: {
    alertMessage () {
      if (this.error.alert == null) {
        return this.$t((this.error.statusCode === 404) ? 'system.notfound' : 'system.default')
      }

      return this.error.alert
    }
  },

  created () {
    // eslint-disable-next-line no-console
    if (this.$config.public.debug) { console.dir(this.error) }
  }
}
</script>
