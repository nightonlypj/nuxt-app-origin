<template>
  <v-data-table-server
    v-if="invitations != null && invitations.length > 0"
    :headers="headers"
    :items="invitations"
    :items-per-page="-1"
    :items-length="invitations.length"
    density="comfortable"
    fixed-header
    :height="tableHeight($vuetify.display.height)"
  >
    <!--
    :item-class="itemClass"  TODO: 背景色が変わらない
    mobile-breakpoint="600"  TODO: モバイルデザインにならない
    @dblclick:row="showUpdate"  TODO: 動かない
    -->
    <!-- 招待URL -->
    <template #[`item.code`]="{ item }">
      <div v-if="item.raw.status === 'active'" class="text-center">
        <v-btn
          :id="`invitation_url_copy_btn_${item.raw.code}`"
          color="accent"
          icon
          variant="outlined"
          size="x-small"
          @click="copyInvitationURL(item.raw.code)"
        >
          <v-icon>mdi-content-copy</v-icon>
          <v-tooltip activator="parent" location="bottom">クリップボードにコピー</v-tooltip>
        </v-btn>
      </div>
    </template>
    <!-- ステータス -->
    <template #[`item.status`]="{ item }">
      <template v-if="item.raw.status === 'email_joined'">
        <v-icon :id="`invitation_icon_email_joined_${item.raw.code}`" color="info" size="small">mdi-information</v-icon>
        {{ item.raw.status_i18n }}
      </template>
      <template v-else>
        <v-icon
          :id="`invitation_icon_${item.raw.status === 'active' ? 'active': 'inactive'}_${item.raw.code}`"
          :color="item.raw.status === 'active' ? 'success' : 'error'"
          size="small"
          class="mr-1"
          @click="$emit('showUpdate', item.raw)"
        >
          {{ item.raw.status === 'active' ? 'mdi-check-circle' : 'mdi-alert' }}
        </v-icon>
        <a
          :id="`invitation_update_link_${item.raw.code}`"
          class="text-no-wrap"
          style="color: -webkit-link; cursor: pointer; text-decoration: underline"
          @click="$emit('showUpdate', item.raw)"
        >
          {{ item.raw.status_i18n }}
        </a>
      </template>
    </template>
    <!-- メールアドレス -->
    <template #[`item.email`]="{ item }">
      <div class="pl-1">
        <template v-if="item.raw.email != null">
          {{ item.raw.email }}
        </template>
        <template v-else>
          <div v-for="domain in item.raw.domains" :key="domain">
            *@{{ domain }}
          </div>
        </template>
      </div>
    </template>
    <!-- 権限 -->
    <template #[`item.power`]="{ item }">
      <div class="text-no-wrap">
        <v-icon size="small">{{ memberPowerIcon(item.raw.power) }}</v-icon>
        {{ item.raw.power_i18n }}
      </div>
    </template>
    <!-- 期限 -->
    <template #[`item.ended_at`]="{ item }">
      <div class="text-center">
        {{ dateTimeFormat('ja', item.raw.ended_at) }}
      </div>
    </template>
    <!-- 作成者 -->
    <template #[`item.created_user.name`]="{ item }">
      <template v-if="item.raw.created_user != null">
        <div v-if="item.raw.created_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.raw.created_user" />
      </template>
    </template>
    <!-- 作成日時 -->
    <template #[`column.created_at`]="{ column }">
      <span>{{ column.title }}</span>
      <v-icon>$sortDesc</v-icon>
    </template>
    <template #[`item.created_at`]="{ item }">
      <div class="text-center">
        {{ dateTimeFormat('ja', item.raw.created_at) }}
      </div>
    </template>
    <!-- 更新者 -->
    <template #[`item.last_updated_user.name`]="{ item }">
      <template v-if="item.raw.last_updated_user != null">
        <div v-if="item.raw.last_updated_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.raw.last_updated_user" />
      </template>
    </template>
    <!-- 更新日時 -->
    <template #[`item.last_updated_at`]="{ item }">
      <div class="text-center">
        {{ dateTimeFormat('ja', item.raw.last_updated_at) }}
      </div>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import UsersAvatar from '~/components/users/Avatar.vue'
import { tableHeight, dateTimeFormat } from '~/utils/display'
import { memberPowerIcon } from '~/utils/members'

const $props = defineProps({
  invitations: {
    type: Array,
    default: null
  },
  hiddenItems: {
    type: Array,
    default: null
  }
})
const $emit = defineEmits(['showUpdate'])
const $config = useRuntimeConfig()
const { t: $t, tm: $tm } = useI18n()
const { $toast } = useNuxtApp()

const headers = computed(() => {
  const result = []
  for (const item of ($tm('items.invitation') as any)) {
    if (item.required || !$props.hiddenItems.includes(item.key)) {
      result.push({ title: item.title, key: item.key, sortable: false, class: 'text-no-wrap', cellClass: 'px-1 py-2' }) // TODO: class/cellClassが効かない
    }
  }
  if (result.length > 0) { result[result.length - 1].cellClass = 'pl-1 pr-4 py-2' } // NOTE: スクロールバーに被らないようにする為
  return result
})
/*
const itemClass = computed(() => (item: any) => item.raw.status === 'active' ? 'row_active' : 'row_inactive')

function showUpdate (event: any, { item }) {
  /* c8 ignore next *//* // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('showUpdate', event.target.innerHTML) }
  if (item.raw.status === 'email_joined') { return }

  $emit('showUpdate', item.raw)
})
*/

async function copyInvitationURL (code: string) {
  try {
    await navigator.clipboard.writeText(`${location.protocol}//${location.host}/users/sign_up?code=${code}`)

    $toast.success($t('notice.invitation.copy_success'))
  /* c8 ignore start */
  } catch (error) {
    // eslint-disable-next-line no-console
    if ($config.public.debug) { console.log(error) }

    $toast.error($t('alert.invitation.copy_failure'))
  }
  /* c8 ignore stop */
}
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
