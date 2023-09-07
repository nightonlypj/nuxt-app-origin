<template>
  <div>
    <AppLoading v-if="loading" />
    <template v-else>
      <AppMessage :alert="alert" :notice="notice" />
      <v-card max-width="480px">
        <AppProcessing v-if="processing" />
        <Form v-slot="{ meta }">
          <v-form autocomplete="on">
            <v-card-title>ログイン</v-card-title>
            <v-card-text
              id="input_area"
              @keydown.enter="appSetKeyDownEnter"
              @keyup.enter="signIn(!meta.valid, true)"
            >
              <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
                <v-text-field
                  v-model="query.email"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  autocomplete="email"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </Field>
              <Field v-slot="{ errors }" v-model="query.password" name="password" rules="required">
                <v-text-field
                  v-model="query.password"
                  :type="showPassword ? 'text' : 'password'"
                  label="パスワード"
                  prepend-icon="mdi-lock"
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  autocomplete="current-password"
                  counter
                  :error-messages="errors"
                  @input="waiting = false"
                  @click:append="showPassword = !showPassword"
                />
              </Field>
              <v-btn
                id="sign_in_btn"
                color="primary"
                class="mt-4"
                :disabled="!meta.valid || processing || waiting"
                @click="signIn(!meta.valid, false)"
              >
                ログイン
              </v-btn>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <ActionLink action="sign_in" />
            </v-card-actions>
          </v-form>
        </Form>
      </v-card>
    </template>
  </div>
</template>

<script>
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, email } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('email', email)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default {
  components: {
    Form,
    Field,
    AppLoading,
    AppProcessing,
    AppMessage,
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
        email: '',
        password: ''
      },
      showPassword: false,
      keyDownEnter: false
    }
  },

  head () {
    return {
      title: 'ログイン'
    }
  },

  created () {
    switch (this.$route.query.account_confirmation_success) {
      case 'true':
        if (this.$auth.loggedIn) { return this.appRedirectTop(this.$route.query) }
        break
      case 'false':
        return navigateTo({ path: '/users/confirmation/resend', query: { alert: this.$route.query.alert, notice: this.$route.query.notice } })
    }
    switch (this.$route.query.unlock) {
      case 'true':
      case 'false':
        if (this.$auth.loggedIn) { return this.appRedirectTop(this.$route.query) }
    }
    if (this.$auth.loggedIn) { return this.appRedirectAlreadyAuth() }

    if (this.$route.query.account_confirmation_success === 'true' || this.$route.query.unlock === 'true') {
      this.$route.query.notice = (this.$route.query.notice != null ? this.$route.query.notice : '') + this.$t('auth.unauthenticated')
    }
    this.appSetQueryMessage()

    this.processing = false
    this.loading = false
  },

  methods: {
    // ログイン
    async signIn (invalid, keydown) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.authSignInURL, 'POST', {
        ...this.query,
        unlock_redirect_url: this.$config.public.frontBaseURL + this.$config.public.unlockRedirectUrl
      })

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        this.$auth.setData(data)
        this.appSetToastedMessage(data, false)

        const { redirectUrl, updateRedirectUrl } = useAuthRedirect()
        navigateTo(redirectUrl.value || this.$config.public.authRedirectHomeURL)
        updateRedirectUrl(null)
      } else {
        if (!this.appCheckErrorResponse(response?.status, data, { toasted: true })) { return }

        this.appSetMessage(data, true)
        this.waiting = true
      }

      this.processing = false
    }
  }
}
</script>
