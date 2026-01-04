<template>
  <v-dialog max-width="740px" :attach="$config.public.env.test">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        id="list_download_btn"
        color="secondary"
        @click="initialize()"
      >
        <v-icon>mdi-download</v-icon>
        <span class="hidden-sm-and-down ml-1">{{ $t('ダウンロード') }}</span>
        <v-tooltip activator="parent" location="bottom" :disabled="$vuetify.display.mdAndUp">{{ $t('ダウンロード') }}</v-tooltip>
      </v-btn>
    </template>
    <template #default="{ isActive }">
      <v-card id="list_download_dialog">
        <AppProcessing v-if="processing" />
        <Form v-slot="{ meta, setErrors, values }">
          <v-form autocomplete="off">
            <v-toolbar color="primary" density="compact">
              <v-icon size="small" class="ml-4">mdi-download</v-icon>
              <span class="ml-1">{{ $t('ダウンロード') }}</span>
            </v-toolbar>
            <v-card-text>
              <v-container class="pt-0">
                <v-row>
                  <!-- 左側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>{{ $t('対象') }}</h4>
                    <Field v-slot="{ errors }" v-model="query.target" name="target" rules="required_select">
                      <v-radio-group
                        v-model="query.target"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(value, key) in $tm('enums.download.target')"
                          :id="`list_download_target_${key}`"
                          :key="key"
                          :label="String(value)"
                          :value="key"
                          class="mr-2"
                          :disabled="!enableTarget.includes(key)"
                        />
                      </v-radio-group>
                    </Field>
                    <h4 class="pt-3">{{ $t('形式') }}</h4>
                    <Field v-slot="{ errors }" v-model="query.format" name="format" rules="required_select">
                      <v-radio-group
                        v-model="query.format"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(value, key) in $tm('enums.download.format')"
                          :id="`list_download_format_${key}`"
                          :key="key"
                          :label="String(value)"
                          :value="key"
                          class="mr-2"
                        />
                      </v-radio-group>
                    </Field>
                    <h4 class="pt-3">{{ $t('文字コード') }}</h4>
                    <Field v-slot="{ errors }" v-model="query.char_code" name="char_code" rules="required_select">
                      <v-radio-group
                        v-model="query.char_code"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(value, key) in $tm('enums.download.char_code')"
                          :id="`list_download_char_code_${key}`"
                          :key="key"
                          :label="String(value)"
                          :value="key"
                          class="mr-2"
                        />
                      </v-radio-group>
                    </Field>
                    <h4 class="pt-3">{{ $t('改行コード') }}</h4>
                    <Field v-slot="{ errors }" v-model="query.newline_code" name="newline_code" rules="required_select">
                      <v-radio-group
                        v-model="query.newline_code"
                        color="primary"
                        class="mt-1"
                        density="compact"
                        inline
                        hide-details="auto"
                        :error-messages="errors"
                        @update:model-value="waiting = false"
                      >
                        <v-radio
                          v-for="(value, key) in $tm('enums.download.newline_code')"
                          :id="`list_download_newline_code_${key}`"
                          :key="key"
                          :label="String(value)"
                          :value="key"
                          class="mr-2"
                        />
                      </v-radio-group>
                    </Field>
                  </v-col>
                  <!-- 右側 -->
                  <v-col cols="12" sm="6" class="pb-0">
                    <h4>
                      {{ $t('出力項目') }}
                      <v-btn
                        id="list_download_output_items_set_all_btn"
                        color="secondary"
                        size="small"
                        class="ml-4"
                        :disabled="outputItems.length >= items.length"
                        @click="setAllOutputItems()"
                      >
                        {{ $t('全選択') }}
                      </v-btn>
                      <v-btn
                        id="list_download_output_items_clear_btn"
                        color="secondary"
                        size="small"
                        class="ml-1"
                        :disabled="outputItems.length === 0"
                        @click="clearOutputItems(setErrors)"
                      >
                        {{ $t('全解除') }}
                      </v-btn>
                      <v-btn
                        id="list_download_output_items_set_default_btn"
                        color="secondary"
                        size="small"
                        class="ml-2"
                        :disabled="isEqual(sortBy(outputItems), sortBy(defaultOutputItems))"
                        @click="setDefaultOutputItems()"
                      >
                        {{ $t('初期値') }}
                      </v-btn>
                    </h4>
                    <Field v-slot="{ errors }" v-model="outputItems" name="output_items" rules="required_select">
                      <template v-for="(item, index) in items" :key="item.key">
                        <v-switch
                          :id="`list_download_output_item_${item.key.replace('.', '_')}`"
                          v-model="outputItems"
                          :color="item.defaultHidden ? 'secondary' : 'primary'"
                          :label="item.title"
                          :value="item.key"
                          density="compact"
                          :hide-details="index + 1 < items.length ? true : 'auto'"
                          :error-messages="errors"
                          @update:model-value="waiting = false"
                        />
                      </template>
                    </Field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions class="justify-end mb-2 mr-2">
              <v-btn
                id="list_download_submit_btn"
                color="primary"
                variant="elevated"
                :disabled="!meta.valid || processing || waiting"
                @click="postDownloadsCreate(isActive, setErrors, values)"
              >
                {{ $t('ダウンロード') }}
              </v-btn>
              <v-btn
                id="list_download_cancel_btn"
                color="secondary"
                variant="elevated"
                @click="isActive.value = false"
              >
                {{ $t('キャンセル') }}
              </v-btn>
            </v-card-actions>
          </v-form>
        </Form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
 
