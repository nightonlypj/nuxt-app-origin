<template>
  <div>
    <Loading :loading="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <validation-observer v-slot="{ invalid }">
        <v-form autocomplete="on">
          <v-card-title>
            ログイン
          </v-card-title>
          <v-card-text>
            <validation-provider v-slot="{ errors }" name="email" rules="required|email">
              <v-text-field
                v-model="email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="email"
                :error-messages="errors"
                @click="waiting = false"
              />
            </validation-provider>
            <validation-provider v-slot="{ errors }" name="password" rules="required">
              <v-text-field
                v-model="password"
                type="password"
                label="パスワード"
                prepend-icon="mdi-lock"
                append-icon="mdi-eye-off"
                autocomplete="current-password"
                :error-messages="errors"
                @click="waiting = false"
              />
            </validation-provider>
            <v-btn color="primary" :disabled="invalid || processing || waiting" @click="onSignIn()">
              ログイン
            </v-btn>
          </v-card-text>
          <v-card-actions>
            <ul>
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
import { required, email } from 'vee-validate/dist/rules'
import Application from '~/plugins/application.js'

extend('required', required)
extend('email', email)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersSignIn',
  components: {
    ValidationObserver,
    ValidationProvider
  },
  mixins: [Application],

  data () {
    return {
      waiting: false,
      email: '',
      password: ''
    }
  },

  created () {
    switch (this.$route.query.account_confirmation_success) {
      case 'true':
        if (this.$auth.loggedIn) {
          return this.appRedirectSuccess(this.$route.query.alert, this.$route.query.notice)
        }
        break
      case 'false':
        return this.$router.push({ path: '/users/confirmation/new', query: { alert: this.$route.query.alert, notice: this.$route.query.notice } })
    }
    switch (this.$route.query.unlock) {
      case 'true':
      case 'false':
        if (this.$auth.loggedIn) {
          return this.appRedirectSuccess(this.$route.query.alert, this.$route.query.notice)
        }
    }
    if (this.$auth.loggedIn) {
      return this.appRedirectAlreadyAuth()
    }

    this.appSetQueryMessage()
    this.processing = false
    this.loading = false
  },

  methods: {
    async onSignIn () {
      this.processing = true

      await this.$auth.loginWith('local', {
        data: {
          email: this.email,
          password: this.password
        }
      })
        .then((response) => {
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.data == null) {
            this.$toasted.error(this.$t('network.error'))
          } else {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            this.waiting = true
          }
        })

      this.processing = false
    }
  }
}
</script>
