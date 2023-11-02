<template>
  <Head>
    <Title>パスワード再設定</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:alert="alert" v-model:notice="notice" />
    <v-card max-width="480px">
      <AppProcessing v-if="processing" />
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-card-title>パスワード再設定</v-card-title>
          <v-card-text
            id="password_update_area"
            @keydown.enter="keyDownEnter = completInputKey($event)"
            @keyup.enter="postPasswordUpdate(!meta.valid, true, setErrors, values)"
          >
            <Field v-slot="{ errors }" v-model="query.password" name="password" rules="required|min:8">
              <v-text-field
                id="password_update_password_text"
                v-model="query.password"
                :type="showPassword ? 'text' : 'password'"
                label="新しいパスワード [8文字以上]"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <Field v-slot="{ errors }" v-model="query.password_confirmation" name="password_confirmation" rules="required|confirmed_new_password:@password">
              <v-text-field
                id="password_update_password_confirmation_text"
                v-model="query.password_confirmation"
                :type="showPassword ? 'text' : 'password'"
                label="新しいパスワード(確認)"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="new-password"
                counter
                :error-messages="errors"
                @update:model-value="waiting = false"
                @click:append="showPassword = !showPassword"
              />
            </Field>
            <v-btn
              id="password_update_btn"
              color="primary"
              class="mt-4"
              :disabled="!meta.valid || processing || waiting"
              @click="postPasswordUpdate(!meta.valid, false, setErrors, values)"
            >
              変更
            </v-btn>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <ActionLink action="password" />
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, min, confirmed } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import ActionLink from '~/components/users/ActionLink.vue'
import { completInputKey, existKeyErrors } from '~/utils/helper'
import { redirectAlreadyAuth, redirectPasswordReset, redirectTop } from '~/utils/auth'

defineRule('required', required)
defineRule('min', min)
defineRule('confirmed_new_password', confirmed)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

const loading = ref(true)
const processing = ref(false)
const waiting = ref(false)
const alert = ref('')
const notice = ref('')
const query = ref({
  password: '',
  password_confirmation: ''
})
const showPassword = ref(false)
const keyDownEnter = ref(false)

created()
function created () {
  if ($auth.loggedIn) { return redirectAlreadyAuth($t) }
  if ($route.query.reset_password === 'false') { return redirectPasswordReset($route.query) }
  if (!$route.query.reset_password_token) { return redirectPasswordReset({ alert: $t('auth.reset_password_token_blank') }) }

  loading.value = false
}

// パスワード再設定
async function postPasswordUpdate (invalid: boolean, keydown: boolean, setErrors: any, values: any) {
  const enter = keyDownEnter.value
  keyDownEnter.value = false
  if (invalid || processing.value || waiting.value || (keydown && !enter)) { return }

  processing.value = true
  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.passwordUpdateUrl, 'POST', {
    reset_password_token: $route.query.reset_password_token,
    ...query.value
  })

  if (response?.ok) {
    if (data == null) {
      $toast.error($t('system.error'))
    } else {
      $auth.setData(data)
      return redirectTop(data, true)
    }
  } else {
    if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else if (data.errors == null) {
      return redirectPasswordReset({ alert: data.alert || $t('system.default'), notice: data.notice })
    } else {
      alert.value = data.alert || $t('system.default')
      notice.value = data.notice || ''
      if (data.errors != null) {
        setErrors(existKeyErrors(data.errors, values))
        waiting.value = true
      }
    }
  }

  processing.value = false
}
</script>
