<template>
  <v-data-table
    v-if="downloads != null && downloads.length > 0"
    :headers="headers"
    :items="downloads"
    item-key="id"
    :item-class="itemClass"
    :items-per-page="-1"
    hide-default-footer
    mobile-breakpoint="600"
    fixed-header
    :height="appTableHeight"
    disable-sort
  >
    <!-- 依頼日時 -->
    <template #[`header.requested_at`]="{ header }">
      {{ header.text }}
      <v-icon dense>mdi-arrow-down</v-icon>
    </template>
    <template #[`item.requested_at`]="{ item }">
      <div class="text-no-wrap">
        {{ $timeFormat('ja', item.requested_at) }}
      </div>
    </template>
    <!-- ステータス -->
    <template #[`item.status`]="{ item }">
      <v-icon v-if="item.status === 'success'" :id="`icon_success_${item.id}`" color="success" dense>mdi-check-circle</v-icon>
      <v-icon v-else-if="item.status === 'failure'" :id="`icon_failure_${item.id}`" color="error" dense>mdi-alert</v-icon>
      <v-icon v-else :id="`icon_info_${item.id}`" color="info" dense>mdi-information</v-icon>
      {{ item.status_i18n }}
    </template>
    <!-- ファイル -->
    <template #[`header.file`]="{ header }">
      <div class="text-center">
        {{ header.text }}
      </div>
    </template>
    <template #[`item.file`]="{ item }">
      <div v-if="item.status === 'success'" class="text-center">
        <a
          :id="`download_link_${item.id}`"
          class="text-no-wrap"
          @click="$emit('downloadsFile', item)"
        >
          <v-icon dense>mdi-download</v-icon>
          ダウンロード
        </a>
        <div v-if="item.last_downloaded_at" :id="`download_done_${item.id}`">（済み）</div>
      </div>
    </template>
    <!-- 対象・形式等 -->
    <template #[`item.target`]="{ item }">
      <template v-if="item.model === 'member' && item.space != null && item.space.name != null">
        メンバー: {{ $textTruncate(item.space.name, 64) }}
      </template>
      <template v-else>
        {{ item.model_i18n }}
      </template>
      <div>{{ item.target_i18n }}, {{ item.format_i18n }}, {{ item.char_code_i18n }}, {{ item.newline_code_i18n }}</div>
    </template>
  </v-data-table>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  mixins: [Application],

  props: {
    downloads: {
      type: Array,
      default: null
    }
  },

  computed: {
    headers () {
      const result = []
      for (const item of this.$t('items.download')) {
        result.push({ text: item.text, value: item.value, class: 'text-no-wrap', cellClass: 'px-1 py-2' })
      }
      if (result.length > 0) { result[result.length - 1].cellClass = 'pl-1 pr-4 py-2' } // NOTE: スクロールバーに被らないようにする為
      return result
    },

    itemClass () {
      return (item) => {
        if (item.status === 'success') {
          return item.last_downloaded_at ? 'row_inactive' : 'row_active'
        }
        if (item.id === Number(this.$route.query.id)) { return 'row_active' }
        if (item.status === 'failure') { return 'row_inactive' }
        return null
      }
    }
  }
}
</script>

<style scoped>
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
