<template>
  <div>
    <Loading v-if="loading" />
    <template v-else>
      <Message :alert.sync="alert" :notice.sync="notice" />
      <v-card max-width="480px">
        <Processing v-if="processing" />
        <Form v-slot="{ meta, setErrors, values }">
          <v-form autocomplete="off" @submit.prevent>
            <v-card-title>アカウントロック解除</v-card-title>
            <v-card-text
              id="input_area"
              @keydown.enter="appSetKeyDownEnter"
              @keyup.enter="postUnlockNew(!meta.valid, true, setErrors, values)"
            >
              <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
                <v-text-field
                  v-model="query.email"
                  label="メールアドレス"
                  prepend-icon="mdi-email"
                  autocomplete="off"
                  :error-messages="errors"
                  @input="waiting = false"
                />
              </Field>
              <v-btn
                id="unlock_btn"
                color="primary"
                class="mt-2"
                :disabled="!meta.valid || processing || waiting"
                @click="postUnlockNew(!meta.valid, false, setErrors, values)"
              >
                送信
              </v-btn>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <ActionLink action="unlock" />
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
import { required, email } from '@vee-validate/rules'
import Loading from '~/components/Loading.vue'
import Processing from '~/components/Processing.vue'
import Message from '~/components/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import Application from '~/utils/application.js'

defineRule('required', required)
defineRule('email', email)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

const { status:authStatus } = useAuthState()

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
      processing: true,
      waiting: false,
      alert: null,
      notice: null,
      query: {
        email: ''
      },
      keyDownEnter: false
    }
  },

  head () {
    return {
      title: 'アカウントロック解除'
    }
  },

  computed: {
    loggedIn () {
      return authStatus.value === 'authenticated'
    }
  },

  created () {
    if (this.loggedIn) { return this.appRedirectAlreadyAuth() }

    this.appSetQueryMessage()
    this.processing = false
    this.loading = false
  },

  methods: {
    // アカウントロック解除
    async postUnlockNew (invalid, keydown, setErrors, values) {
      const enter = this.keyDownEnter
      this.keyDownEnter = false
      if (invalid || this.processing || this.waiting || (keydown && !enter)) { return }

      this.processing = true
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + this.$config.public.unlockUrl, 'POST', {
        ...this.query,
        redirect_url: this.$config.public.frontBaseURL + this.$config.public.unlockRedirectUrl
      })

      if (response?.ok) {
        if (!this.appCheckResponse(data, { toasted: true })) { return }

        navigateTo({ path: this.$config.public.authRedirectSignInURL, query: { alert: data.alert, notice: data.notice } })
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
