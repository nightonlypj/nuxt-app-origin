<template>
  <div>
    <Loading :loading="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <validation-observer v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off">
          <v-card-title>
            パスワード再設定
          </v-card-title>
          <v-card-text>
            <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
              <v-text-field
                v-model="password"
                type="password"
                label="新しいパスワード [8文字以上]"
                prepend-icon="mdi-lock"
                append-icon="mdi-eye-off"
                autocomplete="new-password"
                :error-messages="errors"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed_new_password:password">
              <v-text-field
                v-model="password_confirmation"
                type="password"
                label="新しいパスワード(確認)"
                prepend-icon="mdi-lock"
                append-icon="mdi-eye-off"
                autocomplete="new-password"
                :error-messages="errors"
              />
            </validation-provider>
            <v-btn color="primary" :disabled="invalid || processing" @click="onPasswordUpdate()">
              変更
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
                <NuxtLink to="/users/sign_up">
                  アカウント登録
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
import { required, min, confirmed } from 'vee-validate/dist/rules'
import Application from '~/plugins/application.js'

extend('required', required)
extend('min', min)
extend('confirmed_new_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersPasswordIndex',
  components: {
    ValidationObserver,
    ValidationProvider
  },
  mixins: [Application],

  data () {
    return {
      password: '',
      password_confirmation: ''
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      return this.appRedirectAlreadyAuth()
    }
    if (!this.$route.query.reset_password_token) {
      return this.$router.push({ path: '/users/password/new', query: { alert: this.$t('auth.reset_password_token_blank') } })
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    async onPasswordUpdate () {
      this.processing = true

      await this.$axios.put(this.$config.apiBaseURL + this.$config.passwordUpdateUrl, {
        reset_password_token: this.$route.query.reset_password_token,
        password: this.password,
        password_confirmation: this.password_confirmation
      })
        .then((response) => {
          this.$auth.setUser(response.data.user)
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
