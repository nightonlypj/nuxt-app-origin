<template>
  <v-form autocomplete="on" @submit.prevent>
    <div
      id="member_search_area"
      @keydown.enter="keyDownEnter = completInputKey($event)"
      @keyup.enter="search(true)"
    >
      <v-row>
        <v-col class="d-flex">
          <v-text-field
            id="member_search_text"
            v-model="syncQuery.text"
            label="検索"
            :placeholder="`ユーザー名${admin ? 'やメールアドレス' : ''}を入力`"
            autocomplete="on"
            style="max-width: 400px"
            density="comfortable"
            hide-details
            maxlength="255"
            clearable
            @update:model-value="waiting = false"
          />
          <v-btn
            id="member_search_btn"
            color="primary"
            class="ml-1 mt-1"
            :disabled="processing || waiting || blank()"
            @click="search(false)"
          >
            <v-icon size="large">mdi-magnify</v-icon>
          </v-btn>
          <v-btn
            id="member_search_option_btn"
            color="secondary"
            class="ml-2 mt-1"
            rounded
            @click="syncQuery.option = !syncQuery.option"
          >
            <v-icon size="x-large">{{ syncQuery.option ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
            <span class="hidden-sm-and-down">検索オプション</span>
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-show="syncQuery.option" id="member_search_option_item">
        <v-col cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">権限</v-chip>
          <template v-for="(value, key, index) in $tm('enums.member.power')" :key="key">
            <v-checkbox
              :id="`member_search_power_${key}_check`"
              v-model="syncQuery.power[key]"
              color="primary"
              :label="String(value)"
              :class="index + 1 < Object.keys($tm('enums.member.power')).length ? 'mr-2' : null"
              density="compact"
              hide-details
              :error="powerBlank()"
              @update:model-value="waiting = false"
            />
          </template>
        </v-col>
        <v-col cols="auto" class="d-flex py-0">
          <v-chip size="small" class="mt-1">状態</v-chip>
          <v-checkbox
            id="member_search_active_check"
            v-model="syncQuery.active"
            color="primary"
            label="有効"
            class="mr-2"
            density="compact"
            hide-details
            :error="activeBlank()"
            @update:model-value="waiting = false"
          />
          <v-checkbox
            id="member_search_destroy_check"
            v-model="syncQuery.destroy"
            color="primary"
            label="削除予定"
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
    default: null
  },
  query: {
    type: Object,
    required: true
  },
  admin: {
    type: Boolean,
    default: null
  }
})
const syncQuery = computed({
  get: () => $props.query,
  set: (value: object) => $emit('update:query', value)
})
defineExpose({ setError })
const $emit = defineEmits(['update:query', 'search'])
const $config = useRuntimeConfig()
const { tm: $tm } = useI18n()

const waiting = ref(true)
const keyDownEnter = ref(false)

function blank () {
  return powerBlank() || activeBlank()
}
function powerBlank () {
  for (const key in $props.query.power) {
    if ($props.query.power[key]) { return false }
  }
  return true
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

// エラー処理
function setError () {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('setError') }

  waiting.value = false // NOTE: 検索ボタンを押せるようにする
}
</script>
