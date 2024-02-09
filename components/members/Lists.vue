<template>
  <v-data-table-server
    v-if="members != null && members.length > 0"
    v-model="syncSelectedMembers"
    v-model:sort-by="syncSortBy"
    :headers="tableHeaders($t, $config.public.members.headers, $props.hiddenItems, $props.admin)"
    :items="members"
    :items-length="members.length"
    :items-per-page="-1"
    density="compact"
    hover
    :row-props="rowProps"
    :show-select="admin"
    :item-value="item => item"
    @dblclick:row="dblclickRow"
  >
    <!-- メンバー -->
    <template #[`item.user.name`]="{ item }: any">
      <div class="ml-1">
        <UsersAvatar :user="item.user" />
      </div>
    </template>
    <!-- メールアドレス -->
    <template #[`header.user.email`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <!-- 権限 -->
    <template #[`item.power`]="{ item }: any">
      <template v-if="admin && item.user.code !== $auth.user.code">
        <v-icon
          size="small"
          class="mr-1"
          @click="$emit('showUpdate', item)"
        >
          {{ memberPowerIcon(item.power) }}
        </v-icon>
        <a
          :id="`member_update_link_${item.user.code}`"
          style="color: -webkit-link; cursor: pointer; text-decoration: underline"
          @click="$emit('showUpdate', item)"
        >
          {{ item.power_i18n }}
        </a>
      </template>
      <template v-else>
        <v-icon size="small">{{ memberPowerIcon(item.power) }}</v-icon>
        {{ item.power_i18n }}
      </template>
    </template>
    <!-- 招待者 -->
    <template #[`header.invitationed_user.name`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <template #[`item.invitationed_user.name`]="{ item }: any">
      <template v-if="item.invitationed_user != null">
        <div v-if="item.invitationed_user.deleted" class="text-center">N/A</div>
        <UsersAvatar v-else :user="item.invitationed_user" />
      </template>
    </template>
    <!-- 招待日時 -->
    <template #[`item.invitationed_at`]="{ item }: any">
      {{ dateTimeFormat(locale, item.invitationed_at) }}
    </template>
    <!-- 更新者 -->
    <template #[`header.last_updated_user.name`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <template #[`item.last_updated_user.name`]="{ item }: any">
      <template v-if="item.last_updated_user != null">
        <div v-if="item.last_updated_user.deleted" class="text-center">N/A</div>
        <UsersAvatar v-else :user="item.last_updated_user" />
      </template>
    </template>
    <!-- 更新日時 -->
    <template #[`header.last_updated_at`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <template #[`item.last_updated_at`]="{ item }: any">
      {{ dateTimeFormat(locale, item.last_updated_at) }}
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import OnlyIcon from '~/components/members/OnlyIcon.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import { tableHeaders, dateTimeFormat } from '~/utils/display'
import { memberPowerIcon } from '~/utils/members'

const $props = defineProps({
  sort: {
    type: String,
    required: true
  },
  desc: {
    type: Boolean,
    required: true
  },
  members: {
    type: Array,
    default: null
  },
  selectedMembers: {
    type: Array,
    required: true
  },
  hiddenItems: {
    type: Array,
    required: true
  },
  activeUserCodes: {
    type: Array,
    required: true
  },
  admin: {
    type: Boolean,
    required: true
  }
})
const $emit = defineEmits(['update:selectedMembers', 'reload', 'showUpdate'])
const syncSelectedMembers = computed({
  get: () => $props.selectedMembers,
  set: (value: any) => $emit('update:selectedMembers', value)
})
const syncSortBy: any = computed({
  get: () => [{ key: $props.sort, order: $props.desc ? 'desc' : 'asc' }],
  set: (value: any) => {
    if (value.length === 0) {
      $emit('reload', { sort: $props.sort, desc: !$props.desc }) // NOTE: 同じ項目で並び順を2回変えると空になる為
    } else {
      $emit('reload', { sort: value[0].key, desc: value[0].order === 'desc' })
    }
  }
})
const $config = useRuntimeConfig()
const { t: $t, locale } = useI18n()
const { $auth } = useNuxtApp()

const rowProps = computed(() => ({ item }: any) => {
  return $props.activeUserCodes.includes(item.user?.code) ? { class: 'row_active' } : null
})

function dblclickRow (event: any, { item }: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('dblclickRow', event.target.innerHTML) }
  if (!$props.admin || item.user.code === $auth.user.code) { return }

  if (event.target.innerHTML.match(/v-ripple__animation--visible/) || event.target.innerHTML.match(/v-simple-checkbox/)) {
    /* c8 ignore next */ // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Skip') }
    return
  }

  $emit('showUpdate', item)
}
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
/*
.v-data-table >>> .v-data-table__thead.scroll {
  position: fixed;
}
*/
.v-table >>> th {
  /* 縦スクロール時に固定する */
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  /* tbody内のセルより手前に表示する */
  z-index: 100;
}
</style>
