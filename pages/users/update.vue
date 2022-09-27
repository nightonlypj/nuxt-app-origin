<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading && user != null" max-width="850px">
      <v-card-title>ユーザー情報変更</v-card-title>
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
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import Message from '~/components/Message.vue'
import UpdateImage from '~/components/users/update/Image.vue'
import UpdateData from '~/components/users/update/Data.vue'
import Application from '~/plugins/application.js'

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
      title: 'ユーザー情報変更'
    }
  },

  async created () {
    // トークン検証
    try {
      await this.$auth.fetchUser()
    } catch (error) {
      return this.appCheckErrorResponse(error, { redirect: true, require: true }, { auth: true })
    }

    if (!this.$auth.loggedIn) {
      return this.appRedirectAuth()
    } else if (this.$auth.user.destroy_schedule_at != null) {
      return this.appRedirectDestroyReserved()
    }

    if (!await this.getUserDetail()) { return }

    this.loading = false
  },

  methods: {
    // ユーザー情報詳細取得
    async getUserDetail () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.userDetailUrl)
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect: true })) { return }

          this.user = response.data.user
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect: true, require: true }, { auth: true })
        })

      return result
    }
  }
}
</script>