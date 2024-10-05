<template>
  <div v-if="result.email == null" class="pb-2">N/A</div>
  <div v-else class="d-flex align-self-center pb-2">
    {{ $t(`{total}名中（${result.email.count <= 1 ? '単数' : '複数'}）`, { total: localeString(locale, result.email.count, 'N/A') }) }}
    <v-icon :color="$config.public.member.createColor.create" class="ml-3 mr-1" size="small">{{ $config.public.member.createIcon.create }}</v-icon>
    {{ $t('招待') }}: {{ $t(`{total}名（${result.email.create_count <= 1 ? '単数' : '複数'}）`, { total: localeString(locale, result.email.create_count, 'N/A') }) }}
    <v-icon :color="$config.public.member.createColor.exist" class="ml-3 mr-1" size="small">{{ $config.public.member.createIcon.exist }}</v-icon>
    {{ $t('参加中') }}: {{ $t(`{total}名（${result.email.exist_count <= 1 ? '単数' : '複数'}）`, { total: localeString(locale, result.email.exist_count, 'N/A') }) }}
    <v-icon :color="$config.public.member.createColor.notfound" class="ml-3 mr-1" size="small">{{ $config.public.member.createIcon.notfound }}</v-icon>
    {{ $t('未登録') }}: {{ $t(`{total}名（${result.email.notfound_count <= 1 ? '単数' : '複数'}）`, { total: localeString(locale, result.email.notfound_count, 'N/A') }) }}
  </div>
  <v-divider class="mt-2" />
  <v-data-table-server
    :headers="tableHeaders($t, $config.public.members.resultHeaders)"
    :items="result.emails"
    :items-length="result.emails?.length || 0"
    :items-per-page="-1"
    density="compact"
    hover
  >
    <!-- 結果 -->
    <template #[`item.result`]="{ item }: any">
      <v-icon :color="($config.public.member.createColor as any)[item.result]" size="small">{{ ($config.public.member.createIcon as any)[item.result] }}</v-icon>
      {{ item.result_i18n }}
    </template>
  </v-data-table-server>
  <v-divider class="mb-2" />
</template>

<script setup lang="ts">
import { tableHeaders, localeString } from '~/utils/display'

defineProps({
  result: {
    type: Object,
    required: true
  }
})
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
</script>

<style scoped>
.v-data-table >>> .v-data-table-footer {
  display: none; /* NOTE: フッタを非表示にする為 */
}
</style>
