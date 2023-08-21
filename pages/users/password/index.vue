<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="480px">
        <Processing v-if="processing" />
        <validation-observer v-slot="{ invalid }" ref="observer">
          <v-form autocomplete="off">
            <v-card-title>パスワード再設定</v-card-title>
            <v-card-text
              id="input_area"
              @keydown.enter="appSetKeyDownEnter"
              @keyup.enter="postPasswordUpdate(invalid, true)"
            >
              <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
                <v-text-field
                  v-model="query.password"
                  :type="showPassword ? 'text' : 'password'"
                  label="新しいパスワード [8文字以上]"
                  prepend-icon="mdi-lock"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  autocomplete="new-password"
                  counter
                  :error-messages="errors"
                  @input="waiting = false"
                  @click:append="showPassword = !showPassword"
                />
              </validation-provider>
              <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed_new_password:password">
                <v-text-field
                  v-model="query.password_confirmation"
                  :type="showPassword ? 'text' : 'password'"
                  label="新しいパスワード(確認)"
                  prepend-icon="mdi-lock"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  autocomplete="new-password"
                  counter
                  :error-messages="errors"
                  @input="waiting = false"
                  @click:append="showPassword = !showPassword"
                />
              </validation-provider>
              <v-btn
                id="password_update_btn"
                color="primary"
                class="mt-4"
                :disabled="invalid || processing || waiting"
                @click="postPasswordUpdate(invalid, false)"
              >
                変更
              </v-btn>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <ActionLink action="password" />
            </v-card-actions>
          </v-form>
        </validation-observer>
      </v-card>
    </template>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, min, confirmed } from 'vee-validate/dist/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/utils/application.js'

extend('required', required)
extend('min', min)
extend('confirmed_new_password', confirmed)
configure({ generateMessage: localize('ja', require('~/locales/validate.ja.js')) })

export default {
  components: {
    ValidationObserver,
    ValidationProvider,
    Loading,
    Processing,
    Message,
    ActionLink
  },
  mixins: [Application],

  data () {
    return {
      loading: true,
      processing: true,
      waiting: false,
      alert: null,
      notice: null,
      query: {
        password: '',
        password_confirmation: ''
      },
      showPassword: false,
      keyDownEnter: false
    }
  },

  head () {
    return {
      title: 'パスワード再設定'
    }
  },

  created () {
    if (this.$auth?.loggedIn) { return this.appRedirectAlreadyAuth() }
    if (this.$route.query.reset_password === 'false') {
      return this.$router.push({ path: '/users/password/reset', query: { alert: this.$route.query.alert, notice: this.$route.query.notice } })
    }
    if (!this.$route.query.reset_password_token) {
      return this.$router.push({ path: '/users/password/reset', query: { alert: this.$t('auth.reset_password_token_blank') } })
    }

    this.processing = false
    this.loading = false
  },

  methods: {
    // パスワード再設定
    async postPasswordUpdate (invalid, keydown) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      await this.$axios.post(this.$config.public.apiBaseURL + this.$config.public.passwordUpdateUrl, {
        reset_password_token: this.$route.query.reset_password_token,
        ...this.query
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.$auth.setUser(response.data.user)
          if (this.$auth?.loggedIn) {
            this.appRedirectTop(response.data)
          } else {
            this.appRedirectSignIn(response.data)
          }
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true })) {
            return
          } else if (error.response.data.errors == null) {
            return this.$router.push({ path: '/users/password/reset', query: { alert: this.appGetAlertMessage(error.response.data, true), notice: error.response.data.notice } })
          }

          this.appSetMessage(error.response.data, true)
          if (error.response.data.errors != null) {
            this.$refs.observer.setErrors(error.response.data.errors)
            this.waiting = true
          }
        })

      this.processing = false
    }
  }
}
</script>
