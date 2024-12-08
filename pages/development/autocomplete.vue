<template>
  <div>
    <DevelopmentSuggest
      v-model="user"
      item-text="name"
      item-value="code"
      placeholder="ユーザー名を入力"
      :disabled="disabled"
      :error-messages="error === '' ? null : [error]"
      @input="waiting = false"
    >
      <!-- 選択項目 -->
      <template #selection="{ item }">
        <v-avatar size="24px" class="mr-1">
          <v-img :src="item.image_url" />
        </v-avatar>
        {{ item.name }}
      </template>
      <!-- サジェスト項目 -->
      <template #item="{ item }">
        <v-avatar size="24px" class="mr-1">
          <v-img :src="item.image_url" />
        </v-avatar>
        {{ item.name }}
      </template>
    </DevelopmentSuggest>
    <!-- TODO: 削除（デバッグ用） -->
    <div class="mt-4">user: {{ user }}</div>
    <div>waiting: {{ waiting }}</div>
    <div class="d-flex mt-2">
      <v-checkbox v-model="disabled" label="無効" dense hide-details />
      <v-text-field v-model="error" label="エラーメッセージ" dense outlined hide-details class="ml-4" />
    </div>
  </div>
</template>

<script>
import DevelopmentSuggest from '~/components/development/Suggest.vue'

export default {
  components: {
    Suggest
  },

  data () {
    return {
      waiting: true,
      //user: null,
      //user: { code: 'code1', name: 'name1', image_url: 'https://api.nightonly.com/images/user/mini_noimage.jpg' },
      //user: { code: 'code2', name: 'namex', image_url: 'https://api.nightonly.com/images/space/mini_noimage.jpg' },
      //user: { code: 'code3', name: 'namex', image_url: 'https://api.nightonly.com/images/user/mini_noimage.jpg' },
      user: { code: 'code4', name: 'name4', image_url: 'https://api.nightonly.com/images/space/mini_noimage.jpg' },
      disabled: false,
      error: ''
    }
  }
}
</script>
