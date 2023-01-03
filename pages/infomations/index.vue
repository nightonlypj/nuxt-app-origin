<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <Processing v-if="processing" />
      <v-card-title>お知らせ</v-card-title>
      <v-card-text>
        <v-row v-if="existInfomations">
          <v-col class="align-self-center text-no-wrap">
            {{ $localeString('ja', infomation.total_count, 'N/A') }}件<template v-if="enablePagination">中 {{ $localeString('ja', $pageFirstNumber(infomation), 'N/A') }}-{{ $localeString('ja', $pageLastNumber(infomation), 'N/A') }}件を表示</template>
          </v-col>
          <v-col v-if="enablePagination" class="px-0 py-0">
            <div class="d-flex justify-end">
              <v-pagination id="pagination1" v-model="page" :length="infomation.total_pages" @input="getInfomationsList()" />
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4" />
        <template v-if="!existInfomations">
          <span class="ml-1">お知らせはありません。</span>
          <v-divider class="my-4" />
        </template>
        <InfomationsLists v-else :infomations="infomations" />

        <div v-if="enablePagination">
          <v-pagination id="pagination2" v-model="page" :length="infomation.total_pages" @input="getInfomationsList()" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import InfomationsLists from '~/components/infomations/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Loading,
    Processing,
    InfomationsLists
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true,
      page: Number(this.$route?.query?.page) || 1,
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
    if (!await this.getInfomationsList()) { return }

    if (this.$auth.loggedIn && this.$auth.user.infomation_unread_count !== 0) {
      this.$auth.setUser({ ...this.$auth.user, infomation_unread_count: 0 })
    }

    this.loading = false
  },

  methods: {
    // お知らせ一覧取得
    async getInfomationsList () {
      this.processing = true
      let result = false

      const redirect = this.infomation == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.infomations.listUrl, { params: { page: this.page } })
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.infomation?.current_page !== this.page)) { return }

          this.infomation = response.data.infomation
          this.infomations = response.data.infomations
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true })
        })

      this.page = this.infomation?.current_page || 1
      if (this.page === 1) {
        this.$router.push({ query: null })
      } else {
        this.$router.push({ query: { page: this.page } })
      }

      this.processing = false
      return result
    }
  }
}
</script>
