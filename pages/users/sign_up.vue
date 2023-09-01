<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="480px">
        <Processing v-if="processing" />
        <Form v-slot="{ meta, setErrors, values }">
          <v-form autocomplete="on">
            <v-card-title>アカウント登録</v-card-title>
            <v-card-text>
              <Field v-slot="{ field, errors }" v-model="query.name" name="name" rules="required|max:32">
                <v-text-field
                  v-bind="field"
                  label="氏名"
                  prepend-icon="mdi-account"
                  autocomplete="name"
                  counter="32"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </Field>
              <Field v-slot="{ field, errors }" v-model="query.email" name="email" rules="required|email">
                <v-text-field
                  v-bind="field"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  autocomplete="email"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </Field>
              <Field v-slot="{ field, errors }" v-model="query.password" name="password" rules="required|min:8">
                <v-text-field
                  v-bind="field"
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
              </Field>
              <Field v-slot="{ field, errors }" v-model="query.password_confirmation" name="password_confirmation" rules="required|confirmed_password:@password">
                <v-text-field
                  v-bind="field"
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
              </Field>
              <v-btn
                id="sign_up_btn"
                color="primary"
                class="mt-4"
                :disabled="!meta.valid || processing || waiting"
                @click="postSingUp(setErrors, values)"
              >
                登録
              </v-btn>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <ActionLink action="sign_up" />
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
import ja from '~/locales/validate.ja'
import { required, email, min, max, confirmed } from '@vee-validate/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('confirmed_password', confirmed)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

export default {
  components: {
    Form,
    Field,
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

  created () {
    if (this.$auth?.loggedIn) { return this.appRedirectAlreadyAuth() }

    this.loading = false
  },

  methods: {
    // アカウント登録
    async postSingUp (setErrors, values) {
      this.processing = true

      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.singUpUrl, 'POST',
        JSON.stringify({
          ...this.query,
          confirm_success_url: this.$config.public.frontBaseURL + this.$config.public.singUpSuccessUrl
        })
      )

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        this.appRedirectSignIn(data)
      } else {
        if (!this.appCheckErrorResponse(response?.status, data, { toasted: true })) { return }

        this.appSetMessage(data, true)
        if (data.errors != null) {
          setErrors(usePickBy(data.errors, (_value, key) => values[key] != null)) // NOTE: 未使用の値があるとvaildがtrueに戻らない為
          this.waiting = true
        }
      }

      this.processing = false
    }
  }
}
</script>
