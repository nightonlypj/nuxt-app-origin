<template>
  <div>
    <Loading :loading="loading" />
    <v-card v-if="!loading" max-width="640px">
      <v-card-title>
        アカウント削除取り消し
      </v-card-title>
      <v-card-text>
        このアカウントは{{ dateFormat($auth.user.destroy_schedule_at) }}以降に削除されます。それまでは取り消し可能です。<br>
        <div v-if="$auth.user.destroy_requested_at != null">
          ※{{ timeFormat($auth.user.destroy_requested_at) }}にアカウント削除依頼を受け付けています。<br>
        </div><br>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn color="secondary" :disabled="processing" v-bind="attrs" v-on="on">
              取り消し
            </v-btn>
          </template>
          <template #default="dialog">
            <v-card>
              <v-toolbar color="secondary" dark>
                アカウント削除取り消し
              </v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-6">
                  本当に取り消しますか？
                </div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn color="secondary" @click="dialog.value = false">
                  いいえ
                </v-btn>
                <v-btn color="primary" @click="dialog.value = false; userUndoDelete()">
                  はい
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'

export default {
  name: 'UsersUndoDelete',

  components: {
    Loading
  },

  data () {
    return {
      loading: true,
      processing: true
    }
  },

  computed: {
    dateFormat () {
      return function (date) {
        const dtf = new Intl.DateTimeFormat('ja', { year: 'numeric', month: '2-digit', day: '2-digit' })
        return dtf.format(new Date(date))
      }
    },
    timeFormat () {
      return function (time) {
        const dtf = new Intl.DateTimeFormat('ja', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        return dtf.format(new Date(time))
      }
    }
  },

  async created () {
    await this.$auth.fetchUser()

    if (!this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.unauthenticated'))
      return this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
    }
    if (this.$auth.user.destroy_schedule_at === null) {
      this.$toasted.error(this.$t('auth.not_destroy_reserved'))
      return this.$router.push({ path: '/' })
    }

    this.processing = false
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
    },
    userUndoDelete () {
      this.processing = true

      this.$axios.delete(this.$config.apiBaseURL + this.$config.userUndoDeleteUrl)
        .then((response) => {
          this.$auth.setUser(response.data.user)
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
          return this.$router.push({ path: '/' })
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
            this.processing = false
            return error
          }
          if (error.response.status === 401) {
            return this.signOut()
          }

          if (error.response.data != null) {
            this.$toasted.error(error.response.data.alert)
            this.$toasted.info(error.response.data.notice)
          } else {
            this.$toasted.error(this.$t('network.error'))
          }
          this.processing = false
          return error
        })
    }
  }
}
</script>
