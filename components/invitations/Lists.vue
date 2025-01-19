<template>
  <v-data-table-server
    v-if="invitations != null && invitations.length > 0"
    :headers="tableHeaders($t, $config.public.invitations.headers, hiddenItems)"
    :items="invitations"
    :items-length="invitations.length"
    :items-per-page="-1"
    density="compact"
    hover
    :row-props="rowProps"
    @dblclick:row="dblclickRow"
  >
    <!-- 招待URL -->
    <template #[`item.code`]="{ item }: any">
      <v-btn
        v-if="item.status === 'active'"
        :id="`invitation_url_copy_btn_${item.code}`"
        color="accent"
        icon
        variant="outlined"
        size="x-small"
        @click="copyInvitationURL(item.code)"
      >
        <v-icon>mdi-content-copy</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ $t('クリップボードにコピー') }}</v-tooltip>
      </v-btn>
    </template>
    <!-- ステータス -->
    <template #[`item.status`]="{ item }: any">
      <template v-if="item.status === 'email_joined'">
        <v-icon :id="`invitation_icon_email_joined_${item.code}`" color="info" size="small">mdi-information</v-icon>
        {{ item.status_i18n }}
      </template>
      <template v-else>
        <v-icon
          :id="`invitation_icon_${item.status === 'active' ? 'active': 'inactive'}_${item.code}`"
          :color="item.status === 'active' ? 'success' : 'error'"
          size="small"
          class="mr-1"
          @click="$emit('showUpdate', item)"
        >
          {{ item.status === 'active' ? 'mdi-check-circle' : 'mdi-alert' }}
        </v-icon>
        <a
          :id="`invitation_update_link_${item.code}`"
          style="color: -webkit-link; cursor: pointer; text-decoration: underline"
          @click="$emit('showUpdate', item)"
        >
          {{ item.status_i18n }}
        </a>
      </template>
    </template>
    <!-- メールアドレス -->
    <template #[`item.email`]="{ item }: any">
      <div class="pl-1">
        <template v-if="item.email != null">
          {{ item.email }}
        </template>
        <template v-else>
          <div v-for="domain in item.domains" :key="domain">
            *@{{ domain }}
          </div>
        </template>
      </div>
    </template>
    <!-- 権限 -->
    <template #[`item.power`]="{ item }: any">
      <v-icon size="small">{{ memberPowerIcon(item.power) }}</v-icon>
      {{ item.power_i18n }}
    </template>
    <!-- 期限 -->
    <template #[`item.ended_at`]="{ item }: any">
      {{ dateTimeFormat(locale, item.ended_at) }}
    </template>
    <!-- 作成者 -->
    <template #[`item.created_user.name`]="{ item }: any">
      <template v-if="item.created_user != null">
        <div v-if="item.created_user.deleted" class="text-center">N/A</div>
        <UsersAvatar v-else :user="item.created_user" />
      </template>
    </template>
    <!-- 作成日時 -->
    <template #[`header.created_at`]="{ column }">
      <span>{{ column.title }}</span>
      <v-icon>$sortDesc</v-icon>
    </template>
    <template #[`item.created_at`]="{ item }: any">
      {{ dateTimeFormat(locale, item.created_at) }}
    </template>
    <!-- 更新者 -->
    <template #[`item.last_updated_user.name`]="{ item }: any">
      <template v-if="item.last_updated_user != null">
        <div v-if="item.last_updated_user.deleted" class="text-center">N/A</div>
        <UsersAvatar v-else :user="item.last_updated_user" />
      </template>
    </template>
    <!-- 更新日時 -->
    <template #[`item.last_updated_at`]="{ item }: any">
      {{ dateTimeFormat(locale, item.last_updated_at) }}
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import UsersAvatar from '~/components/users/Avatar.vue'
import { tableHeaders, dateTimeFormat } from '~/utils/display'
import { memberPowerIcon } from '~/utils/members'

defineProps({
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
const { t: $t, locale } = useI18n()
const { $toast } = useNuxtApp()

const rowProps = computed(() => ({ item }: any) => {
  return { class: item.status === 'active' ? 'row_active' : 'row_inactive' }
})

function dblclickRow (event: any, { item }: any) {
  /* c8 ignore next */ // eslint-disable-next-line no-console
  if ($config.public.debug) { console.log('dblclickRow', event.target.innerHTML) }
  if (item.status === 'email_joined') { return }

  $emit('showUpdate', item)
}

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
