<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <Processing v-if="processing" />
      <v-card-title>お知らせ</v-card-title>
      <v-card-text>
        <v-row v-if="info != null && info.total_count > info.limit_value">
          <v-col cols="auto" md="5" align-self="center">
            {{ info.total_count.toLocaleString() }}件中 {{ $pageFirstNumber(info).toLocaleString() }}-{{ $pageLastNumber(info).toLocaleString() }}件を表示
          </v-col>
          <v-col cols="auto" md="7" class="d-flex justify-end">
            <v-pagination id="pagination" v-model="page" :length="info.total_pages" @input="onInfomations()" />
          </v-col>
        </v-row>

        <v-divider class="my-4" />
        <article v-if="lists != null && lists.length === 0">
          <span class="ml-1">お知らせはありません。</span>
          <v-divider class="my-4" />
        </article>
        <article v-for="list in lists" :key="list.id">
          <div>
            <Label :list="list" />
            <span class="ml-1 font-weight-bold">
              <template v-if="list.body_present === true">
                <NuxtLink :to="{ name: 'infomations-id___ja', params: { id: list.id }}">{{ list.title }}</NuxtLink>
              </template>
              <template v-else>
                {{ list.title }}
              </template>
            </span>
            <span class="ml-1">
              ({{ $dateFormat(list.started_at, 'ja') }})
            </span>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="list.summary" class="mx-2 my-2" v-html="list.summary" />
          <v-divider class="my-4" />
        </article>

        <div v-if="info != null && info.total_pages > 1">
          <v-pagination id="pagination2" v-model="page" :length="info.total_pages" @input="onInfomations()" />
        </div>
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
      page: 1,
      info: null,
      lists: null
    }
  },

  head () {
    return {
      title: 'お知らせ'
    }
  },

  async created () {
    await this.onInfomations()
    this.loading = false
  },

  methods: {
    // お知らせ一覧
    async onInfomations () {
      this.processing = true

      if (await this.getInfomations() && this.$auth.loggedIn && this.$auth.user.infomation_unread_count !== 0 && this.page === 1) {
        await this.fetchUser() // Tips: お知らせ未読数をリセット
      }

      this.processing = false
    },

    // お知らせ一覧API
    async getInfomations () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.infomationsUrl, { params: { page: this.page } })
        .then((response) => {
          if (!this.appCheckResponse(response, false, response.data?.infomation == null)) { return }

          this.info = response.data.infomation
          this.lists = response.data.infomations
          result = true
        },
        (error) => {
          if (this.appCheckErrorResponse(error, false)) {
            this.appSetToastedMessage(error.response.data, true)
          }
        })

      if (this.info == null) {
        this.appRedirectTop()
        return false
      }

      this.page = this.info.current_page
      return result
    },

    // トークン検証
    async fetchUser () {
      try {
        await this.$auth.fetchUser()
      } catch (error) {
        if (this.appCheckErrorResponse(error, false, { auth: true })) {
          this.appSetToastedMessage(error.response.data, true)
        }
      }
    }
  }
}
</script>
