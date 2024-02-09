<template>
  <v-btn
    id="space_create_btn"
    :color="btnColor"
    @click="showDialog()"
  >
    <v-icon>mdi-folder-plus</v-icon>
    <span class="ml-1"><slot name="name">{{ $t('スペース作成') }}</slot></span>
  </v-btn>
  <v-dialog v-model="dialog" max-width="850px" :attach="$config.public.env.test">
    <v-card id="space_create_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-folder-plus</v-icon>
            <span class="ml-1">{{ $t('スペース作成') }}</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 mt-3">
                  {{ $t('名称') }}<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.name" name="name" rules="required|min:3|max:128">
                    <v-text-field
                      id="space_create_name_text"
                      v-model="space.name"
                      :placeholder="$t('スペース名を入力')"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      counter="128"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 mt-3" :style="$vuetify.display.mdAndUp ? 'height: 52px': ''">
                  {{ $t('説明') }}<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <v-tabs v-if="!$config.public.env.test" v-model="tabDescription" color="primary" height="32px">
                    <v-tab value="input">{{ $t('入力') }}</v-tab>
                    <v-tab value="preview">{{ $t('プレビュー') }}</v-tab>
                  </v-tabs>
                  <span v-show="tabDescription === 'input'">
                    <Field v-slot="{ errors }" v-model="space.description" name="description">
                      <v-textarea
                        id="space_create_description_text"
                        v-model="space.description"
                        :placeholder="$t('スペースの説明を入力')"
                        :hint="$t('Markdownに対応しています。')"
                        :persistent-hint="true"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      />
                    </Field>
                  </span>
                  <div v-show="tabDescription === 'preview'" class="md-preview mb-2">
                    <div class="mx-3 my-2">
                      <AppMarkdown :source="space.description" />
                    </div>
                  </div>
                </v-col>
              </v-row>
              <v-row v-if="$config.public.enablePublicSpace">
                <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap align-self-center text-no-wrap pr-0 pb-0 mt-1">
                  {{ $t('範囲') }}<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.private" name="private" :rules="{ one_of_select: [false, true] }">
                    <v-radio-group
                      v-model="space.private"
                      color="primary"
                      class="mt-0 pt-0"
                      density="compact"
                      inline
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    >
                      <v-radio
                        id="space_create_private_false"
                        :label="$t('誰でも表示できる（公開）')"
                        :value="false"
                        class="mr-2"
                      />
                      <v-radio
                        id="space_create_private_true"
                        :label="$t('メンバーのみ表示できる（非公開）')"
                        :value="true"
                      />
                    </v-radio-group>
                  </Field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap align-self-center text-no-wrap pr-0 pb-0 mt-3" :style="$vuetify.display.mdAndUp ? 'height: 52px': ''">
                  {{ $t('画像') }}<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.image" name="image" rules="size_20MB:20480">
                    <v-file-input
                      id="space_create_image_file"
                      v-model="space.image"
                      accept="image/jpeg,image/gif,image/png"
                      :label="$t('画像ファイル')"
                      prepend-icon=""
                      show-size
                      class="mt-2"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :error-messages="errors"
                      @update:model-value="waiting = false"
                    />
                  </Field>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mb-2 mr-2">
            <v-btn
              id="space_create_submit_btn"
              color="primary"
              variant="elevated"
              :disabled="!meta.valid || processing || waiting"
              @click="postSpacesCreate(setErrors, values)"
            >
              {{ $t('作成') }}
            </v-btn>
            <v-btn
              id="space_create_cancel_btn"
              color="secondary"
              variant="elevated"
              @click="dialog = false"
            >
              {{ $t('キャンセル') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
// eslint-disable-next-line camelcase
import { required, one_of, min, max, size } from '@vee-validate/rules'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth, redirectPath } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

defineProps({
  btnColor: {
    type: String,
    default: 'primary'
  }
})
const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()

setLocale(locale.value)
defineRule('required', required)
defineRule('one_of_select', one_of)
defineRule('min', min)
defineRule('max', max)
defineRule('size_20MB', size)

const processing = ref(false)
const waiting = ref(false)
const dialog = ref(false)
const tabDescription = ref('input')
const space = ref<any>(initSpace())
function initSpace () { return $config.public.enablePublicSpace ? { private: $config.public.defaultPrivateSpace } : {} }

// ダイアログ表示
function showDialog () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }, localePath) }
  if ($auth.user.destroy_schedule_at != null) { return redirectPath('/', { alert: $t('auth.destroy_reserved') }) }

  dialog.value = true
}

// スペース作成
async function postSpacesCreate (setErrors: any, values: any) {
  processing.value = true

  const params: any = {
    'space[name]': space.value.name,
    'space[description]': space.value.description || ''
  }
  if ($config.public.enablePublicSpace) { params['space[private]'] = Number(space.value.private) }
  if (space.value.image != null && space.value.image.length > 0) { params['space[image]'] = space.value.image[0] }

  const [response, data] = await useApiRequest(apiRequestURL.value(locale.value, $config.public.spaces.createUrl), 'POST', params, 'form')

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      await useAuthUser(locale.value) // NOTE: 左メニューの参加スペース更新の為
      if (data.space?.code != null) {
        navigateTo(localePath(`/-/${data.space.code}`))
      } else {
        dialog.value = false
        space.value = initSpace()
      }
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
    } else if (response?.status === 406) {
      $toast.error(data?.alert || $t('auth.destroy_reserved'))
    } else if (data == null) {
      $toast.error($t(`network.${response?.status == null ? 'failure' : 'error'}`))
    } else {
      $toast.error(data.alert || $t('system.default'))
      if (data.errors != null) {
        setErrors(existKeyErrors.value(data.errors, values))
        waiting.value = true
      }
    }
    if (data?.notice != null) { $toast.info(data.notice) }
  }

  processing.value = false
}
</script>
