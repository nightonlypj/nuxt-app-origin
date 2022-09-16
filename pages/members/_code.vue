<template>
  <div>
    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <Processing v-if="processing" />
      <v-card-title>
        <div>
          <v-avatar v-if="space.image_url != null" size="32px">
            <v-img :src="space.image_url.small" />
          </v-avatar>
          <span class="ml-1">{{ $textTruncate(space.name, 64) }}のメンバー</span>
          <SpacesIcon :space="space" />
        </div>
      </v-card-title>
      <v-form autocomplete="on" @submit.prevent>
        <v-card-text
          @keydown.enter="onKeyDown"
          @keyup.enter="onMembers(true, true)"
        >
          <div class="d-flex">
            <v-text-field
              id="search_text"
              v-model="text"
              label="検索"
              :placeholder="'ユーザー名' + (currentMemberAdmin ? 'やメールアドレス' : '') + 'を入力'"
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
              @click="onMembers(true)"
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
              <v-col class="d-flex">
                <div class="mt-2">
                  権限:
                </div>
                <v-checkbox
                  v-for="(value, key) in $t('enums.member.power')"
                  :id="key + '_check'"
                  :key="key"
                  v-model="power[key]"
                  :label="value"
                  class="ml-2"
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
        <v-row v-if="existMembers">
          <v-col cols="auto" md="5" align-self="center">
            {{ $localeString(member['total_count'], 'N/A') }}名
          </v-col>
        </v-row>

        <article v-if="!processing && !existMembers">
          <v-divider class="my-4" />
          <span class="ml-1">メンバーが見つかりません。</span>
          <v-divider class="my-4" />
        </article>
        <template v-if="existMembers">
          <v-divider class="my-2" />
          <MembersLists :members="members" :current-member-admin="currentMemberAdmin" />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="member != null && member.current_page < member.total_pages"
          :identifier="page"
          @infinite="getNextMembers"
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
import SpacesIcon from '~/components/spaces/Icon.vue'
import MembersLists from '~/components/members/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    SpacesIcon,
    MembersLists
  },
  mixins: [Application],
  middleware: 'auth',

  data () {
    return {
      waiting: false,
      text: this.$route?.query?.text || '',
      option: this.$route?.query?.option === '1',
      power: {
        admin: this.$route?.query?.admin !== '0',
        writer: this.$route?.query?.writer !== '0',
        reader: this.$route?.query?.reader !== '0'
      },
      keyDownEnter: false,
      params: null,
      page: 1,
      space: null,
      member: null,
      members: null,
      testState: null // Jest用
    }
  },

  head () {
    return {
      title: 'メンバーの' + this.$textTruncate(this.space?.name, 64)
    }
  },

  computed: {
    currentMemberAdmin () {
      return this.space?.current_member?.power === 'admin'
    },
    existMembers () {
      return this.members?.length > 0
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return } // Tips: Jestでmiddlewareが実行されない為

    await this.onMembers()
    this.loading = false
  },

  methods: {
    // Tips: IME確定のEnterやShift+Enter等で検索されないようにする
    onKeyDown (event) {
      this.keyDownEnter = event.keyCode === 13 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
    },

    // 次頁のメンバーを取得
    async getNextMembers ($state) {
      if (this.processing || this.member == null) { return }

      this.page = this.member.current_page + 1
      if (!await this.onMembers()) {
        if ($state == null) { this.testState = 'error'; return }

        $state.error()
      } else if (this.member.current_page < this.member.total_pages) {
        if ($state == null) { this.testState = 'loaded'; return }

        $state.loaded()
      } else {
        if ($state == null) { this.testState = 'complete'; return }

        $state.complete()
      }
    },

    // メンバー一覧
    async onMembers (search = false, keydown = false) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (search && (this.processing || this.waiting || (keydown && !enter))) { return }

      this.processing = true
      if (search || this.params == null) {
        this.params = {
          text: this.text,
          admin: Number(this.power.admin),
          writer: Number(this.power.writer),
          reader: Number(this.power.reader)
        }
        this.page = 1
        this.member = null
        this.members = null
        this.waiting = true
      }

      const result = await this.getMembers()
      if (search) {
        this.$router.push({ query: { ...this.params, option: Number(this.option) } })
      }

      this.processing = false
      return result
    },

    // メンバー一覧API
    async getMembers () {
      let result = false

      const redirect = this.member == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.membersUrl.replace('_code', this.$route.params.code), { params: { ...this.params, page: this.page } })
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.member == null)) { return }

          this.space = response.data.space
          this.member = response.data.member
          if (this.members == null) {
            this.members = response.data.members
          } else {
            this.members.push(...response.data.members)
          }
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true }, { auth: true })
        })

      this.page = this.member?.current_page || 1
      return result
    }
  }
}
</script>
