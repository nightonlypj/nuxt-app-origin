<template>
  <div>
    <AppLoading v-if="loading" />
    <v-card v-else>
      <AppProcessing v-if="processing" />
      <v-card-title>お知らせ</v-card-title>
      <v-card-text>
        <v-row v-if="existInfomations">
          <v-col class="align-self-center text-no-wrap">
            {{ $localeString('ja', infomation.total_count, 'N/A') }}件<template v-if="enablePagination">中 {{ $localeString('ja', $pageFirstNumber(infomation), 'N/A') }}-{{ $localeString('ja', $pageLastNumber(infomation), 'N/A') }}件を表示</template>
          </v-col>
          <v-col v-if="enablePagination" class="px-0 py-0">
            <div class="d-flex justify-end">
              <v-pagination id="pagination1" v-model="page" :length="infomation.total_pages" @click="getInfomationsList()" />
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4" />
        <template v-if="!existInfomations">
          <span class="ml-1">お知らせはありません。</span>
          <v-divider class="my-4" />
        </template>
        <InfomationsLists v-else :infomations="infomations" />

        <template v-if="enablePagination">
          <v-pagination id="pagination2" v-model="page" :length="infomation.total_pages" @click="getInfomationsList()" />
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import InfomationsLists from '~/components/infomations/Lists.vue'
import Application from '~/utils/application.js'

const { status: authStatus, data: authData } = useAuthState()

export default {
  components: {
    AppLoading,
    AppProcessing,
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

    if (authStatus.value === 'authenticated' && authData.value.user.infomation_unread_count !== 0) {
      authData.value = { ...authData.value, user: { ...authData.value.user, infomation_unread_count: 0 } }
    }

    this.loading = false
  },

  methods: {
    // お知らせ一覧取得
    async getInfomationsList () {
      this.processing = true
      let result = false

      const redirect = this.infomation == null
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.infomations.listUrl + '?' + new URLSearchParams({ page: this.page }))

      if (response?.ok) {
        if (!this.appCheckResponse(data, { redirect, toasted: !redirect }, data?.infomation?.current_page !== this.page)) { return }

        this.infomation = data.infomation
        this.infomations = data.infomations
        result = true
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect, toasted: !redirect, require: true })
      }

      this.page = this.infomation?.current_page || 1
      if (this.page === 1) {
        navigateTo({ query: null })
      } else {
        navigateTo({ query: { page: this.page } })
      }

      this.processing = false
      return result
    }
  }
}
</script>
