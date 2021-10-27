<template>
  <div>
    <Loading :loading="loading" />
    <v-card v-if="!loading" max-width="640px">
      <v-card-title>
        アカウント削除
      </v-card-title>
      <v-card-text>
        アカウントは{{ $auth.user.destroy_schedule_days || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
        削除されるまではログインできますが、一部機能が制限されます。<br><br>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn color="error" :disabled="processing" v-bind="attrs" v-on="on">
              削除
            </v-btn>
          </template>
          <template #default="dialog">
            <v-card>
              <v-toolbar color="error" dark>
                アカウント削除
              </v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-6">
                  本当に削除しますか？
                </div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn color="secondary" @click="dialog.value = false">
                  いいえ
                </v-btn>
                <v-btn color="error" @click="dialog.value = false; userDelete()">
                  はい
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
      <v-card-actions>
        <ul>
          <li>
            <NuxtLink to="/users/edit">
              登録情報変更
            </NuxtLink>
          </li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Loading from '~/components/Loading.vue'

export default {
  name: 'UsersDelete',

  components: {
    Loading
  },

  data () {
    return {
      loading: true,
      processing: true
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

    this.processing = false
    this.loading = false
  },

  methods: {
    async signOut (path, query) {
      await this.$auth.logout()
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }

      if (path !== null) {
        return this.$router.push({ path, query })
      }
    },
    userDelete () {
      this.processing = true

      this.$axios.delete(this.$config.apiBaseURL + this.$config.userDeleteUrl)
        .then((response) => {
          return this.signOut('/users/sign_in', { alert: response.data.alert, notice: response.data.notice })
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
            this.processing = false
            return error
          }
          if (error.response.status === 401) {
            this.$toasted.info(this.$t('auth.unauthenticated'))
            return this.signOut(null, null)
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
