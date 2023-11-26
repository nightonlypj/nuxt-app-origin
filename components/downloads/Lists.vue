<template>
  <v-data-table-server
    v-if="downloads != null && downloads.length > 0"
    :headers="headers"
    :items="downloads"
    :items-per-page="-1"
    :items-length="downloads.length"
    density="compact"
    :row-props="rowProps"
    fixed-header
    :height="tableHeight($vuetify.display.height)"
  >
    <!-- 依頼日時 -->
    <template #[`header.requested_at`]="{ column }">
      <span>{{ column.title }}</span>
      <v-icon>$sortDesc</v-icon>
    </template>
    <template #[`item.requested_at`]="{ item }: any">
      <div class="text-no-wrap">
        {{ dateTimeFormat('ja', item.requested_at) }}
      </div>
    </template>
    <!-- 完了日時 -->
    <template #[`item.completed_at`]="{ item }: any">
      <div class="text-no-wrap">
        {{ dateTimeFormat('ja', item.completed_at) }}
      </div>
    </template>
    <!-- ステータス -->
    <template #[`item.status`]="{ item }: any">
      <v-icon
        :id="`download_icon_${['success', 'failure'].includes(item.status) ? item.status : 'info'}_${item.id}`"
        :color="item.status === 'success' ? 'success' : (item.status === 'failure' ? 'error' : 'info')"
        size="small"
      >
        {{ item.status === 'success' ? 'mdi-check-circle' : (item.status === 'failure' ? 'mdi-alert' : 'mdi-information') }}
      </v-icon>
      {{ item.status_i18n }}
    </template>
    <!-- ファイル -->
    <template #[`header.file`]="{ column }">
      <div class="text-center">
        {{ column.title }}
      </div>
    </template>
    <template #[`item.file`]="{ item }: any">
      <div v-if="item.status === 'success'" class="text-center">
        <v-btn
          :id="`download_link${item.last_downloaded_at == null ? '' : '_done'}_${item.id}`"
          :color="item.last_downloaded_at == null ? 'primary' : 'secondary'"
          size="small"
          class="text-no-wrap"
          @click="$emit('downloadsFile', item)"
        >
          <v-icon size="small">mdi-download</v-icon>
          ダウンロード
        </v-btn>
      </div>
    </template>
    <!-- 対象・形式等 -->
    <template #[`item.target`]="{ item }: any">
      <div class="my-2">
        <template v-if="item.model === 'member' && item.space != null && item.space.name != null">
          メンバー: {{ textTruncate(item.space.name, 64) }}
        </template>
        <template v-else>
          {{ item.model_i18n }}
        </template>
        <div>{{ item.target_i18n }}, {{ item.format_i18n }}, {{ item.char_code_i18n }}, {{ item.newline_code_i18n }}</div>
      </div>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { tableHeight, dateTimeFormat, textTruncate } from '~/utils/display'

defineProps({
  downloads: {
    type: Array,
    default: null
  }
})
const $emit = defineEmits(['downloadsFile'])
const { tm: $tm } = useI18n()
const $route = useRoute()

const headers = computed(() => {
  const result = []
  for (const [, item] of Object.entries($tm('items.download') as any) as any) {
    result.push({ title: item.title, key: item.key, sortable: false, headerProps: { class: 'text-no-wrap' }, cellProps: { class: 'px-1 py-2' } })
  }
  if (result.length > 0) { result[result.length - 1].cellProps.class = 'pl-1 pr-4 py-2' } // NOTE: スクロールバーに被らないようにする為
  return result
})
const rowProps = computed(() => ({ item }: any) => {
  if ($route.query?.target_id != null) {
    if (item.id === Number($route.query.target_id)) { return { class: item.last_downloaded_at == null ? 'row_active' : 'row_inactive' } }
    return null
  }

  if (item.status === 'success') { return { class: item.last_downloaded_at == null ? 'row_active' : 'row_inactive' } }
  if (item.status === 'failure') { return { class: 'row_inactive' } }
  return null
})
</script>

<style scoped>
.v-data-table >>> .v-data-table-footer {
  display: none; /* NOTE: フッタを非表示にする為 */
}
.v-data-table.v-theme--dark >>> tr.row_active {
  background-color: #1A237E; /* indigo darken-4 */
}
.v-data-table.v-theme--light >>> tr.row_active {
  background-color: #E8EAF6; /* indigo lighten-5 */
}
.v-data-table.v-theme--dark >>> tr:hover.row_active {
  background-color: #283593 !important; /* indigo darken-3 */
}
.v-data-table.v-theme--light >>> tr:hover.row_active {
  background-color: #C5CAE9 !important; /* indigo lighten-4 */
}

.v-data-table.v-theme--dark >>> tr.row_inactive {
  background-color: #424242; /* grey darken-3 */
}
.v-data-table.v-theme--light >>> tr.row_inactive {
  background-color: #F5F5F5; /* grey lighten-4 */
}
.v-data-table.v-theme--dark >>> tr:hover.row_inactive {
  background-color: #616161 !important; /* grey darken-2 */
}
.v-data-table.v-theme--light >>> tr:hover.row_inactive {
  background-color: #E0E0E0 !important; /* grey lighten-2 */
}
</style>
