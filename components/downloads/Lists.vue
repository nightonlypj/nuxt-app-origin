<template>
  <v-data-table-server
    v-if="downloads != null && downloads.length > 0"
    :headers="headers"
    :items="downloads"
    :items-per-page="-1"
    :items-length="downloads.length"
    density="comfortable"
    fixed-header
    :height="tableHeight($vuetify.display.height)"
  >
    <!--
    :item-class="itemClass"  TODO: 背景色が変わらない
    mobile-breakpoint="600"  TODO: モバイルデザインにならない
    -->
    <!-- 依頼日時 -->
    <template #[`column.requested_at`]="{ column }">
      <span>{{ column.title }}</span>
      <v-icon>$sortDesc</v-icon>
    </template>
    <template #[`item.requested_at`]="{ item }">
      <div class="text-no-wrap">
        {{ dateTimeFormat('ja', item.raw.requested_at) }}
      </div>
    </template>
    <!-- 完了日時 -->
    <template #[`item.completed_at`]="{ item }">
      <div class="text-no-wrap">
        {{ dateTimeFormat('ja', item.raw.completed_at) }}
      </div>
    </template>
    <!-- ステータス -->
    <template #[`item.status`]="{ item }">
      <v-icon
        :id="`download_icon_${['success', 'failure'].includes(item.raw.status) ? item.raw.status : 'info'}_${item.raw.id}`"
        :color="item.raw.status === 'success' ? 'success' : (item.raw.status === 'failure' ? 'error' : 'info')"
        size="small"
      >
        {{ item.raw.status === 'success' ? 'mdi-check-circle' : (item.raw.status === 'failure' ? 'mdi-alert' : 'mdi-information') }}
      </v-icon>
      {{ item.raw.status_i18n }}
    </template>
    <!-- ファイル -->
    <template #[`column.file`]="{ column }">
      <div class="text-center">
        {{ column.title }}
      </div>
    </template>
    <template #[`item.file`]="{ item }">
      <div v-if="item.raw.status === 'success'" class="text-center">
        <v-btn
          :id="`download_link${item.raw.last_downloaded_at == null ? '' : '_done'}_${item.raw.id}`"
          :color="item.raw.last_downloaded_at == null ? 'primary' : 'secondary'"
          size="small"
          class="text-no-wrap"
          @click="$emit('downloadsFile', item.raw)"
        >
          <v-icon size="small">mdi-download</v-icon>
          ダウンロード
        </v-btn>
      </div>
    </template>
    <!-- 対象・形式等 -->
    <template #[`item.target`]="{ item }">
      <div class="my-2">
        <template v-if="item.raw.model === 'member' && item.raw.space != null && item.raw.space.name != null">
          メンバー: {{ textTruncate(item.raw.space.name, 64) }}
        </template>
        <template v-else>
          {{ item.raw.model_i18n }}
        </template>
        <div>{{ item.raw.target_i18n }}, {{ item.raw.format_i18n }}, {{ item.raw.char_code_i18n }}, {{ item.raw.newline_code_i18n }}</div>
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
// const $route = useRoute()

const headers = computed(() => {
  const result = []
  for (const item of ($tm('items.download') as any)) {
    result.push({ title: item.title, key: item.key, sortable: false, class: 'text-no-wrap', cellClass: 'px-1 py-2' }) // TODO: class/cellClassが効かない
  }
  if (result.length > 0) { result[result.length - 1].cellClass = 'pl-1 pr-4 py-2' } // NOTE: スクロールバーに被らないようにする為
  return result
})
/*
const itemClass = computed(() => (item: any) => {
  if ($route.query?.target_id != null) {
    if (item.raw.id === Number($route.query.target_id)) { return item.raw.last_downloaded_at == null ? 'row_active' : 'row_inactive' }
    return null
  }

  if (item.raw.status === 'success') { return item.raw.last_downloaded_at == null ? 'row_active' : 'row_inactive' }
  if (item.raw.status === 'failure') { return 'row_inactive' }
  return null
})
*/
</script>

<style scoped>
.v-data-table >>> .v-data-table-footer {
  display: none; /* NOTE: hide-default-footerが効かない為 */
}
.v-data-table.theme--dark >>> tr.row_active {
  background-color: #1A237E; /* indigo darken-4 */
}
.v-data-table.theme--light >>> tr.row_active {
  background-color: #E8EAF6; /* indigo lighten-5 */
}
.v-data-table.theme--dark >>> tr:hover.row_active {
  background-color: #283593 !important; /* indigo darken-3 */
}
.v-data-table.theme--light >>> tr:hover.row_active {
  background-color: #C5CAE9 !important; /* indigo lighten-4 */
}

.v-data-table.theme--dark >>> tr.row_inactive {
  background-color: #424242; /* grey darken-3 */
}
.v-data-table.theme--light >>> tr.row_inactive {
  background-color: #F5F5F5; /* grey lighten-4 */
}
.v-data-table.theme--dark >>> tr:hover.row_inactive {
  background-color: #616161 !important; /* grey darken-2 */
}
.v-data-table.theme--light >>> tr:hover.row_inactive {
  background-color: #E0E0E0 !important; /* grey lighten-2 */
}
</style>
