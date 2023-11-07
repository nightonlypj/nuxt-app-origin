<template>
  <AppProcessing v-if="processing" />
  <Form v-slot="{ meta, setErrors, values }">
    <v-form autocomplete="off">
      <v-card-text>
        <v-alert v-if="user.unconfirmed_email != null" type="warning" class="mb-4">
          <span class="font-weight-bold">{{ user.unconfirmed_email }}</span> のメールを確認してください。<br>
          誤っている場合や再送する場合は入力し直してください。
        </v-alert>
        <Field v-slot="{ errors }" v-model="query.name" name="name" rules="required|max:32">
          <v-text-field
            id="user_update_name_text"
            v-model="query.name"
            label="氏名"
            prepend-icon="mdi-account"
            autocomplete="off"
            counter="32"
            :error-messages="errors"
            @update:model-value="waiting = false"
          />
        </Field>
        <Field v-slot="{ errors }" v-model="query.email" name="email" rules="required|email">
          <v-text-field
            id="user_update_email_text"
            v-model="query.email"
            label="メールアドレス"
            prepend-icon="mdi-email"
            autocomplete="off"
            :error-messages="errors"
            @update:model-value="waiting = false"
          />
        </Field>
        <Field v-slot="{ errors }" v-model="query.password" name="password" rules="min:8">
          <v-text-field
            id="user_update_password_text"
            v-model="query.password"
            :type="showPassword ? 'text' : 'password'"
            label="パスワード [8文字以上] (変更する場合のみ)"
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            autocomplete="new-password"
            counter
            :error-messages="errors"
            @update:model-value="waiting = false"
            @click:append="showPassword = !showPassword"
          />
        </Field>
        <Field v-slot="{ errors }" v-model="query.password_confirmation" name="password_confirmation" rules="confirmed_password:@password">
          <v-text-field
            id="user_update_password_confirmation_text"
            v-model="query.password_confirmation"
            :type="showPassword ? 'text' : 'password'"
            label="パスワード(確認) (変更する場合のみ)"
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            autocomplete="new-password"
            counter
            :error-messages="errors"
            @update:model-value="waiting = false"
            @click:append="showPassword = !showPassword"
          />
        </Field>
        <Field v-slot="{ errors }" v-model="query.current_password" name="current_password" rules="required">
          <v-text-field
            id="user_update_current_password_text"
            v-model="query.current_password"
            :type="showPassword ? 'text' : 'password'"
            label="現在のパスワード"
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
          id="user_update_btn"
          color="primary"
          class="mt-2"
          :disabled="!meta.valid || processing || waiting"
          @click="postUserUpdate(setErrors, values)"
        >
          変更
        </v-btn>
      </v-card-text>
    </v-form>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
import { required, email, min, max, confirmed } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import { redirectPath, redirectAuth } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('confirmed_password', confirmed)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

const $props = defineProps({
  user: {
    type: Object,
    required: true
  }
})
const $emit = defineEmits(['messages'])
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()

const processing = ref(false)
const waiting = ref(false)
const query = ref({
  name: $props.user.name,
  email: $props.user.email,
  password: '',
  password_confirmation: '',
  current_password: ''
})
const showPassword = ref(false)

// ユーザー情報変更
async function postUserUpdate (setErrors: any, values: any) {
  processing.value = true

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.userUpdateUrl, 'POST', {
    ...query.value,
    confirm_redirect_url: $config.public.frontBaseURL + $config.public.confirmationSuccessUrl
  })

  if (response?.ok) {
    if (data != null) {
      $auth.setData(data)
      return redirectPath('/', data, true)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth({ notice: $t('auth.unauthenticated') })
    } else if (response?.status === 406) {
      $toast.error(data?.alert || $t('auth.destroy_reserved'))
      if (data?.notice != null) { $toast.info(data.notice) }
    } else if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      $emit('messages', { alert: data.alert || $t('system.default'), notice: data.notice || '' })
      if (data.errors != null) {
        setErrors(existKeyErrors.value(data.errors, values))
        waiting.value = true
      }
    }
  }

  processing.value = false
}
</script>
