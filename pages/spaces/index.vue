<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <Processing v-if="processing" />
      <v-card-title>スペース</v-card-title>
      <v-form autocomplete="on" @submit.prevent>
        <v-card-text
          @keydown.enter="onKeyDown"
          @keyup.enter="onSpaces(true, true)"
        >
          <div class="d-flex">
            <v-text-field
              id="search_text"
              v-model="text"
              label="検索"
              autocomplete="on"
              style="max-width: 400px"
              dense
              hide-details
              @input="waiting = false"
            />
            <v-btn
              id="search_btn"
              color="primary"
              class="ml-1"
              :disabled="processing || waiting"
              @click="onSpaces(true)"
            >
              <v-icon dense>mdi-magnify</v-icon>
            </v-btn>
            <v-btn
              v-if="$auth.loggedIn"
              id="option_btn"
              class="ml-2"
              rounded
              @click="option = !option"
            >
              <v-icon>{{ option ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
              <span class="hidden-sm-and-down">検索オプション</span>
            </v-btn>
          </div>
          <div v-if="$auth.loggedIn" v-show="option" id="option_item" class="mt-2">
            <v-row>
              <v-col>
                <v-checkbox
                  id="exclude_member_space_check"
                  v-model="excludeMemberSpace"
                  label="参加スペースを除く"
                  dense
                  hide-details
                  @click="waiting = false"
                />
              </v-col>
            </v-row>
          </div>
        </v-card-text>
      </v-form>
    </v-card>

    <v-card v-if="!loading" class="mt-2">
      <v-card-text>
        <v-row v-if="existSpaces">
          <v-col cols="auto" md="5" align-self="center">
            {{ $localeString(space['total_count'], 'N/A') }}件
          </v-col>
        </v-row>

        <article v-if="!processing && !existSpaces">
          <v-divider class="my-4" />
          <span class="ml-1">スペースが見つかりません。</span>
          <v-divider class="my-4" />
        </article>
        <template v-if="existSpaces">
          <v-divider class="my-2" />
          <Lists :spaces="spaces" />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="space != null && space.current_page < space.total_pages"
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
import Lists from '~/components/spaces/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    Lists
  },
  mixins: [Application],

  data () {
    return {
      waiting: false,
      text: this.$route?.query?.text || '',
      option: this.$route?.query?.option === '1',
      excludeMemberSpace: this.$route?.query?.exclude_member_space === '1',
      keyDownEnter: false,
      params: null,
      page: 1,
      space: null,
      spaces: null,
      testState: null // Jest用
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
    await this.onSpaces()
    this.loading = false
  },

  methods: {
    // Tips: IME確定のEnterやShift+Enterで検索されないようにする
    onKeyDown (event) {
      this.keyDownEnter = event.keyCode === 13 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
    },

    // 次頁のスペースを取得
    async getNextSpaces ($state) {
      if (this.processing || this.space == null) { return }

      this.page = this.space.current_page + 1
      if (!await this.onSpaces()) {
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

    // スペース一覧
    async onSpaces (search = false, keydown = false) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (search && (this.processing || this.waiting || (keydown && !enter))) { return }

      this.processing = true
      if (search || this.params == null) {
        this.params = {
          text: this.text,
          exclude_member_space: Number(this.excludeMemberSpace)
        }
        this.page = 1
        this.space = null
        this.spaces = null
        this.waiting = true
      }

      const result = await this.getSpaces()
      if (search) {
        this.$router.push({ query: { ...this.params, option: Number(this.option) } })
      }

      this.processing = false
      return result
    },

    // スペース一覧API
    async getSpaces () {
      let result = false

      const redirect = this.space == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.spacesUrl, { params: { ...this.params, page: this.page } })
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.space == null)) { return }

          this.space = response.data.space
          if (this.spaces == null) {
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
      return result
    }
  }
}
</script>
