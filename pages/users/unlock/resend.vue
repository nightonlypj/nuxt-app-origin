<template>
  <Head>
    <Title>アカウントロック解除</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off" @submit.prevent>
          <v-card-title>アカウントロック解除</v-card-title>
          <v-card-text
            id="unlock_reset_area"
            @keydown.enter="keyDownEnter = completInputKey($event)"
            @keyup.enter="postUnlock(!meta.valid, true, setErrors, values)"
          >
            <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
              <v-text-field
                id="unlock_reset_email_text"
                v-model="query.email"
                label="メールアドレス"
                prepend-icon="mdi-email"
                autocomplete="off"
                :error-messages="errors"
                @update:model-value="waiting = false"
              />
            </Field>
            <v-btn
              id="unlock_reset_btn"
              color="primary"
              class="mt-2"
              :disabled="!meta.valid || processing || waiting"
              @click="postUnlock(!meta.valid, false, setErrors, values)"
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
</template>

<script setup lang="ts">
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, email } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import { completInputKey, existKeyErrors } from '~/utils/input'
import { redirectPath, redirectSignIn } from '~/utils/redirect'

defineRule('required', required)
defineRule('email', email)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const waiting = ref(false)
const messages = ref({
  alert: String($route.query.alert || ''),
  notice: String($route.query.notice || '')
})
const query = ref({
  email: ''
})
const keyDownEnter = ref(false)

created()
function created () {
  if ($auth.loggedIn) { return redirectPath('/', { notice: $t('auth.already_authenticated') }) }

  if (Object.keys($route.query).length > 0) { navigateTo({}) } // NOTE: URLパラメータを消す為
  loading.value = false
}

// アカウントロック解除
async function postUnlock (invalid: boolean, keydown: boolean, setErrors: any, values: any) {
  const enter = keyDownEnter.value
  keyDownEnter.value = false
  if (invalid || processing.value || waiting.value || (keydown && !enter)) { return }

  processing.value = true
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.unlockUrl, 'POST', {
    ...query.value,
    redirect_url: $config.public.frontBaseURL + $config.public.unlockRedirectUrl
  })

  if (response?.ok) {
    if (data != null) {
      return redirectSignIn(data)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      messages.value = {
        alert: data.alert || $t('system.default'),
        notice: data.notice || ''
      }
      if (data.errors != null) {
        setErrors(existKeyErrors.value(data.errors, values))
        waiting.value = true
      }
    }
  }

  processing.value = false
}
</script>
