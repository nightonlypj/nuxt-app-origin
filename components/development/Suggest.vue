<template>
  <v-autocomplete
    v-model="syncModelValue"
    v-model:search="search"
    :items="items[searchKey]"
    :loading="loading[searchKey]"
    item-title="name"
    item-value="code"
    no-filter
    return-object
    chips
    clearable
    placeholder="ユーザー名を入力"
    :no-data-text="loading[searchKey] ? '' : '候補が見つかりません。'"
    density="compact"
    variant="outlined"
    hide-details="auto"
    :disabled="disabled"
    :error-messages="errorMessage"
    @update:search="updateItems(null, searchKey)"
    @update:menu="updateItems($event, searchKey)"
  >
    <!-- NOTE:
      eslint-plugin-vuetifyで自動修正される[v-model:search-input="search"]だと発火しない。searchは初期値で開始、@update:searchで検索
      return-objectでもitem-value（ユニークな値）は必要。無いとno-filterでもitem-textが重複する値が表示されない
    -->
    <!-- 選択項目 -->
    <template #chip="{ props, item }: any">
      <v-chip
        v-bind="props"
        :prepend-avatar="item.raw.image_url.mini"
        :text="item.raw.name"
        :closable="!disabled"
        @click:close="syncModelValue = null"
      />
    </template>
    <!-- サジェスト項目 -->
    <template #item="{ props, item }: any">
      <v-list-item
        v-bind="props"
        :prepend-avatar="item.raw.image_url.large"
        :title="item.raw.name"
        :subtitle="item.raw.email"
      />
    </template>
    <!-- 件数表示 --><!-- NOTE: UI的にセレクトボックスと勘違いしやすい為、続きがある事を明示 -->
    <template #append-item>
      <span v-if="pages[searchKey] != null && items[searchKey] != null && items[searchKey].length > 0" class="d-flex justify-end mt-2 mr-4">
        {{ pages[searchKey].total_count }}件中 1-{{ items[searchKey].length }}件を表示
      </span>
    </template>
  </v-autocomplete>
  <!-- TODO: 削除（デバッグ用） -->
  <div style="margin-top: 192px">modelValue: {{ syncModelValue }}</div>
  <div class="mt-2">search: {{ search }}</div>
  <div>pages[search]: {{ pages[searchKey] }}</div>
  <div>items[search]: {{ items[searchKey] }}</div>
  <div class="mt-2">loading[search]: {{ loading[searchKey] }}</div>
</template>

<script setup lang="ts">
const $props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  disabled: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: ''
  }
})
const $emit = defineEmits(['update:modelValue'])
const syncModelValue: any = computed({
  get: () => $props.modelValue,
  set: (value: object) => $emit('update:modelValue', value)
})

const pages = ref<any>({}) // NOTE: APIから取得した場合のみセットして、キャッシュ存在チェックに使う
const items = ref<any>({})
const search = ref<any>(null)
const loading = ref<any>({})
const searchKey = computed(() => search.value || '')

// サジェスト項目更新
function updateItems (menuOpen: boolean | null, text: string) {
  if ($props.disabled) { return }

  /* c8 ignore next */ // eslint-disable-next-line no-console
  console.log('updateItems', menuOpen, text, loading.value[text], items.value[text] != null)

  if (menuOpen === false || loading.value[text] || items.value[text] != null) {
    /* c8 ignore next */ // eslint-disable-next-line no-console
    console.log('...Skip')
    return
  }

  loading.value[text] = true

  // TODO: 実際はAPIで取得する
  const allItems = [
    { code: 'code1', name: 'name1', email: 'name1@example.com', image_url: { mini: 'https://api.nightonly.com/images/user/mini_noimage.jpg', large: 'https://api.nightonly.com/images/user/medium_noimage.jpg' } },
    { code: 'code2', name: 'name2', email: 'name2@example.com', image_url: { mini: 'https://api.nightonly.com/images/space/mini_noimage.jpg', large: 'https://api.nightonly.com/images/space/medium_noimage.jpg' } },
    { code: 'code3', name: 'name3', email: 'name3@example.com', image_url: { mini: 'https://api.nightonly.com/images/user/mini_noimage.jpg', large: 'https://api.nightonly.com/images/user/medium_noimage.jpg' } },
    { code: 'code4', name: 'name4', email: 'name4@example.com', image_url: { mini: 'https://api.nightonly.com/images/space/mini_noimage.jpg', large: 'https://api.nightonly.com/images/space/medium_noimage.jpg' } }
  ]
  const searchItems = search.value == null ? allItems : allItems.filter((item: any) => item.name.includes(search.value) || item.email.includes(search.value))
  items.value[text] = searchItems.slice(0, 3)
  pages.value[text] = { total_count: searchItems.length }

  loading.value[text] = false
}
</script>
