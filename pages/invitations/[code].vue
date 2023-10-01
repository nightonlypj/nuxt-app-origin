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
      <v-tab :to="`/members/${$route.params.code}`">メンバー一覧</v-tab>
      <v-tab value="active">招待URL一覧</v-tab>
    </v-tabs>

    <v-card>
      <v-card-title>
        <SpacesTitle :space="space" />
      </v-card-title>
    </v-card>
    <v-card>
      <AppProcessing v-if="reloading" />
      <v-card-text class="pt-0">
        <v-row>
          <v-col class="d-flex py-2">
            <div class="align-self-center text-no-wrap">
              {{ $localeString('ja', invitation.total_count, 'N/A') }}件
            </div>
          </v-col>
          <v-col class="d-flex justify-end">
            <InvitationsCreate
              :space="space"
              @reload="reloadInvitationsList"
            />
            <div class="ml-1">
              <AppListSetting
                v-model:hidden-items="hiddenItems"
                model="invitation"
              />
            </div>
          </v-col>
        </v-row>

        <template v-if="!processing && !existInvitations">
          <v-divider class="my-4" />
          <span class="ml-1">対象の招待URLが見つかりません。</span>
          <v-divider class="my-4" />
        </template>
        <!-- InvitationsUpdate
          ref="update"
          :space="space"
          @update="updateInvitation"
        / -->
        <template v-if="existInvitations">
          <v-divider class="my-2" />
          <!-- InvitationsLists
            :invitations="invitations"
            :hidden-items="hiddenItems"
            @reload="reloadInvitationsList"
            @show-update="$refs.update.showDialog($event)"
          / -->
          <v-divider class="my-2" />
        </template>

        <!-- InfiniteLoading
          v-if="!reloading && invitation != null && invitation.current_page < invitation.total_pages"
          :identifier="page"
          @infinite="getNextInvitationsList"
        >
          <div slot="no-more" />
          <div slot="no-results" />
          <div slot="error" slot-scope="{ trigger }">
            取得できませんでした。
            <v-btn @click="error = false; trigger()">再取得</v-btn>
          </div>
        </InfiniteLoading -->
      </v-card-text>
    </v-card>
  </template>
</template>

<script>
// TODO: import InfiniteLoading from 'vue-infinite-loading'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppListSetting from '~/components/app/ListSetting.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import InvitationsCreate from '~/components/invitations/Create.vue'
import InvitationsUpdate from '~/components/invitations/Update.vue'
// TODO: import InvitationsLists from '~/components/invitations/Lists.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    // InfiniteLoading,
    AppLoading,
    AppProcessing,
    AppMessage,
    AppListSetting,
    SpacesDestroyInfo,
    SpacesTitle,
    InvitationsCreate,
    InvitationsUpdate
    // InvitationsLists
  },
  mixins: [Application],
  middleware: 'auth',

  data () {
    return {
      loading: true,
      processing: true,
      reloading: false,
      alert: null,
      notice: null,
      tabPage: 'active',
      params: null,
      uid: null,
      error: false,
      testState: null, // Jest用
      page: 1,
      space: null,
      invitation: null,
      invitations: null,
      selectedInvitations: [],
      hiddenItems: localStorage.getItem('invitation.hidden-items')?.split(',') || []
    }
  },

  computed: {
    title () {
      return `招待URL: ${this.$textTruncate(this.space?.name, 64)}`
    },

    existInvitations () {
      return this.invitations?.length > 0
    },

    selectItems () {
      return this.selectedInvitations.map(invitation => invitation.code)
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return } // NOTE: Jestでmiddlewareが実行されない為
    if (!await this.getInvitationsList()) { return }

    this.loading = false
  },

  methods: {
    // 招待URL一覧再取得
    async reloadInvitationsList () {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('reloadInvitationsList', this.reloading) }

      this.reloading = true
      this.page = 1

      await this.getInvitationsList()
      this.reloading = false
    },

    // 次頁の招待URL一覧取得
    async getNextInvitationsList ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('getNextInvitationsList', this.page + 1, this.processing, this.error) }
      if (this.processing || this.error) { return }

      this.page = this.invitation.current_page + 1
      if (!await this.getInvitationsList()) {
        if ($state == null) { this.testState = 'error'; return }

        $state.error()
      } else if (this.invitation.current_page < this.invitation.total_pages) {
        if ($state == null) { this.testState = 'loaded'; return }

        $state.loaded()
      } else {
        if ($state == null) { this.testState = 'complete'; return }

        $state.complete()
      }
    },

    // 招待URL一覧取得
    async getInvitationsList () {
      this.processing = true

      const redirect = this.invitation == null
      const url = this.$config.public.invitations.listUrl.replace(':space_code', this.$route.params.code) + '?' + new URLSearchParams({ page: this.page })
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url)

      if (response?.ok) {
        if (this.page === 1) {
          this.uid = response.headers?.uid || null
        } else if (this.uid !== (response.headers?.uid || null)) {
          this.error = true
          location.reload()
          return false
        }

        this.error = !this.appCheckResponse(data, { redirect, toasted: !redirect }, data?.space == null || data?.invitation?.current_page !== this.page)
        if (!this.error) {
          this.space = data.space
          this.invitation = data.invitation
          if (this.reloading || this.invitations == null) {
            this.invitations = data.invitations?.slice()
          } else {
            this.invitations.push(...data.invitations)
          }
        }
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect, toasted: !redirect, require: true }, { auth: true, forbidden: true, notfound: true })
        this.error = true
      }

      this.page = this.invitation?.current_page || 1
      this.processing = false
      return !this.error
    },

    // 招待URL設定更新
    updateInvitation (invitation) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('updateInvitation', invitation) }

      const index = this.invitations.findIndex(item => item.code === invitation.code)
      if (index >= 0) { this.invitations.splice(index, 1, invitation) }
    }
  }
})
</script>
