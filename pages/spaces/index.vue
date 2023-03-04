<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <v-card>
        <v-card-title>スペース</v-card-title>
        <v-card-text>
          <SpacesSearch
            ref="search"
            :processing="processing || reloading"
            :query.sync="query"
            @search="searchSpacesList"
          />
        </v-card-text>
      </v-card>

      <v-card class="mt-2">
        <Processing v-if="reloading" />
        <v-card-text>
          <v-row>
            <v-col class="d-flex align-self-center text-no-wrap">
              {{ $localeString('ja', space.total_count, 'N/A') }}件
            </v-col>
            <v-col class="d-flex justify-end">
              <div v-if="$auth.loggedIn" class="mr-1">
                <SpacesCreate />
              </div>
              <!-- ListSetting
                model="space"
                :hidden-items.sync="hiddenItems"
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
            <v-divider class="my-2" />
          </template>

          <InfiniteLoading
            v-if="!reloading && space != null && space.current_page < space.total_pages"
            :identifier="page"
            @infinite="getNextSpacesList"
          >
            <div slot="no-more" />
            <div slot="no-results" />
            <div slot="error" slot-scope="{ trigger }">
              取得できませんでした。
              <v-btn @click="error = false; trigger()">再取得</v-btn>
            </div>
          </InfiniteLoading>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<script>
import lodash from 'lodash'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
// import ListSetting from '~/components/ListSetting.vue'
import SpacesSearch from '~/components/spaces/Search.vue'
import SpacesCreate from '~/components/spaces/Create.vue'
import SpacesLists from '~/components/spaces/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    Loading,
    Processing,
    // ListSetting,
    SpacesSearch,
    SpacesCreate,
    SpacesLists
  },
  mixins: [Application],

  data () {
    let publicQuery = {}
    if (this.$config.enablePublicSpace) {
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
        text: this.$route?.query?.text || '',
        ...publicQuery,
        active: this.$route?.query?.active !== '0',
        destroy: this.$route?.query?.destroy === '1',
        option: this.$route?.query?.option === '1'
      },
      params: null,
      uid: null,
      error: false,
      testState: null, // Jest用
      page: 1,
      space: null,
      spaces: null,
      hiddenItems: [] // localStorage.getItem('space.hidden-items')?.split(',') || []
    }
  },

  head () {
    return {
      title: 'スペース'
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
      if (this.$config.debug) { console.log('searchSpacesList') }

      this.params = null
      if (!await this.reloadSpacesList()) {
        this.$refs.search.error()
      }
    },

    // スペース一覧再取得
    async reloadSpacesList () {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('reloadSpacesList', this.reloading) }

      // 再取得中は待機  NOTE: 異なる条件のデータが混じらないようにする為
      let count = 0
      while (count < this.$config.reloading.maxCount) {
        if (!this.reloading) { break }

        await this.$sleep(this.$config.reloading.sleepMs)
        count++
      }
      if (count >= this.$config.reloading.maxCount) {
        // eslint-disable-next-line no-console
        if (this.$config.debug) { console.log('...Stop') }

        this.appSetToastedMessage({ alert: this.$t('system.timeout') }, true)
        return false
      }
      this.reloading = true

      this.page = 1
      const result = await this.getSpacesList()

      let publicQuery = {}
      if (this.$config.enablePublicSpace) {
        publicQuery = {
          public: String(this.params.public),
          private: String(this.params.private),
          join: String(this.params.join),
          nojoin: String(this.params.nojoin)
        }
      }
      this.$router.push({
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
      if (this.$config.debug) { console.log('getNextSpacesList', this.page + 1, this.processing, this.error) }
      if (this.processing || this.error) { return }

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
      let result = false

      if (this.params == null) {
        let publicParams = {}
        if (this.$config.enablePublicSpace) {
          publicParams = {
            public: Number(this.query.public),
            private: Number(this.query.private),
            join: Number(this.query.join),
            nojoin: Number(this.query.nojoin)
          }
        }
        this.params = {
          ...this.query,
          ...publicParams,
          active: Number(this.query.active),
          destroy: Number(this.query.destroy)
        }
        delete this.params.option
      }

      const redirect = this.space == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.spaces.listUrl, {
        params: {
          ...this.params,
          page: this.page
        }
      })
        .then((response) => {
          if (this.$config.debug) { this.check_search_params(response.data.search_params) }

          if (this.page === 1) {
            this.uid = response.headers?.uid || null
          } else if (this.uid !== (response.headers?.uid || null)) {
            this.error = true
            location.reload()
            return
          }

          this.error = !this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.space?.current_page !== this.page)
          if (this.error) { return }

          this.space = response.data.space
          if (this.reloading || this.spaces == null) {
            this.spaces = response.data.spaces?.slice()
          } else {
            this.spaces.push(...response.data.spaces)
          }

          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true })
          this.error = true
        })

      this.page = this.space?.current_page || 1
      this.processing = false
      return result
    },

    check_search_params (responseParams) {
      // eslint-disable-next-line no-console
      console.log('response params: ' + (lodash.isEqual(this.params, responseParams) ? 'OK' : 'NG'), this.params, responseParams)
    }
  }
}
</script>
