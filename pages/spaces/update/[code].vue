<template>
  <Head>
    <Title>{{ $t('スペース設定') }}</Title>
  </Head>
  <AppLoading v-if="loading" />
  <template v-else>
    <AppMessage v-model:messages="messages" />
    <SpacesDestroyInfo :space="space" />
    <v-card max-width="850px">
      <AppProcessing v-if="processing" />
      <v-tabs v-if="!$config.public.env.test" v-model="tabPage" color="primary">
        <v-tab :to="spacePath">{{ $t('スペース') }}</v-tab>
        <v-tab value="active">{{ $t('スペース設定') }}</v-tab>
      </v-tabs>
      <Form v-slot="{ meta, setErrors, values }">
        <v-form autocomplete="on">
          <v-card-text>
            <v-row>
              <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                {{ $t('作成情報') }}
              </v-col>
              <v-col cols="12" md="10" class="d-flex pb-0">
                <span class="align-self-center mr-3 text-grey">{{ dateTimeFormat(locale, space.created_at, 'N/A') }}</span>
                <UsersAvatar :user="space.created_user" />
              </v-col>
            </v-row>
            <v-row v-if="space.last_updated_at != null || space.last_updated_user != null">
              <v-col cols="auto" md="2" class="d-flex align-self-center justify-md-end text-no-wrap pr-0 pb-0">
                {{ $t('更新情報') }}
              </v-col>
              <v-col cols="12" md="10" class="d-flex pb-0">
                <span class="align-self-center mr-3 text-grey">{{ dateTimeFormat(locale, space.last_updated_at, 'N/A') }}</span>
                <UsersAvatar :user="space.last_updated_user" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 mt-3">
                {{ $t('名称') }}<AppRequiredLabel />
              </v-col>
              <v-col cols="12" md="10" class="pb-0">
                <Field v-slot="{ errors }" v-model="space.name" name="name" rules="required|min:3|max:128">
                  <v-text-field
                    id="space_update_name_text"
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
              <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 mt-3" :style="$vuetify.display.mdAndUp.value ? 'height: 52px': ''">
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
                      id="space_update_description_text"
                      v-model="space.description"
                      :placeholder="$t('スペースの説明を入力')"
                      :hint="$t('Markdownに対応しています。')"
                      :persistent-hint="true"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      :disabled="tabDescription !== 'input'"
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
              <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 mt-1">
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
                      id="space_update_private_false"
                      :label="$t('誰でも表示できる（公開）')"
                      :value="false"
                      class="mr-2"
                    />
                    <v-radio
                      id="space_update_private_true"
                      :label="$t('メンバーのみ表示できる（非公開）')"
                      :value="true"
                    />
                  </v-radio-group>
                </Field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="auto" md="2" class="d-flex justify-md-end flex-wrap text-no-wrap pr-0 pb-0 pt-8" :style="$vuetify.display.mdAndUp.value ? 'height: 52px': ''">
                {{ $t('画像') }}<AppRequiredLabel optional />
              </v-col>
              <v-col cols="12" md="10" class="pb-0">
                <div class="d-flex align-self-center">
                  <v-avatar v-if="space.image_url != null" size="64px">
                    <v-img :src="space.image_url.medium" />
                  </v-avatar>
                  <v-checkbox
                    v-if="space.upload_image"
                    id="space_update_image_delete_check"
                    v-model="space.image_delete"
                    color="primary"
                    :label="$t('削除（初期画像に戻す）')"
                    class="mt-4 ml-4"
                    density="compact"
                    hide-details
                    @update:model-value="waiting = false"
                  />
                </div>
                <Field v-slot="{ errors }" v-model="space.image" name="image" rules="size_20MB:20480">
                  <v-file-input
                    id="space_update_image_file"
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
            <v-row>
              <v-col cols="auto" md="2" class="pr-0" />
              <v-col cols="12" md="10" class="mt-4">
                <v-btn
                  id="space_update_btn"
                  color="primary"
                  :disabled="!meta.valid || processing || waiting"
                  @click="postSpacesUpdate(setErrors, values)"
                >
                  {{ $t('変更') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-form>
      </Form>
      <v-divider />
      <v-card-actions v-if="space.destroy_schedule_at == null">
        <ul class="my-2">
          <li><NuxtLink :to="localePath(`/spaces/delete/${code}`)">{{ $t('スペース削除') }}</NuxtLink></li>
        </ul>
      </v-card-actions>
    </v-card>
  </template>
</template>

<script setup lang="ts">
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
 
import { required, one_of, min, max, size } from '@vee-validate/rules'
import AppLoading from '~/components/app/Loading.vue'
import AppProcessing from '~/components/app/Processing.vue'
import AppMessage from '~/components/app/Message.vue'
import AppRequiredLabel from '~/components/app/RequiredLabel.vue'
import AppMarkdown from '~/components/app/Markdown.vue'
import SpacesDestroyInfo from '~/components/spaces/DestroyInfo.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import { dateTimeFormat } from '~/utils/display'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth, redirectPath, redirectError } from '~/utils/redirect'
import { currentMemberAdmin } from '~/utils/members'
import { existKeyErrors } from '~/utils/input'

const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth, $toast } = useNuxtApp()
const $route = useRoute()

setLocale(locale.value)
defineRule('required', required)
defineRule('one_of_select', one_of)
defineRule('min', min)
defineRule('max', max)
defineRule('size_20MB', size)

const loading = ref(true)
const processing = ref(false)
const waiting = ref(true)
const messages = ref({
  alert: '',
  notice: ''
})
const tabPage = ref('active')
const tabDescription = ref('input')
const space = ref<any>(null)
const code = String($route.params.code)
const spacePath = localePath(`/-/${code}`)

created()
async function created () {
  if (!$auth.loggedIn) { return redirectAuth({ notice: $t('auth.unauthenticated') }, localePath) }
  if ($auth.user.destroy_schedule_at != null) { return redirectPath(spacePath, { alert: $t('auth.destroy_reserved') }) }

  if (!await getSpacesDetail()) { return }
  if (!currentMemberAdmin.value(space.value)) { return redirectPath(spacePath, { alert: $t('auth.forbidden') }) }
  if (space.value.destroy_schedule_at != null) { return redirectPath(spacePath, { alert: $t('alert.space.destroy_reserved') }) }

  loading.value = false
}

// スペース詳細取得
async function getSpacesDetail () {
  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.spaces.detailUrl.replace(':code', code)))

  if (response?.ok) {
    if (data?.space != null) {
      space.value = data.space
      return true
    } else {
      redirectError(null, { alert: $t('system.error') })
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
    } else if (response?.status === 403) {
      redirectError(403, { alert: data?.alert || $t('auth.forbidden'), notice: data?.notice })
    } else if (response?.status === 404) {
      redirectError(404, { alert: data?.alert, notice: data?.notice })
    } else if (data == null) {
      redirectError(response?.status, { alert: $t(`network.${response?.status == null ? 'failure' : 'error'}`) })
    } else {
      redirectError(response?.status, { alert: data.alert || $t('system.default'), notice: data.notice })
    }
  }

  return false
}

// スペース設定変更
async function postSpacesUpdate (setErrors: any, values: any) {
  processing.value = true

  const params: any = {
    'space[name]': space.value.name,
    'space[description]': space.value.description || ''
  }
  if ($config.public.enablePublicSpace) { params['space[private]'] = Number(space.value.private) }
  if (space.value.image_delete) { params['space[image_delete]'] = true }
  if (space.value.image != null && space.value.image.length > 0) { params['space[image]'] = space.value.image[0] }

  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.spaces.updateUrl.replace(':code', code)), 'POST', params, 'form')

  if (response?.ok) {
    if (data?.space != null) {
      if (data.alert != null) { $toast.error(data.alert) }
      if (data.notice != null) { $toast.success(data.notice) }

      await useAuthUser(locale.value) // NOTE: 左メニューの参加スペース更新の為
      return navigateTo(spacePath)
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
    } else if (response?.status === 403) {
      $toast.error(data?.alert || $t('auth.forbidden'))
    } else if (response?.status === 406) {
      $toast.error(data?.alert || $t('auth.destroy_reserved'))
    } else if (data == null) {
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
      processing.value = false
      return
    }
    if (data?.notice != null) { $toast.info(data.notice) }
  }

  processing.value = false
}
</script>
