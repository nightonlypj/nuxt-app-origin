<template>
  <validation-observer v-slot="{ invalid }" ref="observer">
    <Message :alert="alert" :notice="notice" />
    <v-card max-width="480px">
      <v-form autocomplete="off">
        <v-card-title>
          登録情報変更
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
          <v-alert v-if="unconfirmed_email !== null" color="info">
            確認待ち: {{ unconfirmed_email }}<br>
            <small>※メールを確認してください。メールが届いていない場合は[メールアドレス確認]をしてください。</small>
          </v-alert>
          <validation-provider v-slot="{ errors }" name="email" rules="required|email">
            <v-text-field
              v-model="email"
              label="メールアドレス"
              prepend-icon="mdi-email"
              autocomplete="off"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password" rules="min:8">
            <v-text-field
              v-model="password"
              type="password"
              label="パスワード [8文字以上] (変更する場合のみ)"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              autocomplete="new-password"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="password_confirmation" rules="confirmed_password:password">
            <v-text-field
              v-model="password_confirmation"
              type="password"
              label="パスワード(確認) (変更する場合のみ)"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              autocomplete="new-password"
              :error-messages="errors"
            />
          </validation-provider>
          <validation-provider v-slot="{ errors }" name="current_password" rules="required">
            <v-text-field
              v-model="current_password"
              type="password"
              label="現在のパスワード"
              prepend-icon="mdi-lock"
              append-icon="mdi-eye-off"
              autocomplete="off"
              :error-messages="errors"
            />
          </validation-provider>
          <v-btn color="primary" :disabled="invalid" @click="userUpdate">
            変更
          </v-btn>
        </v-card-text>
        <v-card-actions v-if="unconfirmed_email !== null">
          <ul>
            <li>
              <NuxtLink to="/users/confirmation/new">
                メールアドレス確認
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
  name: 'UsersEdit',

  components: {
    ValidationObserver,
    ValidationProvider,
    Message
  },

  data () {
    return {
      alert: null,
      notice: null,
      user: null,
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      current_password: ''
    }
  },

  computed: {
    unconfirmed_email () {
      return (this.user !== null) ? this.user.unconfirmed_email : null
    }
  },

  created () {
    if (!this.$auth.loggedIn) {
      this.$toasted.info(this.$t('auth.unauthenticated'))
      return this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
    }

    this.$axios.get(this.$config.apiBaseURL + this.$config.userShowUrl)
      .then((response) => {
        this.user = response.data.user
        this.name = response.data.user.name
        this.email = response.data.user.email
      },
      (error) => {
        if (error.response.status === 401) {
          this.signOut()
          return this.$auth.redirect('login') // Tips: ログイン後、元のページに戻す
        }

        this.$toasted.error(this.$t((error.response == null) ? 'network.failure' : 'network.error'))
        return this.$router.push({ path: '/' })
      })
  },

  methods: {
    async signOut () {
      await this.$auth.logout()
      this.$toasted.info(this.$t('auth.unauthenticated'))
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }
    },
    async userUpdate () {
      await this.$axios.put(this.$config.apiBaseURL + this.$config.userUpdateUrl, {
        name: this.name,
        email: this.email,
        password: this.password,
        password_confirmation: this.password_confirmation,
        current_password: this.current_password
      })
        .then((response) => {
          this.$auth.setUser(response.data.user)

          this.$toasted.error(response.data.alert)
          this.$toasted.info(response.data.notice)
          return this.$router.push({ path: '/' })
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
