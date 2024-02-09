<template>
  <v-form autocomplete="on" @submit.prevent>
    <div
      id="space_search_area"
      @keydown.enter="keyDownEnter = completInputKey($event)"
      @keyup.enter="search(true)"
    >
      <v-row>
        <v-col class="d-flex">
          <v-text-field
            id="space_search_text"
            v-model="syncQuery.text"
            :label="$t('検索')"
            :placeholder="$t('名称や説明を入力')"
            autocomplete="on"
            style="max-width: 400px"
            density="comfortable"
            hide-details
            maxlength="255"
            clearable
            @update:model-value="waiting = false"
          />
          <v-btn
            id="space_search_btn"
            color="primary"
            class="ml-1 mt-1"
            :disabled="processing || waiting || blank()"
            @click="search(false)"
          >
            <v-icon size="large">mdi-magnify</v-icon>
          </v-btn>
          <v-btn
            v-if="$auth.loggedIn"
            id="space_search_option_btn"
            color="secondary"
            class="ml-2 mt-1"
            rounded
            @click="syncQuery.option = !syncQuery.option"
          >
            <v-icon size="x-large">{{ syncQuery.option ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
            <span class="hidden-sm-and-down">{{ $t('検索オプション') }}</span>
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-if="$auth.loggedIn" v-show="syncQuery.option" id="space_search_option_item">
        <v-col v-if="$config.public.enablePublicSpace" cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">{{ $t('範囲') }}</v-chip>
          <v-checkbox
            id="space_search_public_check"
            v-model="syncQuery.public"
            color="primary"
            :label="$t('公開')"
            class="mr-2"
            density="compact"
            hide-details
            :error="privateBlank()"
            @update:model-value="waiting = false"
          />
          <v-checkbox
            id="space_search_private_check"
            v-model="syncQuery.private"
            color="primary"
            :label="$t('非公開')"
            density="compact"
            hide-details
            :error="privateBlank()"
            @update:model-value="waiting = false"
          />
        </v-col>
        <v-col v-if="$config.public.enablePublicSpace" cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">{{ $t('状況') }}</v-chip>
          <v-checkbox
            id="space_search_join_check"
            v-model="syncQuery.join"
            color="primary"
            :label="$t('参加')"
            class="mr-2"
            density="compact"
            hide-details
            :error="joinBlank()"
            @update:model-value="waiting = false"
          />
          <v-checkbox
            id="space_search_nojoin_check"
            v-model="syncQuery.nojoin"
            color="primary"
            :label="$t('未参加')"
            density="compact"
            hide-details
            :error="joinBlank()"
            @update:model-value="waiting = false"
          />
        </v-col>
        <v-col cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">{{ $t('状態') }}</v-chip>
          <v-checkbox
            id="space_search_active_check"
            v-model="syncQuery.active"
            color="primary"
            :label="$t('有効')"
            class="mr-2"
            density="compact"
            hide-details
            :error="activeBlank()"
            @update:model-value="waiting = false"
          />
          <v-checkbox
            id="space_search_destroy_check"
            v-model="syncQuery.destroy"
            color="primary"
            :label="$t('削除予定')"
            density="compact"
            hide-details
            :error="activeBlank()"
            @update:model-value="waiting = false"
          />
        </v-col>
      </v-row>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { completInputKey } from '~/utils/input'

const $props = defineProps({
  processing: {
    type: Boolean,
    required: true
  },
  query: {
    type: Object,
    required: true
  }
})
defineExpose({ updateWaiting })
const $emit = defineEmits(['update:query', 'search'])
const syncQuery = computed({
  get: () => $props.query,
  set: (value: object) => $emit('update:query', value)
})
const $config = useRuntimeConfig()
const { t: $t } = useI18n()
const { $auth } = useNuxtApp()

const waiting = ref(true)
const keyDownEnter = ref(false)

function blank () {
  return (!$config.public.enablePublicSpace || privateBlank() || joinBlank()) || activeBlank()
}
function privateBlank () {
  return !$props.query.public && !$props.query.private
}
function joinBlank () {
  return !$props.query.join && !$props.query.nojoin
}
function activeBlank () {
  return !$props.query.active && !$props.query.destroy
}

function search (keydown: boolean) {
  const enter = keyDownEnter.value
  keyDownEnter.value = false
  if ($props.processing || waiting.value || blank() || (keydown && !enter)) { return }

  waiting.value = true
  $emit('search')
}

function updateWaiting (value: boolean) { waiting.value = value }
</script>
