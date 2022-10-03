<template>
  <v-data-table
    v-if="spaces != null && spaces.length > 0"
    :headers="headers"
    :items="spaces"
    item-key="code"
    :items-per-page="-1"
    hide-default-footer
    mobile-breakpoint="600"
    hide-default-header
    disable-sort
  >
    <!-- 名称 -->
    <template #[`item.name`]="{ item }">
      <v-avatar v-if="item.image_url != null" :id="'space_image_' + item.code" size="32px">
        <v-img :src="item.image_url.small" />
      </v-avatar>
      <NuxtLink :to="'/s/' + item.code" class="ml-1">{{ $textTruncate(item.name, 64) }}</NuxtLink>
      <SpacesIcon :space="item" />
    </template>
    <!-- 説明 -->
    <template #[`item.description`]="{ item }">
      {{ $textTruncate(item.description, 128) }}
    </template>
    <!-- アクション -->
    <template #[`item.action`]="{ item }">
      <v-btn
        v-if="item.current_member != null"
        :to="'/members/' + item.code"
        color="secondary"
        small
        nuxt
      >
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-icon dense small v-bind="attrs" v-on="on">mdi-account-multiple</v-icon>
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
    showItems: {
      type: Array,
      default: null
    }
  },

  computed: {
    headers () {
      const result = []
      for (const item of this.$t('items.spaces')) {
        if (item.disabled || this.showItems == null || this.showItems.includes(item.value)) {
          result.push({ text: item.text, value: item.value, class: 'text-no-wrap', cellClass: 'px-1 py-2' })
        }
      }
      return result
    }
  }
}
</script>
