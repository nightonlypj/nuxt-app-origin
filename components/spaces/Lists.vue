<template>
  <v-data-table-server
    v-if="spaces != null && spaces.length > 0"
    :headers="headers"
    :items="spaces"
    :items-per-page="-1"
    :items-length="spaces.length"
    density="comfortable"
  >
    <!--
    :content-class="itemClass"  TODO: 背景色が変わらない
    mobile-breakpoint="600"  TODO: モバイルデザインにならない
    -->
    <template #headers /><!-- NOTE: hide-default-headerが効かない為 -->
    <!-- 名称 -->
    <template #[`item.name`]="{ item }">
      <div class="ml-1">
        <v-avatar v-if="item.raw.image_url != null" :id="`space_image_${item.raw.code}`" size="32px" class="mr-1">
          <v-img :src="item.raw.image_url.small" />
        </v-avatar>
        <NuxtLink :to="`/-/${item.raw.code}`">{{ $textTruncate(item.raw.name, 64) }}</NuxtLink>
        <SpacesIcon :space="item.raw" />
      </div>
    </template>
    <!-- 説明 -->
    <template #[`item.description`]="{ item }">
      {{ $textTruncate(item.raw.description, 128) }}
    </template>
    <!-- (アクション) -->
    <template #[`item.action`]="{ item }">
      <NuxtLink v-if="item.raw.current_member != null" :to="`/members/${item.raw.code}`">
        <v-btn color="primary" size="small">
          <v-icon>mdi-account-multiple</v-icon>
          <v-tooltip activator="parent" location="bottom">メンバー一覧</v-tooltip>
        </v-btn>
      </NuxtLink>
    </template>
  </v-data-table-server>
</template>

<script>
import SpacesIcon from '~/components/spaces/Icon.vue'

export default defineNuxtComponent({
  components: {
    SpacesIcon
  },

  props: {
    spaces: {
      type: Array,
      default: null
    },
    hiddenItems: {
      type: Array,
      default: null
    }
  },

  computed: {
    headers () {
      const result = []
      for (const item of this.$tm('items.space')) {
        if (item.required || !this.hiddenItems.includes(item.key)) {
          result.push({ title: item.title, key: item.key, class: 'text-no-wrap', cellClass: 'px-1 py-2' }) // TODO: class/cellClassが効かない
        }
      }
      result.push({ key: 'action', cellClass: 'pl-1 pr-2 py-2' })
      return result
    },

    itemClass () {
      return (item) => {
        if (item.raw.destroy_requested_at != null && item.raw.destroy_requested_at !== '') { return 'row_inactive' }
        return null
      }
    }
  }
})
</script>

<style scoped>
.v-data-table >>> .v-data-table-footer {
  display: none; /* NOTE: hide-default-footerが効かない為 */
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
