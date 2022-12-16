<template>
  <v-data-table
    v-if="spaces != null && spaces.length > 0"
    :headers="headers"
    :items="spaces"
    item-key="code"
    :item-class="itemClass"
    :items-per-page="-1"
    hide-default-footer
    mobile-breakpoint="600"
    hide-default-header
    disable-sort
  >
    <!-- 名称 -->
    <template #[`item.name`]="{ item }">
      <div class="ml-1">
        <v-avatar v-if="item.image_url != null" :id="`space_image_${item.code}`" size="32px">
          <v-img :src="item.image_url.small" />
        </v-avatar>
        <NuxtLink :to="`/-/${item.code}`">{{ $textTruncate(item.name, 64) }}</NuxtLink>
        <SpacesIcon :space="item" />
      </div>
    </template>
    <!-- 説明 -->
    <template #[`item.description`]="{ item }">
      {{ $textTruncate(item.description, 128) }}
    </template>
    <!-- (アクション) -->
    <template #[`item.action`]="{ item }">
      <v-btn
        v-if="item.current_member != null"
        :to="`/members/${item.code}`"
        color="primary"
        small
        nuxt
      >
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-icon small v-bind="attrs" v-on="on">mdi-account-multiple</v-icon>
          </template>
          メンバー一覧
        </v-tooltip>
      </v-btn>
    </template>
  </v-data-table>
</template>

<script>
import SpacesIcon from '~/components/spaces/Icon.vue'

export default {
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
      for (const item of this.$t('items.space')) {
        if (item.required || !this.hiddenItems.includes(item.value)) {
          result.push({ text: item.text, value: item.value, class: 'text-no-wrap', cellClass: 'px-1 py-2' })
        }
      }
      result.push({ value: 'action', cellClass: 'pl-1 pr-2 py-2' })
      return result
    },

    itemClass () {
      return (item) => {
        if (item.destroy_requested_at != null && item.destroy_requested_at !== '') { return 'row_inactive' }
        return null
      }
    }
  }
}
</script>

<style scoped>
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
