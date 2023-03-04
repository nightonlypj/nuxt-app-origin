<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card v-if="!loading" max-width="480px">
        <Processing v-if="processing" />
        <validation-observer v-slot="{ invalid }" ref="observer">
          <v-form autocomplete="on">
            <v-card-title>アカウント登録</v-card-title>
            <v-card-text>
              <validation-provider v-slot="{ errors }" name="name" rules="required|max:32">
                <v-text-field
                  v-model="query.name"
                  label="氏名"
                  prepend-icon="mdi-account"
                  autocomplete="name"
                  counter="32"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </validation-provider>
              <validation-provider v-if="invitation == null || invitation.email != null" v-slot="{ errors }" name="email" rules="required|email">
                <v-text-field
                  v-model="query.email"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  autocomplete="email"
                  :readonly="invitation != null"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </validation-provider>
              <div v-else class="d-flex">
                <validation-provider v-slot="{ errors }" name="email" rules="required">
                  <v-text-field
                    v-model="query.email_local"
                    label="メールアドレス"
                    prepend-icon="mdi-email"
                    autocomplete="off"
                    :error-messages="errors"
                    @input="waiting = false"
                  />
                </validation-provider>
                <validation-provider v-slot="{ errors }" name="email_domain" rules="required_select">
                  <v-select
                    v-model="query.email_domain"
                    :items="invitation.domains"
                    prefix="@"
                    :error-messages="errors"
                    @input="waiting = false"
                  />
                </validation-provider>
              </div>
              <validation-provider v-slot="{ errors }" name="password" rules="required|min:8">
                <v-text-field
                  v-model="query.password"
                  :type="showPassword ? 'text' : 'password'"
                  label="パスワード [8文字以上]"
                  prepend-icon="mdi-lock"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  autocomplete="new-password"
                  counter
                  :error-messages="errors"
                  @input="waiting = false"
                  @click:append="showPassword = !showPassword"
                />
              </validation-provider>
              <validation-provider v-slot="{ errors }" name="password_confirmation" rules="required|confirmed_password:password">
                <v-text-field
                  v-model="query.password_confirmation"
                  :type="showPassword ? 'text' : 'password'"
                  label="パスワード(確認)"
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
                id="sign_up_btn"
                color="primary"
                class="mt-4"
                :disabled="invalid || processing || waiting"
                @click="postSingUp()"
              >
                登録
              </v-btn>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <ActionLink action="sign_up" />
            </v-card-actions>
          </v-form>
        </validation-observer>
      </v-card>
    </template>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider, extend, configure, localize } from 'vee-validate'
import { required, email, min, max, confirmed } from 'vee-validate/dist/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/plugins/application.js'

extend('required', required)
extend('required_select', required)
extend('email', email)
extend('min', min)
extend('max', max)
extend('confirmed_password', confirmed)
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
      processing: false,
      waiting: false,
      alert: null,
      notice: null,
      invitation: null,
      query: {
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
      },
      showPassword: false
    }
  },

  head () {
    return {
      title: 'アカウント登録'
    }
  },

  async created () {
    if (this.$auth.loggedIn) { return this.appRedirectAlreadyAuth() }
    if (this.$route.query?.code != null && !await this.getUserInvitation()) { return }

    this.loading = false
  },

  methods: {
    // 招待情報取得
    async getUserInvitation () {
      let result = false

      await this.$axios.get(this.$config.apiBaseURL + this.$config.userInvitationUrl, { params: { code: this.$route.query.code } })
        .then((response) => {
          if (!this.appCheckResponse(response, { redirect: true },
            response.data?.invitation == null || (response.data.invitation.email == null && response.data.invitation.domains == null))) { return }

          this.invitation = response.data.invitation
          if (response.data.invitation.email != null) {
            this.query.email = response.data.invitation.email
          } else {
            this.query.email_local = ''
            this.query.email_domain = response.data.invitation.domains[0]
          }
          result = true
        },
        (error) => {
          this.appCheckErrorResponse(error, { redirect: true, require: true }, { notfound: true })
        })

      return result
    },

    // アカウント登録
    async postSingUp () {
      this.processing = true

      await this.$axios.post(this.$config.apiBaseURL + this.$config.singUpUrl, {
        code: this.$route.query?.code,
        ...this.query,
        confirm_success_url: this.$config.frontBaseURL + this.$config.singUpSuccessUrl
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appRedirectSignIn(response.data)
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true })) { return }

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
