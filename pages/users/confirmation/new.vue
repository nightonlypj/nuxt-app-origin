<template>
  <div>
    <Loading :loading="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <validation-observer v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off">
          <v-card-title>
            メールアドレス確認
          </v-card-title>
          <v-card-text>
            <validation-provider v-slot="{ errors }" name="email" rules="required|email">
              <v-text-field
                v-model="email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="off"
                :error-messages="errors"
              />
            </validation-provider>
            <v-btn color="primary" :disabled="invalid || processing" @click="onConfirmationNew()">
              送信
            </v-btn>
          </v-card-text>
          <v-card-actions v-if="!$auth.loggedIn">
            <ul>
              <li>
                <NuxtLink to="/users/sign_in">
                  ログイン
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/users/sign_up">
                  アカウント登録
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/users/password/new">
                  パスワード再設定
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/users/unlock/new">
                  アカウントロック解除
                </NuxtLink>
              </li>
            </ul>
          </v-card-actions>
        </v-form>
      </validation-observer>
    </v-card>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email } from 'vee-validate/dist/rules'
import Application from '~/plugins/application.js'

extend('required', required)
extend('email', email)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersConfirmationNew',
  components: {
    ValidationObserver,
    ValidationProvider
  },
  mixins: [Application],

  data () {
    return {
      email: ''
    }
  },

  created () {
    this.appSetQueryMessage()
    this.processing = false
    this.loading = false
  },

  methods: {
    async onConfirmationNew () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.confirmationNewUrl, {
        email: this.email,
        confirm_success_url: this.$config.frontBaseURL + this.$config.confirmationSuccessUrl
      })
        .then((response) => {
          if (this.$auth.loggedIn) {
            return this.appRedirectSuccess(response.data.alert, response.data.notice)
          } else {
            return this.appRedirectSignIn(response.data.alert, response.data.notice)
          }
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.data == null) {
            this.$toasted.error(this.$t('network.error'))
          } else {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
          }
        })

      this.processing = false
    }
  }
}
</script>
