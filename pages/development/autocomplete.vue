<template>
  <Head>
    <Title>v-autocomplete</Title>
  </Head>
  <v-card v-if="!loading">
    <v-card-text>
      <DevelopmentSuggest
        v-model="user"
        :disabled="disabled"
        :error-message="errorMessage"
        @update:model-value="waiting = false"
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
      <div class="mt-4">- autocomplete.vue -</div>
      <div>user: {{ user }}</div>
      <div>waiting: {{ waiting }}</div>
      <div class="d-flex mt-2">
        <v-checkbox v-model="disabled" color="primary" label="無効" density="compact" hide-details />
        <v-text-field v-model="errorMessage" label="エラーメッセージ" density="compact" variant="outlined" hide-details class="ml-4" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import DevelopmentSuggest from '~/components/development/Suggest.vue'

const $config = useRuntimeConfig()

const loading = ref(true)
const waiting = ref(true)
// const user = ref<any>(null)
const user = ref<any>({ code: 'code1', name: 'name1', email: 'name1@example.com', image_url: { mini: 'https://api.nightonly.com/images/user/mini_noimage.jpg', large: 'https://api.nightonly.com/images/user/medium_noimage.jpg' } })
const disabled = ref(false)
const errorMessage = ref('')

/* c8 ignore start */
if (!$config.public.developmentMenu) {
  showError({ statusCode: 404 })
  /* c8 ignore stop */
} else {
  loading.value = false
}
</script>
