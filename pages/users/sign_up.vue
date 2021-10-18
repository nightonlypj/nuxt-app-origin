<template>
  <validation-observer v-slot="{ invalid }" ref="observer">
    <Message :alert="alert" :notice="notice" />
    <v-card max-width="480px">
      <v-form>
        <v-card-title>
          アカウント登録
        </v-card-title>
        <v-card-text>
          <validation-provider v-slot="{ errors }" name="name" rules="required">
            <v-text-field
              v-model="name"
              label="氏名"
              prepend-icon="mdi-account"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="email" rules="required|email">
            <v-text-field
              v-model="email"
              label="メールアドレス"
              prepend-icon="mdi-email"
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
              :error-messages="errors"
            />
          </validation-provider>
          <v-btn color="primary" :disabled="invalid" @click="signUp">
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
import { required, email, min, confirmed } from 'vee-validate/dist/rules'
import Message from '~/components/Message.vue'

extend('required', required)
extend('email', email)
extend('min', min)
extend('confirmed_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  name: 'UsersSignUp',

  components: {
    ValidationObserver,
    ValidationProvider,
    Message
  },

  data () {
    return {
      alert: null,
      notice: null,
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.already_authenticated'))
      return this.$router.push({ path: '/' })
    }
  },

  methods: {
    async signUp () {
      await this.$axios.post(this.$config.singUpUrl, {
        name: this.name,
        email: this.email,
        password: this.password,
        password_confirmation: this.password_confirmation,
        confirm_success_url: this.$config.singUpConfirmSuccessUrl
      })
        .then((response) => {
          return this.$router.push({ path: '/users/sign_in', query: { alert: response.data.alert, notice: response.data.notice } })
        },
        (error) => {
          if (error.response == null) {
            this.$toasted.error(this.$t('network.failure'))
          } else {
            this.alert = error.response.data.alert
            this.notice = error.response.data.notice
            if (!error.response.data == null) { this.$refs.observer.setErrors(error.response.data.errors) }
          }
          return error
        })
    }
  }
}
</script>
