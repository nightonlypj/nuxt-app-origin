<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :alert.sync="alert" :notice.sync="notice" />
    <SpacesDestroyInfo v-if="!loading" :space="space" />

    <v-tabs v-if="!loading" v-model="tabPage">
      <v-tab :to="`/-/${$route.params.code}`" nuxt>スペース</v-tab>
      <v-tab href="#list">メンバー一覧</v-tab>
      <v-tab v-if="createResult != null" href="#result">メンバー招待（結果）</v-tab>
    </v-tabs>

    <v-card v-if="!loading">
      <v-card-title>
        <SpacesTitle :space="space" />
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-show="tabPage === 'list'" cols="12" sm="9">
            <MembersSearch
              ref="search"
              :processing="processing || reloading"
              :query.sync="query"
              :admin="currentMemberAdmin"
              @search="searchMembersList"
            />
          </v-col>
          <v-col v-if="currentMemberAdmin" cols="12" :sm="tabPage === 'list' ? 3 : 12" class="d-flex justify-end">
            <MembersCreate
              :space="space"
              @result="resultMembers"
              @reload="reloadMembersList"
            />
            <v-btn color="primary" :to="`/invitations/${$route.params.code}`" class="ml-1" nuxt>
              <v-icon dense>mdi-clipboard-check</v-icon>
              <span class="ml-1">招待URL</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card v-if="!loading" v-show="tabPage === 'list'" class="mt-2">
      <Processing v-if="reloading" />
      <v-card-text>
        <v-row>
          <v-col class="d-flex py-2">
            <div class="align-self-center text-no-wrap">
              {{ $localeString('ja', member.total_count, 'N/A') }}名
            </div>
            <div v-if="selectedMembers.length > 0" class="d-flex">
              <div class="align-self-center text-no-wrap ml-4">
                選択: {{ $localeString('ja', selectedMembers.length) }}名
              </div>
              <div v-if="currentMemberAdmin" class="align-self-center ml-2">
                <MembersDelete
                  :space="space"
                  :selected-members="selectedMembers"
                  @alert="alert = $event"
                  @notice="notice = $event"
                  @clear="selectedMembers = []"
                  @reload="reloadMembersList"
                />
              </div>
            </div>
          </v-col>
          <v-col class="d-flex justify-end">
            <ListDownload
              v-if="currentMemberAdmin"
              :admin="currentMemberAdmin"
              model="member"
              :space="space"
              :hidden-items="hiddenItems"
              :select-items="selectItems"
              :search-params="$route.query"
            />
            <div class="ml-1">
              <ListSetting
                :admin="currentMemberAdmin"
                model="member"
                :hidden-items.sync="hiddenItems"
              />
            </div>
          </v-col>
        </v-row>

        <template v-if="!processing && !existMembers">
          <v-divider class="my-4" />
          <span class="ml-1">対象のメンバーが見つかりません。</span>
          <v-divider class="my-4" />
        </template>
        <MembersUpdate
          v-if="currentMemberAdmin"
          ref="update"
          :space="space"
          @update="updateMember"
        />
        <template v-if="existMembers">
          <v-divider class="my-2" />
          <MembersLists
            :sort="query.sort"
            :desc="query.desc"
            :members="members"
            :selected-members.sync="selectedMembers"
            :hidden-items="hiddenItems"
            :active-user-codes="activeUserCodes"
            :current-member-admin="currentMemberAdmin"
            @reload="reloadMembersList"
            @showUpdate="$refs.update.showDialog($event)"
          />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="!reloading && member != null && member.current_page < member.total_pages"
          :identifier="page"
          @infinite="getNextMembersList"
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

    <v-card v-if="createResult != null" v-show="tabPage === 'result'" class="mt-2">
      <v-card-text>
        <MembersResult :result="createResult" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import lodash from 'lodash'
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ListSetting from '~/components/ListSetting.vue'
import ListDownload from '~/components/ListDownload.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import MembersSearch from '~/components/members/Search.vue'
import MembersCreate from '~/components/members/Create.vue'
import MembersUpdate from '~/components/members/Update.vue'
import MembersDelete from '~/components/members/Delete.vue'
import MembersLists from '~/components/members/Lists.vue'
import MembersResult from '~/components/members/Result.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    Loading,
    Processing,
    Message,
    ListSetting,
    ListDownload,
    SpacesDestroyInfo,
    SpacesTitle,
    MembersSearch,
    MembersCreate,
    MembersUpdate,
    MembersDelete,
    MembersLists,
    MembersResult
  },
  mixins: [Application],
  middleware: 'auth',

  data () {
    const power = {}
    const queryPower = this.$route?.query?.power
    let index = 0
    for (const key in this.$t('enums.member.power')) {
      power[key] = queryPower == null || queryPower[index] === '1'
      index++
    }

    return {
      loading: true,
      processing: true,
      reloading: false,
      alert: null,
      notice: null,
      tabPage: 'list',
      query: {
        text: this.$route?.query?.text || '',
        power,
        sort: this.$route?.query?.sort || 'invitationed_at',
        desc: this.$route?.query?.desc !== '0',
        option: this.$route?.query?.option === '1'
      },
      params: null,
      uid: null,
      error: false,
      testState: null, // Jest用
      page: 1,
      space: null,
      member: null,
      members: null,
      selectedMembers: [],
      hiddenItems: localStorage.getItem('member.hidden-items')?.split(',') || [],
      createResult: null,
      activeUserCodes: []
    }
  },

  head () {
    return {
      title: `メンバー: ${this.$textTruncate(this.space?.name, 64)}`
    }
  },

  computed: {
    currentMemberAdmin () {
      return this.space?.current_member?.power === 'admin'
    },
    existMembers () {
      return this.members?.length > 0
    },

    selectItems () {
      return this.selectedMembers.map(member => member.user.code)
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return } // NOTE: Jestでmiddlewareが実行されない為
    if (!await this.getMembersList()) { return }

    this.loading = false
  },

  methods: {
    // メンバー一覧検索
    async searchMembersList () {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('searchMembersList') }

      this.params = null
      if (!await this.reloadMembersList()) {
        this.$refs.search.error()
      }
    },

    // メンバー一覧再取得
    async reloadMembersList ($event = {}) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('reloadMembersList', $event, this.reloading) }

      if (Object.keys($event).length >= 0) {
        if ($event.sort != null) { this.query.sort = $event.sort }
        if ($event.desc != null) { this.query.desc = $event.desc }

        // 連続再取得はスキップ  NOTE: v-data-tableで降順から対象を変更すると、対象と昇順変更のイベントが連続で発生する為
        if (!this.reloading) {
          await this.$sleep(10)
          if (this.reloading) {
            // eslint-disable-next-line no-console
            if (this.$config.debug) { console.log('...Skip') }

            return false
          }
        }
      }

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
      const result = await this.getMembersList()

      let power = ''
      for (const key in this.query.power) {
        power += Number(this.query.power[key])
      }
      this.$router.push({ query: { ...this.params, power, desc: String(this.params.desc), option: String(Number(this.query.option)) } })
      this.reloading = false
      return result
    },

    // 次頁のメンバー一覧取得
    async getNextMembersList ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('getNextMembersList', this.page + 1, this.processing, this.error) }
      if (this.processing || this.error) { return }

      this.page = this.member.current_page + 1
      if (!await this.getMembersList()) {
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

    // メンバー一覧取得
    async getMembersList () {
      this.processing = true
      let result = false

      if (this.params == null) {
        const power = []
        for (const key in this.query.power) {
          if (this.query.power[key]) { power.push(key) }
        }
        this.params = { ...this.query, power: power.join(), desc: Number(this.query.desc) }
        delete this.params.option
      } else {
        this.params.sort = this.query.sort
        this.params.desc = Number(this.query.desc)
      }

      const redirect = this.member == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.members.listUrl.replace(':space_code', this.$route.params.code), {
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

          this.error = !this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.space == null || response.data?.member?.current_page !== this.page)
          if (this.error) { return }

          this.space = response.data.space
          this.member = response.data.member
          if (this.reloading || this.members == null) {
            this.members = response.data.members?.slice()
          } else {
            this.members.push(...response.data.members)
          }

          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true }, { auth: true, forbidden: true, notfound: true })
          this.error = true
        })

      this.page = this.member?.current_page || 1
      this.processing = false
      return result
    },

    check_search_params (responseParams) {
      // eslint-disable-next-line no-console
      console.log('response params: ' + (lodash.isEqual(this.params, responseParams) ? 'OK' : 'NG'), this.params, responseParams)
    },

    // メンバー招待（結果）
    resultMembers (result) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('resultMembers', result) }

      this.createResult = result
      this.activeUserCodes = result?.user_codes
      this.tabPage = 'result'
    },

    // メンバー情報更新
    updateMember (member) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('updateMember', member) }

      this.activeUserCodes = [member.user.code]
      const index = this.members.findIndex(item => item.user.code === member.user.code)
      if (index < 0) { return }

      this.members.splice(index, 1, member)
    }
  }
}
</script>
