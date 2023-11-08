<template>
  <v-data-table-server
    v-if="members != null && members.length > 0"
    v-model="syncSelectedMembers"
    v-model:sort-by="syncSortBy"
    :headers="headers"
    :items="members"
    :items-per-page="-1"
    :items-length="members.length"
    density="comfortable"
    fixed-header
    :height="tableHeight($vuetify.display.height)"
    :show-select="admin"
    :item-value="item => item"
  >
    <!--
    :item-class="itemClass"  TODO: 背景色が変わらない
    mobile-breakpoint="600"  TODO: モバイルデザインにならない
    @dblclick:row="showUpdate"  TODO: 動かない
    -->
    <!-- メンバー -->
    <template #[`item.user.name`]="{ item }">
      <div class="ml-1">
        <UsersAvatar :user="item.raw.user" />
      </div>
    </template>
    <!-- メールアドレス -->
    <template #[`column.user.email`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <!-- 権限 -->
    <template #[`item.power`]="{ item }">
      <v-icon
        size="small"
        class="mr-1"
        @click="$emit('showUpdate', item.raw)"
      >
        {{ memberPowerIcon(item.raw.power) }}
      </v-icon>
      <a
        v-if="admin && item.raw.user.code !== $auth.user.code"
        :id="`member_update_link_${item.raw.user.code}`"
        class="text-no-wrap"
        style="color: -webkit-link; cursor: pointer; text-decoration: underline"
        @click="$emit('showUpdate', item.raw)"
      >
        {{ item.raw.power_i18n }}
      </a>
      <div v-else class="text-no-wrap">
        <v-icon size="small">{{ memberPowerIcon(item.raw.power) }}</v-icon>
        {{ item.raw.power_i18n }}
      </div>
    </template>
    <!-- 招待者 -->
    <template #[`column.invitationed_user.name`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <template #[`item.invitationed_user.name`]="{ item }">
      <template v-if="item.raw.invitationed_user != null">
        <div v-if="item.raw.invitationed_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.raw.invitationed_user" />
      </template>
    </template>
    <!-- 招待日時 -->
    <template #[`item.invitationed_at`]="{ item }">
      <div class="text-center">
        {{ dateTimeFormat('ja', item.raw.invitationed_at) }}
      </div>
    </template>
    <!-- 更新者 -->
    <template #[`column.last_updated_user.name`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <template #[`item.last_updated_user.name`]="{ item }">
      <template v-if="item.raw.last_updated_user != null">
        <div v-if="item.raw.last_updated_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.raw.last_updated_user" />
      </template>
    </template>
    <!-- 更新日時 -->
    <template #[`column.last_updated_at`]="{ column, getSortIcon }">
      {{ column.title }}
      <OnlyIcon power="admin" />
      <v-icon class="v-data-table-header__sort-icon">{{ getSortIcon(column) }}</v-icon>
    </template>
    <template #[`item.last_updated_at`]="{ item }">
      <div class="text-center">
        {{ dateTimeFormat('ja', item.raw.last_updated_at) }}
      </div>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import OnlyIcon from '~/components/members/OnlyIcon.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import { tableHeight, dateTimeFormat } from '~/utils/display'
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
    default: null
  }
})
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
const $emit = defineEmits(['update:selectedMembers', 'reload', 'showUpdate'])
const { tm: $tm } = useI18n()
const { $auth } = useNuxtApp()

const headers: any = computed(() => {
  const result = []
  if ($props.admin) {
    result.push({ key: 'data-table-select', class: 'pl-3 pr-0', cellClass: 'pl-3 pr-0 py-2' }) // TODO: class/cellClassが効かない
  }
  for (const item of ($tm('items.member') as any)) {
    if ((item.required || !$props.hiddenItems.includes(item.key)) && (!item.adminOnly || $props.admin)) {
      result.push({ title: item.title, key: item.key, class: 'text-no-wrap', cellClass: 'px-1 py-2' })
    }
  }
  if (result.length > 0) { result[result.length - 1].cellClass = 'pl-1 pr-4 py-2' } // NOTE: スクロールバーに被らないようにする為
  return result
})
/*
const itemClass = computed(() => (item: any) => $props.activeUserCodes.includes(item.raw.user?.code) ? 'row_active' : null)

function showUpdate (event: any, { item }) {
  /* c8 ignore next *//* // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('showUpdate', event.target.innerHTML) }
  if (!$props.admin || item.raw.user.code === $auth.user.code) { return }

  if (event.target.innerHTML.match(/v-ripple__animation--visible/) || event.target.innerHTML.match(/v-simple-checkbox/)) {
    /* c8 ignore next *//* // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log('...Skip') }
    return
  }

  $emit('showUpdate', item.raw)
}
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
</style>
