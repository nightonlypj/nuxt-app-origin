<template>
  <div>
    <div v-if="createResult != null">
      <v-tabs v-model="tabIndex">
        <v-tab>メンバー一覧</v-tab>
        <v-tab>メンバー招待（結果）</v-tab>
      </v-tabs>
    </div>

    <Loading v-if="loading" />
    <v-card v-if="!loading">
      <v-card-title>
        <div v-if="space != null">
          <v-avatar v-if="space.image_url != null" size="32px">
            <v-img :src="space.image_url.small" />
          </v-avatar>
          <span class="ml-1">
            <a :href="'/s/' + space.code" class="text-decoration-none" style="color: inherit" target="_blank" rel="noopener noreferrer">{{ $textTruncate(space.name, 64) }}</a>のメンバー一覧
          </span>
          <SpacesIcon :space="space" />
        </div>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-show="tabIndex === 0" cols="12" sm="9">
            <MembersSearch
              ref="search"
              :processing="processing || reloading"
              :query.sync="query"
              :current-member-admin="currentMemberAdmin"
              @search="searchMembers"
            />
          </v-col>
          <v-col v-if="currentMemberAdmin" cols="12" :sm="tabIndex === 0 ? 3 : 12" class="d-flex justify-end">
            <MembersCreate
              :space="space"
              @result="resultMembers"
              @reload="reloadMembers"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card v-if="!loading" v-show="tabIndex === 0" class="mt-2">
      <Processing v-if="reloading" />
      <v-card-text>
        <v-row>
          <v-col cols="2" class="d-flex align-self-center">
            <div v-if="existMembers">
              {{ $localeString(member['total_count'], 'N/A') }}名
            </div>
          </v-col>
          <v-col cols="10" class="d-flex justify-end">
            <MembersDownload
              :params="params"
              :show-items.sync="showItems"
              :current-member-admin="currentMemberAdmin"
            />
            <div class="ml-1">
              <MembersSetting
                :show-items.sync="showItems"
                :current-member-admin="currentMemberAdmin"
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
          @update="updateMember"
        />
        <template v-if="existMembers">
          <v-divider class="my-2" />
          <MembersLists
            :sort-by="query.sortBy"
            :sort-desc="query.sortDesc"
            :members="members"
            :show-items="showItems"
            :current-member-admin="currentMemberAdmin"
            @reload="reloadMembers"
            @showUpdate="$refs.update.showDialog(space, $event)"
          />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="!processing && !reloading && member != null && member.current_page < member.total_pages"
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

    <v-card v-if="createResult != null" v-show="tabIndex === 1" class="mt-2">
      <v-card-text>
        <MembersResult :result="createResult" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import SpacesIcon from '~/components/spaces/Icon.vue'
import MembersSearch from '~/components/members/Search.vue'
import MembersCreate from '~/components/members/Create.vue'
import MembersDownload from '~/components/members/Download.vue'
import MembersSetting from '~/components/members/Setting.vue'
import MembersUpdate from '~/components/members/Update.vue'
import MembersLists from '~/components/members/Lists.vue'
import MembersResult from '~/components/members/Result.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    Loading,
    Processing,
    SpacesIcon,
    MembersSearch,
    MembersCreate,
    MembersDownload,
    MembersSetting,
    MembersUpdate,
    MembersLists,
    MembersResult
  },
  mixins: [Application],
  middleware: 'auth',

  data () {
    const power = {}
    for (const key in this.$t('enums.member.power')) {
      power[key] = this.$route?.query[key] !== '0'
    }
    return {
      loading: true,
      processing: true,
      reloading: false,
      query: {
        text: this.$route?.query?.text || '',
        power,
        sortBy: this.$route?.query?.sort || 'invitationed_at',
        sortDesc: this.$route?.query?.desc !== '0',
        option: this.$route?.query?.option === '1'
      },
      params: null,
      page: 1,
      space: null,
      member: null,
      members: null,
      testState: null, // Jest用
      showItems: localStorage.getItem('members.show-items')?.split(',') || null,
      tabIndex: 0,
      createResult: null
    }
  },

  head () {
    return {
      title: this.$textTruncate(this.space?.name, 64) + 'のメンバー一覧'
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

    await this.getMembers()
    this.loading = false
  },

  methods: {
    // メンバー一覧検索
    async searchMembers () {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('searchMembers') }

      this.params = null
      if (!await this.reloadMembers()) {
        this.$refs.search.error()
      }
    },

    // メンバー一覧再取得
    async reloadMembers ($event = {}) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('reloadMembers', $event, this.reloading) }

      if (Object.keys($event).length >= 0) {
        if ($event.sortBy != null) { this.query.sortBy = $event.sortBy }
        if ($event.sortDesc != null) { this.query.sortDesc = $event.sortDesc }

        // 連続再取得はスキップ  Tips: v-data-tableで降順から対象を変更すると、対象と昇順変更のイベントが連続で発生する為
        if (!this.reloading) {
          await this.$sleep(10)
          if (this.reloading) {
            // eslint-disable-next-line no-console
            if (this.$config.debug) { console.log('...Skip') }

            return false
          }
        }
      }

      // 再取得中は待機  Tips: 異なる条件のデータが混じらないようにする為
      let count = 0
      while (count < this.$config.reloading.maxCount) {
        if (!this.reloading) { break }

        await this.$sleep(this.$config.reloading.sleepMs)
        count++
      }
      if (count >= this.$config.reloading.maxCount) {
        this.appSetToastedMessage({ alert: this.$t('system.timeout') }, true)
        return false
      }
      this.reloading = true

      this.page = 1
      const result = await this.getMembers()

      this.$router.push({ query: { ...this.params, option: Number(this.query.option) } })
      this.reloading = false
      return result
    },

    // 次頁のメンバー一覧取得
    async getNextMembers ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('getNextMembers', this.page + 1) }

      this.page = this.member.current_page + 1
      if (!await this.getMembers()) {
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
    async getMembers () {
      this.processing = true
      let result = false

      if (this.params == null) {
        this.params = {
          text: this.query.text
        }
        for (const key in this.query.power) {
          this.params[key] = Number(this.query.power[key])
        }
      }
      this.params.sort = this.query.sortBy
      this.params.desc = Number(this.query.sortDesc)
      const redirect = this.member == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.membersUrl.replace(':code', this.$route.params.code), {
        params: {
          ...this.params,
          page: this.page
        }
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.space == null || response.data?.member == null)) { return }

          this.space = response.data.space
          this.member = response.data.member
          if (this.reloading || this.members == null) {
            this.members = response.data.members
          } else {
            this.members.push(...response.data.members)
          }
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true }, { auth: true, notfound: true })
        })

      this.page = this.member?.current_page || 1
      this.processing = false
      return result
    },

    // メンバー招待結果表示
    resultMembers (result) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('resultMembers', result) }

      this.createResult = result
      this.tabIndex = 1
    },

    // メンバー情報更新
    updateMember (member) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('updateMember', member) }

      const index = this.members.findIndex(item => item.user.code === member.user.code)
      if (index < 0) { return }

      this.members.splice(index, 1, member)
    }
  }
}
</script>
