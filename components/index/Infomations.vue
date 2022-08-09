<template>
  <div v-if="loading || (!loading && lists != null && lists.length > 0)">
    <Loading v-if="loading" />
    <v-card v-if="!loading && lists != null && lists.length > 0">
      <v-card-title>大切なお知らせ</v-card-title>
      <v-card-text>
        <article v-for="list in lists" :key="list.id" class="mb-1">
          <Label :list="list" />
          <span class="ml-1">
            <template v-if="list.body_present === true || list.summary !== null">
              <NuxtLink :to="{ name: 'infomations-id___ja', params: { id: list.id }}">{{ list.title }}</NuxtLink>
            </template>
            <template v-else>
              {{ list.title }}
            </template>
          </span>
          <span class="ml-1">
            ({{ $dateFormat(list.started_at, 'ja') }})
          </span>
        </article>
      </v-card-text>
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
      lists: null
    }
  },

  async created () {
    await this.getInfomations()
    this.loading = false
  },

  methods: {
    // 大切なお知らせAPI
    async getInfomations () {
      await this.$axios.get(this.$config.apiBaseURL + this.$config.importantInfomationsUrl)
        .then((response) => {
          if (!this.appCheckResponse(response, false)) { return }

          this.lists = response.data.infomations
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, false)) { return }

          this.appSetToastedMessage(error.response.data, true)
        })
    }
  }
}
</script>
