<template>
  <v-data-table-server
    v-if="spaces != null && spaces.length > 0"
    :headers="headers"
    :items="spaces"
    :items-length="spaces.length"
    :items-per-page="-1"
    density="compact"
    hover
    :row-props="rowProps"
  >
    <template #headers /><!-- NOTE: ヘッダを非表示にする為 -->
    <!-- 名称 -->
    <template #[`item.name`]="{ item }: any">
      <div class="ml-1">
        <v-avatar v-if="item.image_url != null" :id="`space_image_${item.code}`" size="32px" class="mr-1">
          <v-img :src="item.image_url.small" />
        </v-avatar>
        <NuxtLink :to="`/-/${item.code}`">{{ textTruncate(item.name, 64) }}</NuxtLink>
        <SpacesIcon :space="item" />
      </div>
    </template>
    <!-- 説明 -->
    <template #[`item.description`]="{ item }: any">
      {{ textTruncate(item.description, 128) }}
    </template>
    <!-- (アクション) -->
    <template #[`item.action`]="{ item }: any">
      <NuxtLink v-if="item.current_member != null" :to="`/members/${item.code}`">
        <v-btn color="primary" size="small">
          <v-icon>mdi-account-multiple</v-icon>
          <v-tooltip activator="parent" location="bottom">メンバー一覧</v-tooltip>
        </v-btn>
      </NuxtLink>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import SpacesIcon from '~/components/spaces/Icon.vue'
import { textTruncate } from '~/utils/display'

const $props = defineProps({
  spaces: {
    type: Array,
    default: null
  },
  hiddenItems: {
    type: Array,
    default: null
  }
})
const { tm: $tm } = useI18n()

const headers: any = computed(() => {
  const result = []
  for (const item of Object.values($tm('items.space') as any) as any) {
    if (item.required || !$props.hiddenItems.includes(item.key)) {
      result.push({ title: item.title, key: item.key, headerProps: { class: 'text-no-wrap' }, cellProps: { class: 'px-1 py-2' } })
    }
  }
  result.push({ key: 'action', cellProps: { class: 'pl-1 pr-2 py-2' } })
  return result
})
const rowProps = computed(() => ({ item }: any) => {
  return (item.destroy_schedule_at != null && item.destroy_schedule_at !== '') ? { class: 'row_inactive' } : null
})
</script>

<style scoped>
.v-data-table >>> .v-data-table-footer {
  display: none; /* NOTE: フッタを非表示にする為 */
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
