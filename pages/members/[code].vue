<template>
  <Head>
    <Title>{{ title }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage :alert="alert" :notice="notice" />
    <SpacesDestroyInfo :space="space" />

    <v-tabs v-model="tabPage" color="primary">
      <v-tab :to="`/-/${$route.params.code}`">スペース</v-tab>
      <v-tab value="list">メンバー一覧</v-tab>
      <v-tab v-if="createResult != null" value="result">メンバー招待（結果）</v-tab>
      <v-tab v-if="admin" :to="`/invitations/${$route.params.code}`">招待URL一覧</v-tab>
    </v-tabs>

    <v-card>
      <v-card-title>
        <SpacesTitle :space="space" />
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-show="tabPage === 'list'" cols="12" md="8">
            <MembersSearch
              ref="search"
              v-model:query="query"
              :processing="processing || reloading"
              :admin="admin"
              @search="searchMembersList"
            />
          </v-col>
          <v-col v-if="admin" cols="12" :md="tabPage === 'list' ? 4 : 12" class="d-flex justify-end">
            <MembersCreate
              :space="space"
              @result="resultMembers"
              @reload="reloadMembersList"
            />
            <v-btn color="primary" :to="`/invitations/${$route.params.code}`" class="ml-1">
              <v-icon>mdi-clipboard-check</v-icon>
              <span class="ml-1">招待URL</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card v-show="tabPage === 'list'" class="mt-2">
      <AppProcessing v-if="reloading" />
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
              <div v-if="admin" class="align-self-center ml-2">
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
            <AppListDownload
              v-if="admin"
              :admin="admin"
              model="member"
              :space="space"
              :hidden-items="hiddenItems"
              :select-items="selectItems"
              :search-params="params"
            />
            <div class="ml-1">
              <AppListSetting
                v-model:hidden-items="hiddenItems"
                :admin="admin"
                model="member"
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
          v-if="admin"
          ref="update"
          :space="space"
          @update="updateMember"
        />
        <template v-if="existMembers">
          <v-divider class="my-2" />
          <MembersLists
            v-model:selected-members="selectedMembers"
            :sort="query.sort"
            :desc="query.desc"
            :members="members"
            :hidden-items="hiddenItems"
            :active-user-codes="activeUserCodes"
            :admin="admin"
            @reload="reloadMembersList"
            @show-update="$refs.update.showDialog($event)"
          />
        </template>

        <InfiniteLoading
          v-if="!reloading && member != null && member.current_page < member.total_pages"
          :identifier="page"
          @infinite="getNextMembersList"
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

    <v-card v-if="createResult != null" v-show="tabPage === 'result'" class="mt-2">
      <v-card-text>
        <MembersResult :result="createResult" />
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
import InfiniteLoading from 'v3-infinite-loading'
import AppErrorRetry from '~/components/app/ErrorRetry.vue'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppListSetting from '~/components/app/ListSetting.vue'
import AppListDownload from '~/components/app/ListDownload.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import MembersSearch from '~/components/members/Search.vue'
import MembersCreate from '~/components/members/Create.vue'
import MembersUpdate from '~/components/members/Update.vue'
import MembersDelete from '~/components/members/Delete.vue'
import MembersLists from '~/components/members/Lists.vue'
import MembersResult from '~/components/members/Result.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    InfiniteLoading,
    AppErrorRetry,
    AppLoading,
    AppProcessing,
    AppMessage,
    AppListSetting,
    AppListDownload,
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

  data () {
    const power = {}
    const queryPower = this.$route?.query?.power
    let index = 0
    for (const key in this.$tm('enums.member.power')) {
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
        text: this.$route?.query?.text || null,
        power,
        active: this.$route?.query?.active !== '0',
        destroy: this.$route?.query?.destroy !== '0',
        sort: this.$route?.query?.sort || 'invitationed_at',
        desc: this.$route?.query?.desc !== '0',
        option: this.$route?.query?.option === '1'
      },
      params: null,
      uid: null,
      error: false,
      testState: null, // Vitest用
      page: 1,
      space: null,
      admin: null,
      member: null,
      members: null,
      selectedMembers: [],
      hiddenItems: localStorage.getItem('member.hidden-items')?.split(',') || [],
      createResult: null,
      activeUserCodes: []
    }
  },

  computed: {
    title () {
      return `メンバー: ${this.$textTruncate(this.space?.name, 64)}`
    },

    existMembers () {
      return this.members?.length > 0
    },

    selectItems () {
      return this.selectedMembers.map(member => member.user.code)
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
    if (!await this.getMembersList()) { return }

    this.loading = false
  },

  methods: {
    // メンバー一覧検索
    async searchMembersList () {
      /* c8 ignore next */ // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('searchMembersList') }

      this.params = null
      if (!await this.reloadMembersList()) {
        this.$refs.search.error()
      }
    },

    // メンバー一覧再取得
    async reloadMembersList ($event = {}) {
      /* c8 ignore next */ // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('reloadMembersList', $event, this.reloading) }

      if (Object.keys($event).length >= 0) {
        if ($event.sort != null) { this.query.sort = $event.sort }
        if ($event.desc != null) { this.query.desc = $event.desc }
      }

      // 再取得中は待機  NOTE: 異なる条件のデータが混じらないようにする為
      let count = 0
      while (count < this.$config.public.reloading.maxCount) {
        if (!this.reloading) { break }

        /* c8 ignore next */
        if (process.env.NODE_ENV !== 'test') { await this.$sleep(this.$config.public.reloading.sleepMs) }
        count++
      }
      if (count >= this.$config.public.reloading.maxCount) {
        /* c8 ignore next */ // eslint-disable-next-line no-console
        if (this.$config.public.debug) { console.log('...Stop') }

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
      navigateTo({
        query: {
          ...this.params,
          power,
          active: String(this.params.active),
          destroy: String(this.params.destroy),
          desc: String(this.params.desc),
          option: String(Number(this.query.option))
        }
      })
      this.reloading = false
      return result
    },

    // 次頁のメンバー一覧取得
    async getNextMembersList ($state) {
      /* c8 ignore start */
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('getNextMembersList', this.page + 1, this.processing, this.error) }
      if (this.error) { return $state.error() } // NOTE: errorになってもloaded（spinnerが表示される）に戻る為
      if (this.processing) { return }
      /* c8 ignore stop */

      this.page = this.member.current_page + 1
      if (!await this.getMembersList()) {
        /* c8 ignore start */
        if ($state == null) { this.testState = 'error'; return }

        $state.error()
        /* c8 ignore stop */
      } else if (this.member.current_page < this.member.total_pages) {
        /* c8 ignore start */
        if ($state == null) { this.testState = 'loaded'; return }

        $state.loaded()
        /* c8 ignore stop */
      } else {
        /* c8 ignore start */
        if ($state == null) { this.testState = 'complete'; return }

        $state.complete()
      }
      /* c8 ignore stop */
    },

    // メンバー一覧取得
    async getMembersList () {
      this.processing = true

      if (this.params == null) {
        const power = []
        for (const key in this.query.power) {
          if (this.query.power[key]) { power.push(key) }
        }
        this.params = {
          ...this.query,
          text: this.query.text || '',
          power: power.join(),
          active: Number(this.query.active),
          destroy: Number(this.query.destroy),
          desc: Number(this.query.desc)
        }
        delete this.params.option
      } else {
        this.params.sort = this.query.sort
        this.params.desc = Number(this.query.desc)
      }

      const url = this.$config.public.members.listUrl.replace(':space_code', this.$route.params.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'GET', {
        ...this.params,
        page: this.page
      })

      const redirect = this.member == null
      if (response?.ok) {
        if (this.page === 1) {
          this.uid = response.headers.get('uid')
        } else if (this.uid !== (response.headers.get('uid'))) {
          this.error = true
          location.reload()
          return false
        }

        this.error = !this.appCheckResponse(data, { redirect, toasted: !redirect }, data?.space == null || data?.member?.current_page !== this.page)
        if (!this.error) {
          this.space = data.space
          this.admin = this.appCurrentMemberAdmin(this.space)
          this.member = data.member
          if (this.reloading || this.members == null) {
            this.members = data.members?.slice()
          } else {
            this.members.push(...data.members)
          }
          this.appCheckSearchParams(this.params, data.search_params)
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect, toasted: !redirect, require: true }, { auth: true, forbidden: true, notfound: true })
        this.error = true
      }

      this.page = this.member?.current_page || 1
      this.processing = false
      return !this.error
    },

    // メンバー招待（結果）
    resultMembers (result) {
      /* c8 ignore next */ // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('resultMembers', result) }

      this.createResult = result
      this.activeUserCodes = result?.user_codes
      this.tabPage = 'result'
    },

    // メンバー情報更新
    updateMember (member) {
      /* c8 ignore next */ // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('updateMember', member) }

      this.activeUserCodes = [member.user.code]
      const index = this.members.findIndex(item => item.user.code === member.user.code)
      if (index >= 0) { this.members.splice(index, 1, member) }
    }
  }
})
</script>
