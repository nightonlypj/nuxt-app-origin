<template>
  <validation-observer v-slot="{ invalid }" ref="observer">
    <Message :alert="alert" :notice="notice" />
    <v-card max-width="480px">
      <v-form>
        <v-card-title>
          メールアドレス確認
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
          <v-btn color="primary" :disabled="invalid" @click="confirmation">
            送信
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
  name: 'UsersUnlock',

  components: {
    ValidationObserver,
    ValidationProvider,
    Message
  },

  data () {
    return {
      alert: null,
      notice: null,
      email: ''
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.already_authenticated'))
      return this.$router.push({ path: '/' })
    }
  },

  methods: {
    async confirmation () {
      await this.$axios.post(this.$config.apiBaseURL + this.$config.confirmationUrl, {
        email: this.email,
        confirm_success_url: this.$config.frontBaseURL + this.$config.confirmationConfirmSuccessUrl
      })
        .then((response) => {
          return this.$router.push({ path: '/users/sign_in', query: { alert: response.data.alert, notice: response.data.notice } })
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else if (error.response.data != null) {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
          }
          return error
        })
    }
  }
}
</script>