import { sortBy, isEqual } from 'lodash'
import { Form, Field, defineRule } from 'vee-validate'
import { setLocale } from '@vee-validate/i18n'
import { required } from '@vee-validate/rules'
import AppProcessing from '~/components/app/Processing.vue'
import { apiRequestURL } from '~/utils/api'
import { redirectAuth } from '~/utils/redirect'
import { existKeyErrors } from '~/utils/input'

const $props = defineProps({
  admin: {
    type: Boolean,
    default: null
  },
  model: {
    type: String,
    required: true
  },
  headers: {
    type: Array,
    required: true
  },
  space: {
    type: Object,
    default: null
  },
  hiddenItems: {
    type: Array,
    required: true
  },
  selectItems: {
    type: Array,
    default: null
  },
  searchParams: {
    type: Object,
    default: null
  }
})
const localePath = useLocalePath()
const $config = useRuntimeConfig()
const { t: $t, tm: $tm, locale } = useI18n()
const { $toast } = useNuxtApp()

setLocale(locale.value)
defineRule('required_select', required)

const processing = ref(false)
const waiting = ref(false)
const query = ref<any>(null)
const outputItems = ref<any>([])
const enableTarget = ref<any>([])

const items: any = computed(() => $props.headers.filter((item: any) => item.title != null && (!item.adminOnly || $props.admin)))
const defaultOutputItems = computed(() => items.value.filter((item: any) => !item.defaultHidden).map((item: any) => item.key))

function initialize () {
  waiting.value = false
  query.value = {
    target: null,
    format: localStorage.getItem('download.format'),
    char_code: localStorage.getItem('download.char_code'),
    newline_code: localStorage.getItem('download.newline_code')
  }
  outputItems.value = items.value.filter((item: any) => !$props.hiddenItems.includes(item.key)).map((item: any) => item.key)

  enableTarget.value = []
  if ($props.selectItems != null && $props.selectItems.length > 0) { enableTarget.value.push('select') }
  if ($props.searchParams != null && Object.keys($props.searchParams).length > 0) { enableTarget.value.push('search') }
  enableTarget.value.push('all')

  if (!enableTarget.value.includes(query.value.target)) { query.value.target = enableTarget.value[0] }
  if (($tm('enums.download.format') as any)[query.value.format] == null) { query.value.format = 'csv' }
  if (($tm('enums.download.char_code') as any)[query.value.char_code] == null) { query.value.char_code = 'sjis' }
  if (($tm('enums.download.newline_code') as any)[query.value.newline_code] == null) { query.value.newline_code = 'crlf' }
}

function setAllOutputItems () {
  outputItems.value = items.value.map((item: any) => item.key)
  waiting.value = false
}
function clearOutputItems (setErrors: any) {
  outputItems.value = []
  waiting.value = false
  setErrors({ output_items: null }) // NOTE: 初回解除時にバリデーションが効かない為
}
function setDefaultOutputItems () {
  outputItems.value = defaultOutputItems.value
  waiting.value = false
}

// ダウンロード依頼
async function postDownloadsCreate (isActive: any, setErrors: any, values: any) {
  processing.value = true

  const [response, data] = await useApiRequest(apiRequestURL(locale.value, $config.public.downloads.createUrl), 'POST', {
    download: {
      model: $props.model,
      space_code: $props.space?.code,
      ...query.value,
      output_items: items.value.filter((item: any) => outputItems.value.includes(item.key)).map((item: any) => item.key),
      select_items: $props.selectItems,
      search_params: $props.searchParams
    }
  })

  if (response?.ok) {
    if (data != null) {
      localStorage.setItem('download.format', query.value.format)
      localStorage.setItem('download.char_code', query.value.char_code)
      localStorage.setItem('download.newline_code', query.value.newline_code)
      isActive.value = false
      navigateTo({ path: localePath('/downloads'), query: { target_id: data.download?.id } })
    } else {
      $toast.error($t('system.error'))
    }
  } else {
    if (response?.status === 401) {
      useAuthSignOut(locale.value, true)
      return redirectAuth({ alert: data?.alert, notice: data?.notice || $t('auth.unauthenticated') }, localePath)
    } else if (response?.status === 403) {
      $toast.error(data?.alert || $t('auth.forbidden'))
    } else if (response?.status === 404) {
      $toast.error(data?.alert || $t('system.notfound'))
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
