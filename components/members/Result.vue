<template>
  <div v-if="result.email == null" class="pb-2">
    N/A
  </div>
  <div v-else class="d-flex align-self-center pb-2">
    {{ localeString('ja', result.email.count, 'N/A') }}名中
    <v-icon :color="$config.public.member.createColor.create" class="ml-3 mr-1" size="small">{{ $config.public.member.createIcon.create }}</v-icon>
    招待: {{ localeString('ja', result.email.create_count, 'N/A') }}名
    <v-icon :color="$config.public.member.createColor.exist" class="ml-3 mr-1" size="small">{{ $config.public.member.createIcon.exist }}</v-icon>
    参加中: {{ localeString('ja', result.email.exist_count, 'N/A') }}名
    <v-icon :color="$config.public.member.createColor.notfound" class="ml-3 mr-1" size="small">{{ $config.public.member.createIcon.notfound }}</v-icon>
    未登録: {{ localeString('ja', result.email.notfound_count, 'N/A') }}名
  </div>
  <v-divider class="my-2" />
  <v-data-table-server
    :headers="headers"
    :items="result.emails"
    :items-length="result.emails?.length || 0"
    :items-per-page="-1"
    density="compact"
    hover
    fixed-header
    :height="tableHeight($vuetify.display.height)"
  >
    <!-- 結果 -->
    <template #[`item.result`]="{ item }: any">
      <v-icon :color="($config.public.member.createColor as any)[item.result]" size="small">{{ ($config.public.member.createIcon as any)[item.result] }}</v-icon>
      {{ item.result_i18n }}
    </template>
  </v-data-table-server>
  <v-divider class="my-2" />
</template>

<script setup lang="ts">
import { localeString, tableHeight } from '~/utils/display'

defineProps({
  result: {
    type: Object,
    required: true
  }
})
const $config = useRuntimeConfig()

const headers = [
  { title: 'メールアドレス', key: 'email', sortable: false, headerProps: { class: 'text-no-wrap' } },
  { title: '結果', key: 'result', sortable: false, headerProps: { class: 'text-no-wrap' } }
]
</script>

<style scoped>
.v-data-table >>> .v-data-table-footer {
  display: none; /* NOTE: フッタを非表示にする為 */
}
</style>
