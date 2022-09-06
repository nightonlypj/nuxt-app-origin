<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <Processing v-if="processing" />
      <v-card-title>お知らせ</v-card-title>
      <v-card-text>
        <v-row v-if="existInfomations">
          <v-col cols="auto" md="5" align-self="center">
            {{ $localeString(infomation['total_count'], 'N/A') }}件<template v-if="enablePagination">中 {{ $localeString($pageFirstNumber(infomation), 'N/A') }}-{{ $localeString($pageLastNumber(infomation), 'N/A') }}件を表示</template>
          </v-col>
          <v-col v-if="enablePagination" cols="auto" md="7" class="d-flex justify-end">
            <v-pagination id="pagination1" v-model="page" :length="infomation.total_pages" @input="onInfomations()" />
          </v-col>
        </v-row>

        <v-divider class="my-4" />
        <article v-if="!existInfomations">
          <span class="ml-1">お知らせはありません。</span>
          <v-divider class="my-4" />
        </article>
        <Lists v-else :infomations="infomations" />

        <div v-if="enablePagination">
          <v-pagination id="pagination2" v-model="page" :length="infomation.total_pages" @input="onInfomations()" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Lists from '~/components/infomations/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Lists
  },
  mixins: [Application],

  data () {
    return {
      page: 1,
      infomation: null,
      infomations: null
    }
  },

  head () {
    return {
      title: 'お知らせ'
    }
  },

  computed: {
    existInfomations () {
      return this.infomations?.length > 0
    },
    enablePagination () {
      return this.infomation?.total_pages > 1
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
        // トークン検証
        try {
          await this.$auth.fetchUser() // Tips: お知らせ未読数をリセット
        } catch (error) {
          this.appCheckErrorResponse(error, { toasted: true, require: true }, { auth: true })
        }
      }

      this.processing = false
    },

    // お知らせ一覧API
    async getInfomations () {
      let result = false

      const redirect = this.infomation == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.infomationsUrl, { params: { page: this.page } })
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.infomation == null)) { return }

          this.infomation = response.data.infomation
          this.infomations = response.data.infomations
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true })
        })

      this.page = this.infomation?.current_page
      return result
    }
  }
}
</script>
