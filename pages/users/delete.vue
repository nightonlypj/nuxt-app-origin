<template>
  <div>
    <Loading :loading="loading" />
    <v-card v-if="!loading" max-width="640px">
      <Processing :processing="processing" />
      <v-card-title>アカウント削除</v-card-title>
      <v-card-text>
        <p>
          アカウントは{{ $auth.user.destroy_schedule_days || 'N/A' }}日後に削除されます。それまでは取り消し可能です。<br>
          削除されるまではログインできますが、一部機能が制限されます。
        </p>
        <v-dialog transition="dialog-top-transition" max-width="600px">
          <template #activator="{ on, attrs }">
            <v-btn color="error" :disabled="processing" v-bind="attrs" v-on="on">削除</v-btn>
          </template>
          <template #default="dialog">
            <v-card>
              <v-toolbar color="error" dark>アカウント削除</v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-6">本当に削除しますか？</div>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn color="secondary" @click="dialog.value = false">いいえ</v-btn>
                <v-btn color="error" @click="dialog.value = false; onUserDelete()">はい</v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <ul class="my-2">
          <li><NuxtLink to="/users/edit">登録情報変更</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  name: 'UsersDelete',
  mixins: [Application],

  async created () {
    try {
      await this.$auth.fetchUser()
    } catch (error) {
      if (error.response == null) {
        this.$toasted.error(this.$t('network.failure'))
      } else if (error.response.status === 401) {
        return this.appSignOut()
      } else {
        this.$toasted.error(this.$t('network.error'))
      }
      return this.$router.push({ path: '/' })
    }

    if (!this.$auth.loggedIn) {
      return this.appRedirectAuth()
    }
    if (this.$auth.user.destroy_schedule_at !== null) {
      return this.appRedirectDestroyReserved()
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    async onUserDelete () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.userDeleteUrl, {
        undo_delete_url: this.$config.frontBaseURL + '/users/undo_delete'
      })
        .then((response) => {
          if (response.data == null) {
            this.$toasted.error(this.$t('system.error'))
          } else {
            return this.appSignOut(null, '/users/sign_in', response.data.alert, response.data.notice)
          }
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.status === 401) {
            return this.appSignOut()
          } else if (error.response.data == null) {
            this.$toasted.error(this.$t('network.error'))
          } else {
            this.$toasted.error(error.response.data.alert)
            this.$toasted.info(error.response.data.notice)
          }
        })

      this.processing = false
    }
  }
}
</script>
