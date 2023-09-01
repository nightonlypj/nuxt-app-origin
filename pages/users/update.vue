<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="850px">
        <v-card-title>ユーザー情報</v-card-title>
        <v-row>
          <v-col cols="auto" md="4">
            <UpdateImage @alert="alert = $event" @notice="notice = $event" />
          </v-col>
          <v-col cols="12" md="8">
            <UpdateData :user="user" @alert="alert = $event" @notice="notice = $event" />
          </v-col>
        </v-row>
        <v-divider />
        <v-card-actions>
          <ul class="my-2">
            <li v-if="user.unconfirmed_email != null"><NuxtLink to="/users/confirmation/resend">メールアドレス確認</NuxtLink></li>
            <li><NuxtLink to="/users/delete">アカウント削除</NuxtLink></li>
          </ul>
        </v-card-actions>
      </v-card>
    </template>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import Message from '~/components/Message.vue'
import UpdateImage from '~/components/users/update/Image.vue'
import UpdateData from '~/components/users/update/Data.vue'
import Application from '~/utils/application.js'

export default {
  components: {
    Loading,
    Message,
    UpdateImage,
    UpdateData
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      alert: null,
      notice: null,
      user: null
    }
  },

  head () {
    return {
      title: 'ユーザー情報'
    }
  },

  async created () {
    // トークン検証
    try {
      await this.$auth.fetchUser()
    } catch (error) {
      return this.appCheckErrorResponse(null, error, { redirect: true, require: true }, { auth: true })
    }

    if (!this.$auth?.loggedIn) { return this.appRedirectAuth() }
    if (this.$auth.user.destroy_schedule_at != null) { return this.appRedirectDestroyReserved() }

    if (!await this.getUserDetail()) { return }

    this.loading = false
  },

  methods: {
    // ユーザー情報詳細取得
    async getUserDetail () {
      let result = false

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.userDetailUrl)

      if (response?.ok) {
        if (!this.appCheckResponse(data, { redirect: true }, data?.user == null)) { return }

        this.user = data.user
        result = true
      } else {
        this.appCheckErrorResponse(response?.status, data, { redirect: true, require: true }, { auth: true })
      }

      return result
    }
  }
}
</script>
