<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :notice.sync="notice" />
    <SpacesDestroyInfo v-if="!loading" :space="space" />

    <v-tabs v-if="!loading" v-model="tabPage">
      <v-tab :to="`/-/${$route.params.code}`" nuxt>スペース</v-tab>
      <v-tab :to="`/members/${$route.params.code}`" nuxt>メンバー一覧</v-tab>
      <v-tab href="#active">招待URL一覧</v-tab>
    </v-tabs>

    <v-card v-if="!loading">
      <v-card-title>
        <SpacesTitle :space="space" />
      </v-card-title>
    </v-card>
    <v-card v-if="!loading">
      <Processing v-if="reloading" />
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
              @reload="reloadInvitations"
            />
            <div class="ml-1">
              <ListSetting
                model="invitation"
                :hidden-items.sync="hiddenItems"
              />
            </div>
          </v-col>
        </v-row>

        <template v-if="!processing && !existInvitations">
          <v-divider class="my-4" />
          <span class="ml-1">対象の招待URLが見つかりません。</span>
          <v-divider class="my-4" />
        </template>
        <InvitationsUpdate
          ref="update"
          :space="space"
          @update="updateInvitation"
        />
        <template v-if="existInvitations">
          <v-divider class="my-2" />
          <InvitationsLists
            :invitations="invitations"
            :hidden-items="hiddenItems"
            :active-code="activeCode"
            @reload="reloadInvitations"
            @showUpdate="$refs.update.showDialog($event)"
          />
          <v-divider class="my-2" />
        </template>

        <InfiniteLoading
          v-if="!reloading && invitation != null && invitation.current_page < invitation.total_pages"
          :identifier="page"
          @infinite="getNextInvitations"
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
  </div>
</template>

<script>
import InfiniteLoading from 'vue-infinite-loading'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ListSetting from '~/components/ListSetting.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import SpacesTitle from '~/components/spaces/Title.vue'
import InvitationsCreate from '~/components/invitations/Create.vue'
import InvitationsUpdate from '~/components/invitations/Update.vue'
import InvitationsLists from '~/components/invitations/Lists.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    InfiniteLoading,
    Loading,
    Processing,
    Message,
    ListSetting,
    SpacesDestroyInfo,
    SpacesTitle,
    InvitationsCreate,
    InvitationsUpdate,
    InvitationsLists
  },
  mixins: [Application],
  middleware: 'auth',

  data () {
    return {
      loading: true,
      processing: true,
      reloading: false,
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
      hiddenItems: localStorage.getItem('invitation.hidden-items')?.split(',') || [],
      activeCode: []
    }
  },

  head () {
    return {
      title: `招待URL: ${this.$textTruncate(this.space?.name, 64)}`
    }
  },

  computed: {
    existInvitations () {
      return this.invitations?.length > 0
    },

    selectItems () {
      return this.selectedInvitations.map(invitation => invitation.code)
    }
  },

  async created () {
    if (!this.$auth.loggedIn) { return } // NOTE: Jestでmiddlewareが実行されない為
    if (!await this.getInvitations()) { return }

    this.loading = false
  },

  methods: {
    // 招待URL一覧再取得
    async reloadInvitations () {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('reloadInvitations', this.reloading) }

      this.reloading = true
      this.page = 1

      await this.getInvitations()
      this.reloading = false
    },

    // 次頁の招待URL一覧取得
    async getNextInvitations ($state) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('getNextInvitations', this.page + 1, this.processing, this.error) }
      if (this.processing || this.error) { return }

      this.page = this.invitation.current_page + 1
      if (!await this.getInvitations()) {
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
    async getInvitations () {
      this.processing = true
      let result = false

      const redirect = this.invitation == null
      await this.$axios.get(this.$config.apiBaseURL + this.$config.invitationsUrl.replace(':space_code', this.$route.params.code), { params: { page: this.page } })
        .then((response) => {
          if (this.page === 1) {
            this.uid = response.headers?.uid || null
          } else if (this.uid !== (response.headers?.uid || null)) {
            this.error = true
            location.reload()
            return
          }

          this.error = !this.appCheckResponse(response, { redirect, toasted: !redirect }, response.data?.space == null || response.data?.invitation?.current_page !== this.page)
          if (this.error) { return }

          this.space = response.data.space
          this.invitation = response.data.invitation
          if (this.reloading || this.invitations == null) {
            this.invitations = response.data.invitations?.slice()
          } else {
            this.invitations.push(...response.data.invitations)
          }

          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect, toasted: !redirect, require: true }, { auth: true, forbidden: true, notfound: true })
          this.error = true
        })

      this.page = this.invitation?.current_page || 1
      this.processing = false
      return result
    },

    // 招待URL設定更新
    updateInvitation (invitation) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('updateInvitation', invitation) }

      this.activeCode = invitation.code
      const index = this.invitations.findIndex(item => item.code === invitation.code)
      if (index < 0) { return }

      this.invitations.splice(index, 1, invitation)
    }
  }
}
</script>
