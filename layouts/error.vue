<template>
  <div>
    <v-card max-width="480px">
      <v-card-title>{{ message }}</v-card-title>
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
      title: this.title
    }
  },

  computed: {
    title () {
      return (this.error.statusCode === 404) ? 'Not Found' : 'Error'
    },
    message () {
      return (this.error.statusCode === 404) ? 'ページが見つかりません。' : 'エラーが発生しました。'
    }
  },

  created () {
    // eslint-disable-next-line no-console
    if (this.$config.debug) { console.dir(this.error) }
  }
}
</script>
