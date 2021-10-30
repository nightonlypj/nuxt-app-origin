<template>
  <div>
    <Loading :loading="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <validation-observer v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off">
          <v-card-title>
            アカウント登録
          </v-card-title>
          <v-card-text>
            <validation-provider v-slot="{ errors }" name="name" rules="required">
              <v-text-field
                v-model="name"
                label="氏名"
                prepend-icon="mdi-account"
                autocomplete="off"
                :error-messages="errors"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="email" rules="required|email">
              <v-text-field
                v-model="email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="off"
                :error-messages="errors"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
              <v-text-field
                v-model="password"
                type="password"
                label="パスワード [8文字以上]"
                prepend-icon="mdi-lock"
                append-icon="mdi-eye-off"
                autocomplete="new-password"
                :error-messages="errors"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed_password:password">
              <v-text-field
                v-model="password_confirmation"
                type="password"
                label="パスワード(確認)"
                prepend-icon="mdi-lock"
                append-icon="mdi-eye-off"
                autocomplete="new-password"
                :error-messages="errors"
              />
            </validation-provider>
            <v-btn color="primary" :disabled="invalid || processing" @click="onSignUp()">
              登録
            </v-btn>
          </v-card-text>
          <v-card-actions>
            <ul>
              <li>
                <NuxtLink to="/users/sign_in">
                  ログイン
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/users/password/new">
                  パスワード再設定
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/users/confirmation/new">
                  メールアドレス確認
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
import { required, email, min, confirmed } from 'vee-validate/dist/rules'
import Application from '~/plugins/application.js'

extend('required', required)
extend('email', email)
extend('min', min)
extend('confirmed_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersSignUp',
  components: {
    ValidationObserver,
    ValidationProvider
  },
  mixins: [Application],

  data () {
    return {
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      return this.appRedirectAlreadyAuth()
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    async onSignUp () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.singUpUrl, {
        name: this.name,
        email: this.email,
        password: this.password,
        password_confirmation: this.password_confirmation,
        confirm_success_url: this.$config.frontBaseURL + this.$config.singUpSuccessUrl
      })
        .then((response) => {
          return this.appRedirectSignIn(response.data.alert, response.data.notice)
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
