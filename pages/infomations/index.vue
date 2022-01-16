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
            <v-pagination id="pagination" v-model="page" :length="info.total_pages" @input="onPagination()" />
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
          <v-pagination id="pagination2" v-model="page" :length="info.total_pages" @input="onPagination()" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'
import Label from '~/components/infomations/Label.vue'

export default {
  name: 'Infomations',
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

  async created () {
    await this.onPagination(this.page)
    this.loading = false
  },

  methods: {
    async onPagination () {
      this.processing = true

      await this.$axios.get(this.$config.apiBaseURL + this.$config.infomationsUrl, { params: { page: this.page } })
        .then((response) => {
          if (response.data == null || response.data.infomation == null) {
            this.$toasted.error(this.$t('system.error'))
            if (this.info == null) {
              return this.$router.push({ path: '/' })
            }
            this.page = this.info.current_page
          } else {
            this.info = response.data.infomation
            this.lists = response.data.infomations
            if (this.$auth.loggedIn && this.$auth.user.infomation_unread_count !== 0 && this.page === 1) { this.$auth.fetchUser() } // Tips: お知らせ未読数をリセット
          }
          this.processing = false
        },
        (error) => {
          this.$toasted.error(this.$t(error.response == null ? 'network.failure' : 'network.error'))
          if (this.info == null) {
            return this.$router.push({ path: '/' })
          }
          this.page = this.info.current_page
          this.processing = false
        })
    }
  }
}
</script>
