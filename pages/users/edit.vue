<template>
  <div>
    <Loading :loading="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="850px">
      <v-card-title>
        登録情報変更
      </v-card-title>
      <v-row>
        <v-col cols="auto" md="4">
          <ImageUpdate @alert="alert = $event" @notice="notice = $event" />
        </v-col>
        <v-col cols="12" md="8">
          <InfoUpdate :user="user" @alert="alert = $event" @notice="notice = $event" />
        </v-col>
      </v-row>
      <v-card-actions>
        <ul>
          <li v-if="user.unconfirmed_email !== null">
            <NuxtLink to="/users/confirmation/new">
              メールアドレス確認
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/users/delete">
              アカウント削除
            </NuxtLink>
          </li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'
import Message from '~/components/Message.vue'
import ImageUpdate from '~/components/users/edit/ImageUpdate.vue'
import InfoUpdate from '~/components/users/edit/InfoUpdate.vue'

export default {
  name: 'UsersEdit',

  components: {
    Loading,
    Message,
    ImageUpdate,
    InfoUpdate
  },

  data () {
    return {
      loading: true,
      alert: null,
      notice: null,
      user: null
    }
  },

  async created () {
    await this.$auth.fetchUser()

    if (!this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.unauthenticated'))
      return this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
    }
    if (this.$auth.user.destroy_schedule_at !== null) {
      this.$toasted.error(this.$t('auth.destroy_reserved'))
      return this.$router.push({ path: '/' })
    }

    await this.$axios.get(this.$config.apiBaseURL + this.$config.userShowUrl)
      .then((response) => {
        this.user = response.data.user
      },
      (error) => {
        if (error.response == null) {
          this.$toasted.error(this.$t('network.failure'))
          return this.$router.push({ path: '/' })
        }
        if (error.response.status === 401) {
          return this.signOut()
        }

        this.$toasted.error(this.$t('network.error'))
        return this.$router.push({ path: '/' })
      })

    this.loading = false
  },

  methods: {
    async signOut () {
      await this.$auth.logout()
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }

      this.$toasted.info(this.$t('auth.unauthenticated'))
    }
  }
}
</script>
