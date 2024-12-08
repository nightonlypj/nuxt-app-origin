<template>
  <div>
    <v-autocomplete
      v-model="model"
      :items="items[searchKey]"
      :loading="loading"
      :search-input.sync="search"
      :item-text="itemText"
      :item-value="itemValue"
      no-filter
      return-object
      clearable
      :placeholder="placeholder"
      :no-data-text="loading ? '' : '候補が見つかりません。'"
      dense
      outlined
      hide-details="auto"
      :disabled="disabled"
      :error-messages="errorMessages"
      @mousedown="updateItems('mousedown', { reset: false, run: model == null })"
      @click:clear="updateItems('click:clear', { reset: true, run: true })"
      @change="updateItems('change', { reset: model == null, run: false })"
      @blur="updateItems('blur', { reset: model == null, run: false })"
    >
      <!-- NOTE:
        return-objectでもitem-value（ユニークな値）は必要。無いとno-filterでもitem-textが重複する値が表示されない
        @mousedownは初回に全件取得する為
        @click:clear（ボタン）も全件取得する為
        @change（キー入力で削除）は未選択の場合のみ全件取得する為
        @blur（入力を抜けた時）は入力後、未選択の場合でもsearchに値が残る為、未入力なのに絞り込まれた結果が表示される為
      -->
      <!-- 選択項目 -->
      <template #selection="{ item }">
        <v-chip :close="!disabled" @click:close="model = null; updateItems('click:close', { reset: true, run: true })">
          <!-- NOTE: @click:close（ボタン）も全件取得する為 -->
          <slot name="selection" :item="item">{{ item[itemText] }}</slot>
        </v-chip>
      </template>
      <!-- サジェスト項目 -->
      <template #item="{ item }">
        <slot name="item" :item="item">{{ item[itemText] }}</slot>
      </template>
      <!-- 件数表示 --><!-- NOTE: UI的にセレクトボックスと勘違いしやすい為、続きがある事を明示 -->
      <template #append-item>
        <slot name="append-item" :pages="pages[searchKey]" :items="items[searchKey]">
          <span v-if="pages[searchKey] != null && items[searchKey] != null && items[searchKey].length > 0" class="d-flex justify-end mt-2 mr-4">
            {{ pages[searchKey].total_count }}件中 1-{{ items[searchKey].length }}件を表示
          </span>
        </slot>
      </template>
    </v-autocomplete>
    <!-- TODO: 削除（デバッグ用） -->
    <div class="mt-4">model: {{ model }}</div>
    <div class="mt-2">search: {{ search }}</div>
    <div>pages[search]: {{ pages[searchKey] }}</div>
    <div>items[search]: {{ items[searchKey] }}</div>
    <div class="mt-2">loading: {{ loading }}</div>
    <div>skip: {{ skip }}</div>
  </div>
</template>

<script>
export default {
  props: {
    value: { // NOTE: v-modeを受け取る
      type: Object,
      default: null
    },
    itemText: {
      type: String,
      default: 'text'
    },
    itemValue: {
      type: String,
      default: 'value'
    },
    placeholder: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: true
    },
    errorMessages: {
      type: Array,
      default: null
    }
  },

  data () {
    return {
      model: this.value,
      pages: {}, // NOTE: APIから取得した場合のみセットして、キャッシュ存在チェックに使う
      items: (this.value == null) ? {} : { [this.value[this.itemText]]: [this.value] }, // NOTE: 候補に一致するものが存在しないと表示されない
      search: (this.value == null) ? null : this.value[this.itemText], // NOTE: nullにするとwatchが呼ばれないようになる
      loading: false,
      skip: false
    }
  },

  computed: {
    searchKey () {
      return this.search || ''
    }
  },

  watch: {
    model (value) {
      if (this.disabled) { return }

      this.$emit('update:value', value) // NOTE: 呼び出し元のv-modelの値を更新する
      this.$emit('input', value) // NOTE: 呼び出し元に変更を通知する
    },

    search (text) {
      if (this.model != null && text == null) { // NOTE: 初期値を設定してもnullになり、選択項目が表示されない為
        console.log('...update', this.model[this.itemText])

        this.skip = true
        this.search = this.model[this.itemText]
        return
      }
      if (this.disabled) { return }

      this.updateItems('watch')
    }
  },

  methods: {
    updateItems (called, option = { reset: false, run: true }) {
      if (this.disabled) { return }

      console.log('updateItems', called, option, this.skip, this.search, this.model, this.loading)

      if (this.skip) {
        this.skip = false
        console.log('...Skip(skip)')
        return
      }

      if (option.reset) { this.search = null }
      if (!option.run || this.loading) {
        console.log('...Skip(!run or loading)')
        return
      }

      const text = this.searchKey
      if (this.pages[text] != null) { // NOTE: APIレスポンスのみキャッシュを使用する為、itemsではなくpagesで判定
        console.log('...Skip(cache)')
        return
      }

      this.loading = true

      // TODO: 実際はAPIで取得する
      const allItems = [
        { code: 'code1', name: 'name1', image_url: 'https://api.nightonly.com/images/user/mini_noimage.jpg' },
        { code: 'code2', name: 'namex', image_url: 'https://api.nightonly.com/images/space/mini_noimage.jpg' },
        { code: 'code3', name: 'namex', image_url: 'https://api.nightonly.com/images/user/mini_noimage.jpg' },
        { code: 'code4', name: 'name4', image_url: 'https://api.nightonly.com/images/space/mini_noimage.jpg' }
      ]
      if (this.search == null || ['', 'n', 'na', 'nam', 'name'].includes(this.search.toLowerCase())) {
        this.pages[text] = { total_count: 4, current_page: 1, total_pages: 2, limit_value: 3 }
        this.items[text] = allItems.slice(0, 3)
      } else if (this.search.toLowerCase() === 'name1') {
        this.pages[text] = { total_count: 1, current_page: 1, total_pages: 1, limit_value: 3 }
        this.items[text] = allItems.slice(0, 1)
      } else if (this.search.toLowerCase() === 'namex') {
        this.pages[text] = { total_count: 2, current_page: 1, total_pages: 1, limit_value: 3 }
        this.items[text] = allItems.slice(1, 3)
      } else if (this.search.toLowerCase() === 'name4') {
        this.pages[text] = { total_count: 1, current_page: 1, total_pages: 1, limit_value: 3 }
        this.items[text] = allItems.slice(3, 4)
      } else {
        this.pages[text] = { total_count: 0, current_page: 1, total_pages: 0, limit_value: 3 }
        this.items[text] = []
      }

      this.loading = false
    }
  }
}
</script>
