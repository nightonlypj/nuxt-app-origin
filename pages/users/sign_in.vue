<template>
  <validation-observer v-slot="{ invalid }">
    <Message :alert="alert" :notice="notice" />
    <v-card max-width="480px">
      <v-form>
        <v-card-title>
          ログイン
        </v-card-title>
        <v-card-text>
          <validation-provider v-slot="{ errors }" name="email" rules="required|email">
            <v-text-field
              v-model="email"
              label="メールアドレス"
              prepend-icon="mdi-email"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password" rules="required">
            <v-text-field
              v-model="password"
              type="password"
              label="パスワード"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              :error-messages="errors"
            />
          </validation-provider>
          <v-btn color="primary" :disabled="invalid" @click="signIn">
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
              <NuxtLink to="/users/confirmation">
                メールアドレス確認
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/users/unlock">
                アカウントロック解除
              </NuxtLink>
            </li>
          </ul>
        </v-card-actions>
      </v-form>
    </v-card>
  </validation-observer>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email } from 'vee-validate/dist/rules'
import Message from '~/components/Message.vue'

extend('required', required)
extend('email', email)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersSignIn',

  components: {
    ValidationObserver,
    ValidationProvider,
    Message
  },

  data () {
    return {
      alert: null,
      notice: null,
      email: '',
      password: ''
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.already_authenticated'))
      return this.$router.push({ path: '/' })
    }

    if (this.$route.query.alert !== null || this.$route.query.notice !== null) {
      this.alert = this.$route.query.alert
      this.notice = this.$route.query.notice
      return this.$router.push({ path: '/users/sign_in' }) // Tips: URLパラメータを消す為
    }
  },

  methods: {
    async signIn () {
      await this.$auth.loginWith('local', {
        data: {
          email: this.email,
          password: this.password
        }
      })
        .then((response) => {
          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
          return response
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.data != null) {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
          }
          return error
        })
    }
  }
}
</script>
