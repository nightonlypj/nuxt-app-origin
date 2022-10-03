<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <v-card-title>スペース</v-card-title>
      <v-card-text>
        <SpacesSearch
          ref="search"
          :processing="processing || reloading"
          :query.sync="query"
          @search="searchSpaces"
        />
      </v-card-text>
    </v-card>

    <v-card v-if="!loading" class="mt-2">
      <Processing v-if="reloading" />
      <v-card-text>
        <v-row>
          <v-col cols="2" class="d-flex align-self-center">
            <div v-if="existSpaces">
              {{ $localeString(space['total_count'], 'N/A') }}件
            </div>
          </v-col>
          <v-col cols="10" class="d-flex justify-end">
            <SapcesSetting
              :show-items.sync="showItems"
            />
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
            :show-items="showItems"
          />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="!processing && !reloading && space != null && space.current_page < space.total_pages"
          :identifier="page"
          @infinite="getNextSpaces"
        >
          <div slot="no-more" />
          <div slot="no-results" />
          <div slot="error" slot-scope="{ trigger }">
            取得できませんでした。
            <v-btn @click="trigger">再取得</v-btn>
          </div>
        </InfiniteLoading>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import SpacesSearch from '~/components/spaces/Search.vue'
import SapcesSetting from '~/components/spaces/Setting.vue'
import SpacesLists from '~/components/spaces/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    Loading,
    Processing,
    SpacesSearch,
    SapcesSetting,
    SpacesLists
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true,
      reloading: false,
      query: {
        text: this.$route?.query?.text || '',
        option: this.$route?.query?.option === '1',
        excludeMemberSpace: this.$route?.query?.exclude_member_space === '1'
      },
      params: null,
      page: 1,
      space: null,
      spaces: null,
      testState: null, // Jest用
      showItems: localStorage.getItem('spaces.show-items')?.split(',') || null
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
    await this.getSpaces()
    this.loading = false
  },

  methods: {
    // スペース一覧検索
    async searchSpaces () {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('searchSpaces', this.reloading) }

      this.reloading = true
      this.params = null
      this.page = 1

      if (!await this.getSpaces()) {
        this.$refs.search.error()
      }
      this.$router.push({ query: { ...this.params, option: Number(this.query.option) } })
      this.reloading = false
    },

    // 次頁のスペース一覧取得
    async getNextSpaces ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('getNextSpaces', this.page + 1) }

      this.page = this.space.current_page + 1
      if (!await this.getSpaces()) {
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
    async getSpaces () {
      this.processing = true
      let result = false

      if (this.params == null) {
        this.params = {
          text: this.query.text,
          exclude_member_space: Number(this.query.excludeMemberSpace)
        }
      }
      const redirect = this.space == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.spacesUrl, { params: { ...this.params, page: this.page } })
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.space == null)) { return }

          this.space = response.data.space
          if (this.reloading || this.spaces == null) {
            this.spaces = response.data.spaces
          } else {
            this.spaces.push(...response.data.spaces)
          }
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true })
        })

      this.page = this.space?.current_page || 1
      this.processing = false
      return result
    }
  }
}
</script>
