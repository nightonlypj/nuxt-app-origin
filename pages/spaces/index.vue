<template>
  <Head>
    <Title>スペース</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <v-card>
      <v-card-title>スペース</v-card-title>
      <v-card-text>
        <SpacesSearch
          ref="search"
          v-model:query="query"
          :processing="processing || reloading"
          @search="searchSpacesList"
        />
      </v-card-text>
    </v-card>

    <v-card class="mt-2">
      <AppProcessing v-if="reloading" />
      <v-card-text>
        <v-row>
          <v-col class="d-flex align-self-center text-no-wrap">
            {{ $localeString('ja', space.total_count, 'N/A') }}件
          </v-col>
          <v-col class="d-flex justify-end">
            <div v-if="$auth.loggedIn" class="mr-1">
              <SpacesCreate />
            </div>
            <!-- AppListSetting
              v-model:hidden-items="hiddenItems"
              model="space"
            / -->
          </v-col>
        </v-row>

        <template v-if="!processing && !existSpaces">
          <v-divider class="my-4" />
          <span class="ml-1">スペースが見つかりません。</span>
          <v-divider class="my-4" />
        </template>
        <template v-if="existSpaces">
          <v-divider class="my-2" />
          <SpacesLists
            :spaces="spaces"
            :hidden-items="hiddenItems"
          />
        </template>

        <InfiniteLoading
          v-if="!reloading && space != null && space.current_page < space.total_pages"
          :identifier="page"
          @infinite="getNextSpacesList"
        >
          <template #spinner>
            <AppLoading height="10vh" class="mt-4" />
          </template>
          <template #complete />
          <template #error="{ retry }">
            <AppErrorRetry class="mt-4" @retry="error = false; retry()" />
          </template>
        </InfiniteLoading>
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
import InfiniteLoading from 'v3-infinite-loading'
import AppErrorRetry from '~/components/app/ErrorRetry.vue'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
// import AppListSetting from '~/components/app/ListSetting.vue' // NOTE: 項目が少ないので未使用
import SpacesSearch from '~/components/spaces/Search.vue'
import SpacesCreate from '~/components/spaces/Create.vue'
import SpacesLists from '~/components/spaces/Lists.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    InfiniteLoading,
    AppErrorRetry,
    AppLoading,
    AppProcessing,
    // AppListSetting,
    SpacesSearch,
    SpacesCreate,
    SpacesLists
  },
  mixins: [Application],

  data () {
    let publicQuery = {}
    if (this.$config.public.enablePublicSpace) {
      publicQuery = {
        public: this.$route?.query?.public !== '0',
        private: this.$route?.query?.private !== '0',
        join: this.$route?.query?.join !== '0',
        nojoin: this.$route?.query?.nojoin !== '0'
      }
    }
    return {
      loading: true,
      processing: true,
      reloading: false,
      query: {
        text: this.$route?.query?.text || null,
        ...publicQuery,
        active: this.$route?.query?.active !== '0',
        destroy: this.$route?.query?.destroy === '1',
        option: this.$route?.query?.option === '1'
      },
      params: null,
      uid: null,
      error: false,
      testState: null, // vitest用
      page: 1,
      space: null,
      spaces: null,
      hiddenItems: [] // localStorage.getItem('space.hidden-items')?.split(',') || []
    }
  },

  computed: {
    existSpaces () {
      return this.spaces?.length > 0
    }
  },

  async created () {
    if (!await this.getSpacesList()) { return }

    this.loading = false
  },

  methods: {
    // スペース一覧検索
    async searchSpacesList () {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('searchSpacesList') }

      this.params = null
      if (!await this.reloadSpacesList()) {
        this.$refs.search.error()
      }
    },

    // スペース一覧再取得
    async reloadSpacesList () {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('reloadSpacesList', this.reloading) }

      // 再取得中は待機  NOTE: 異なる条件のデータが混じらないようにする為
      let count = 0
      while (count < this.$config.public.reloading.maxCount) {
        if (!this.reloading) { break }

        await this.$sleep(this.$config.public.reloading.sleepMs)
        count++
      }
      if (count >= this.$config.public.reloading.maxCount) {
        // eslint-disable-next-line no-console
        if (this.$config.public.debug) { console.log('...Stop') }

        this.appSetToastedMessage({ alert: this.$t('system.timeout') }, true)
        return false
      }
      this.reloading = true

      this.page = 1
      const result = await this.getSpacesList()

      let publicQuery = {}
      if (this.$config.public.enablePublicSpace) {
        publicQuery = {
          public: String(this.params.public),
          private: String(this.params.private),
          join: String(this.params.join),
          nojoin: String(this.params.nojoin)
        }
      }
      navigateTo({
        query: {
          ...this.params,
          ...publicQuery,
          active: String(this.params.active),
          destroy: String(this.params.destroy),
          option: String(Number(this.query.option))
        }
      })
      this.reloading = false
      return result
    },

    // 次頁のスペース一覧取得
    async getNextSpacesList ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('getNextSpacesList', this.page + 1, this.processing, this.error) }
      if (this.error) { return $state.error() } // NOTE: errorになってもloaded（spinnerが表示される）に戻る為
      if (this.processing) { return }

      this.page = this.space.current_page + 1
      if (!await this.getSpacesList()) {
        if ($state == null) { this.testState = 'error'; return }

        $state.error()
      } else if (this.space.current_page < this.space.total_pages) {
        if ($state == null) { this.testState = 'loaded'; return }

        $state.loaded()
      } else {
        if ($state == null) { this.testState = 'complete'; return }

        $state.complete()
      }
    },

    // スペース一覧取得
    async getSpacesList () {
      this.processing = true

      if (this.params == null) {
        let publicParams = {}
        if (this.$config.public.enablePublicSpace) {
          publicParams = {
            public: Number(this.query.public),
            private: Number(this.query.private),
            join: Number(this.query.join),
            nojoin: Number(this.query.nojoin)
          }
        }
        this.params = {
          ...this.query,
          text: this.query.text || '',
          ...publicParams,
          active: Number(this.query.active),
          destroy: Number(this.query.destroy)
        }
        delete this.params.option
      }

      let privateParams = {}
      if (!this.$config.public.enablePublicSpace) {
        privateParams = {
          public: 1,
          private: 1,
          join: 1,
          nojoin: 1
        }
      }
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.spaces.listUrl, 'GET', {
        ...this.params,
        ...privateParams,
        page: this.page
      })

      const redirect = this.space == null
      if (response?.ok) {
        if (this.page === 1) {
          this.uid = response.headers.get('uid')
        } else if (this.uid !== (response.headers.get('uid'))) {
          this.error = true
          location.reload()
          return false
        }

        this.error = !this.appCheckResponse(data, { redirect, toasted: !redirect }, data?.space?.current_page !== this.page)
        if (!this.error) {
          this.space = data.space
          if (this.reloading || this.spaces == null) {
            this.spaces = data.spaces?.slice()
          } else {
            this.spaces.push(...data.spaces)
          }
          this.appCheckSearchParams(this.params, data.search_params)
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect, toasted: !redirect, require: true })
        this.error = true
      }

      this.page = this.space?.current_page || 1
      this.processing = false
      return !this.error
    }
  }
})
</script>
