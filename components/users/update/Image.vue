<template>
  <AppProcessing v-if="processing" />
  <Form v-slot="{ meta, setErrors, values }">
    <v-form autocomplete="off">
      <v-card-text>
        <v-avatar size="256px">
          <v-img :src="$auth.user.image_url.xlarge" />
        </v-avatar>
        <Field v-slot="{ errors }" v-model="image" name="image" rules="size_20MB:20480">
          <v-file-input
            id="user_update_image_file"
            v-model="image"
            accept="image/jpeg,image/gif,image/png"
            :label="$t('画像ファイル')"
            prepend-icon="mdi-camera"
            show-size
            class="mt-2"
            density="compact"
            :error-messages="errors"
            @update:model-value="waiting = false"
          />
        </Field>
        <v-btn
          id="user_update_image_btn"
          color="primary"
          class="mt-2 mr-2"
          :disabled="!meta.valid || image == null || image.length === 0 || processing || waiting"
          @click="postUserImageUpdate(setErrors, values)"
        >
          {{ $t('アップロード') }}
        </v-btn>
        <v-dialog transition="dialog-top-transition" max-width="600px" :attach="$config.public.env.test">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              id="user_delete_image_btn"
              color="secondary"
              class="mt-2"
              :disabled="!$auth.user.upload_image || processing"
            >
              {{ $t('画像削除') }}
            </v-btn>
          </template>
          <template #default="{ isActive }">
            <v-card id="user_delete_image_dialog">
              <v-toolbar color="warning" density="compact">
                <span class="ml-4">{{ $t('画像削除') }}</span>
              </v-toolbar>
              <v-card-text>
                <div class="text-h6 pa-4">{{ $t('削除確認メッセージ') }}</div>
              </v-card-text>
              <v-card-actions class="justify-end mb-2 mr-2">
                <v-btn
                  id="user_delete_image_no_btn"
                  color="secondary"
                  variant="elevated"
                  @click="isActive.value = false"
                >
                  {{ $t('いいえ（キャンセル）') }}
                </v-btn>
                <v-btn
                  id="user_delete_image_yes_btn"
                  color="warning"
                  variant="elevated"
                  @click="postUserImageDelete(isActive, setErrors, values)"
                >
                  {{ $t('はい（削除）') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-card-text>
    </v-form>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
import { size } from '@vee-validate/rules'
import AppProcessing from '~/components/app/Processing.vue'
import { redirectAuth } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

const $emit = defineEmits(['messages'])
const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()

setLocale(locale.value)
defineRule('size_20MB', size)

const processing = ref(false)
const waiting = ref(false)
const image = ref<any>(null)

// ユーザー画像変更
async function postUserImageUpdate (setErrors: any, values: any) {
  processing.value = true

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.userImageUpdateUrl, 'POST', {
    image: image.value[0]
  }, 'form')
  responseUserImage(response, data, setErrors, values)
}

// ユーザー画像削除
async function postUserImageDelete (isActive: any, setErrors: any, values: any) {
  processing.value = true
  isActive.value = false

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.userImageDeleteUrl, 'POST')
  responseUserImage(response, data, setErrors, values)
}

function responseUserImage (response: any, data: any, setErrors: any, values: any) {
  if (response?.ok) {
    if (data != null) {
      $auth.setData(data)
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      image.value = null
      $emit('messages', { alert: '', notice: '' }) // NOTE: Data.vueがセットした値を消す為
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
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
