<template>
  <div>
    <Loading v-if="loading" />
    <Message v-if="!loading" :alert="alert" :notice="notice" />
    <v-card v-if="!loading" max-width="480px">
      <Processing v-if="processing" />
      <validation-observer v-slot="{ invalid }" ref="observer">
        <v-form autocomplete="off">
          <v-card-title>パスワード再設定</v-card-title>
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
                @click="waiting = false"
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
                @click="waiting = false"
              />
            </validation-provider>
            <v-btn id="password_update_btn" color="primary" :disabled="invalid || processing || waiting" @click="onPasswordUpdate()">変更</v-btn>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <ActionLink action="password" />
          </v-card-actions>
        </v-form>
      </validation-observer>
    </v-card>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, min, confirmed } from 'vee-validate/dist/rules'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('min', min)
extend('confirmed_new_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      waiting: false,
      password: '',
      password_confirmation: ''
    }
  },

  head () {
    return {
      title: 'パスワード再設定'
    }
  },

  created () {
    if (this.$auth.loggedIn) {
      return this.appRedirectAlreadyAuth()
    }
    if (this.$route.query.reset_password === 'false') {
      return this.$router.push({ path: '/users/password/new', query: { alert: this.$route.query.alert, notice: this.$route.query.notice } })
    }
    if (!this.$route.query.reset_password_token) {
      return this.$router.push({ path: '/users/password/new', query: { alert: this.$t('auth.reset_password_token_blank') } })
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    // パスワード再設定
    async onPasswordUpdate () {
      this.processing = true
      await this.postPasswordUpdate()
      this.processing = false
    },

    // パスワード再設定API
    async postPasswordUpdate () {
      await this.$axios.post(this.$config.apiBaseURL + this.$config.passwordUpdateUrl, {
        reset_password_token: this.$route.query.reset_password_token,
        password: this.password,
        password_confirmation: this.password_confirmation
      })
        .then((response) => {
          if (!this.appCheckResponse(response, false)) { return }

          this.$auth.setUser(response.data.user)
          if (this.$auth.loggedIn) {
            this.appRedirectTop(response.data)
          } else {
            this.appRedirectSignIn(response.data)
          }
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, false)) {
            return
          } else if (error.response.data.errors == null) {
            return this.$router.push({ path: '/users/password/new', query: { alert: error.response.data.alert, notice: error.response.data.notice } })
          }

          this.appSetMessage(error.response.data, true)
          if (error.response.data.errors != null) {
            this.$refs.observer.setErrors(error.response.data.errors)
            this.waiting = true
          }
        })
    }
  }
}
</script>
