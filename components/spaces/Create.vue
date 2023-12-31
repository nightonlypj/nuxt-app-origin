<template>
  <v-btn
    id="space_create_btn"
    :color="btnColor"
    @click="showDialog()"
  >
    <v-icon>mdi-folder-plus</v-icon>
    <span class="ml-1"><slot name="name">スペース作成</slot></span>
  </v-btn>
  <v-dialog v-model="dialog" max-width="850px" :attach="$config.public.env.test">
    <v-card id="space_create_dialog">
      <AppProcessing v-if="processing" />
      <Form v-if="dialog" v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="off">
          <v-toolbar color="primary" density="compact">
            <v-icon size="small" class="ml-4">mdi-folder-plus</v-icon>
            <span class="ml-1">スペース作成</span>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  名称<AppRequiredLabel />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.name" name="name" rules="required|min:3|max:128">
                    <v-text-field
                      id="space_create_name_text"
                      v-model="space.name"
                      placeholder="スペース名を入力"
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
                <v-col cols="auto" md="2" class="d-flex justify-md-end text-no-wrap pr-0 pb-0 mt-3">
                  説明<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <v-tabs v-if="!$config.public.env.test" v-model="tabDescription" color="primary" height="32px">
                    <v-tab value="input">入力</v-tab>
                    <v-tab value="preview">プレビュー</v-tab>
                  </v-tabs>
                  <span v-show="tabDescription === 'input'">
                    <Field v-slot="{ errors }" v-model="space.description" name="description">
                      <v-textarea
                        id="space_create_description_text"
                        v-model="space.description"
                        placeholder="スペースの説明を入力"
                        hint="Markdownに対応しています。"
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
                <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0 mt-1">
                  表示<AppRequiredLabel />
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
                        label="誰でも表示できる（公開）"
                        :value="false"
                        class="mr-2"
                      />
                      <v-radio
                        id="space_create_private_true"
                        label="メンバーのみ表示できる（非公開）"
                        :value="true"
                      />
                    </v-radio-group>
                  </Field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="auto" md="2" class="d-flex justify-md-end align-self-center text-no-wrap pr-0 pb-0 mt-3">
                  画像<AppRequiredLabel optional />
                </v-col>
                <v-col cols="12" md="10" class="pb-0">
                  <Field v-slot="{ errors }" v-model="space.image" name="image" rules="size_20MB:20480">
                    <v-file-input
                      id="space_create_image_file"
                      v-model="space.image"
                      accept="image/jpeg,image/gif,image/png"
                      label="画像ファイル"
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
              作成
            </v-btn>
            <v-btn
              id="space_create_cancel_btn"
              color="secondary"
              variant="elevated"
              @click="dialog = false"
            >
              キャンセル
            </v-btn>
          </v-card-actions>
        </v-form>
      </Form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { Form, Field, defineRule, configure } from 'vee-validate'
import { localize, setLocale } from '@vee-validate/i18n'
// eslint-disable-next-line camelcase
import { required, one_of, min, max, size } from '@vee-validate/rules'
import ja from '~/locales/validate.ja'
import AppProcessing from '~/components/app/Processing.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import { redirectAuth, redirectPath } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

defineRule('required', required)
defineRule('one_of_select', one_of)
defineRule('min', min)
defineRule('max', max)
defineRule('size_20MB', size)
configure({ generateMessage: localize({ ja }) })
setLocale('ja')

defineProps({
  btnColor: {
    type: String,
    default: 'primary'
  }
})
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth, $toast } = useNuxtApp()

const processing = ref(false)
const waiting = ref(false)
const dialog = ref(false)
const tabDescription = ref('input')
const space = ref<any>(initSpace())
function initSpace () { return $config.public.enablePublicSpace ? { private: $config.public.defaultPrivateSpace } : {} }

// ダイアログ表示
function showDialog () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }) }
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

  const [response, data] = await useApiRequest($config.public.apiBaseURL + $config.public.spaces.createUrl, 'POST', params, 'form')

  if (response?.ok) {
    if (data != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      await useAuthUser() // NOTE: 左メニューの参加スペース更新の為
      if (data.space?.code != null) {
        navigateTo(`/-/${data.space.code}`)
      } else {
        dialog.value = false
        space.value = initSpace()
      }
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') })
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
