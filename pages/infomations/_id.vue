<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <v-card-title v-if="list">
        <Label :list="list" />
        <span class="ml-1 font-weight-bold">
          {{ list.title }}
        </span>
        <span class="ml-1">
          ({{ $dateFormat(list.started_at, 'ja') }})
        </span>
      </v-card-title>
      <v-card-text v-if="list">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="list.body" class="mx-2 my-2" v-html="list.body" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else-if="list.summary" class="mx-2 my-2" v-html="list.summary" />
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <ul class="my-2">
          <li><NuxtLink to="/infomations">一覧</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'
import Label from '~/components/infomations/Label.vue'

export default {
  components: {
    Label
  },
  mixins: [Application],

  data () {
    return {
      list: null
    }
  },

  head () {
    return {
      title: this.list?.title ?? null
    }
  },

  async created () {
    if (!await this.getInfomation()) { return }

    this.loading = false
  },

  methods: {
    // お知らせ詳細API
    async getInfomation () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.infomationDetailUrl.replace('_id', this.$route.params.id))
        .then((response) => {
          if (!this.appCheckResponse(response, true)) { return }

          this.list = response.data.infomation
          result = true
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, true, { notfound: true })) { return }

          this.appRedirectTop(error.response.data, true)
        })

      return result
    }
  }
}
</script>
