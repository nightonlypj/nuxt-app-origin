<template>
  <validation-observer v-slot="{ invalid }" ref="observer">
    <v-form autocomplete="off">
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
        <v-alert v-if="user.unconfirmed_email !== null" color="info">
          確認待ち: {{ user.unconfirmed_email }}<br>
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
        <v-btn color="primary" :disabled="invalid || processing" @click="userInfoUpdate">
          変更
        </v-btn>
      </v-card-text>
    </v-form>
  </validation-observer>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email, min, confirmed } from 'vee-validate/dist/rules'

extend('required', required)
extend('email', email)
extend('min', min)
extend('confirmed_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider
  },

  props: {
    user: {
      type: Object,
      default: null
    }
  },

  data () {
    return {
      processing: true,
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      current_password: ''
    }
  },

  created () {
    this.name = this.user.name
    this.email = this.user.email
    this.processing = false
  },

  methods: {
    async signOut () {
      await this.$auth.logout()
      // Devise Token Auth
      if (localStorage.getItem('token-type') === 'Bearer' && localStorage.getItem('access-token')) {
        localStorage.removeItem('token-type')
        localStorage.removeItem('uid')
        localStorage.removeItem('client')
        localStorage.removeItem('access-token')
        localStorage.removeItem('expiry')
      }

      this.$toasted.info(this.$t('auth.unauthenticated'))
    },
    userInfoUpdate () {
      this.processing = true
      this.$axios.put(this.$config.apiBaseURL + this.$config.userInfoUpdateUrl, {
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
            this.processing = false
            return error
          }
          if (error.response.status === 401) {
            return this.signOut()
          }

          if (error.response.data != null) {
            this.$emit('alert', error.response.data.alert)
            this.$emit('notice', error.response.data.notice)
            if (error.response.data.errors != null) { this.$refs.observer.setErrors(error.response.data.errors) }
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
