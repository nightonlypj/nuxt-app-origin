<template>
  <v-data-table
    v-if="invitations != null && invitations.length > 0"
    :headers="headers"
    :items="invitations"
    item-key="code"
    :item-class="itemClass"
    :items-per-page="-1"
    hide-default-footer
    mobile-breakpoint="600"
    fixed-header
    :height="appTableHeight"
    disable-sort
    @dblclick:row="showUpdate"
  >
    <!-- 招待URL -->
    <template #[`item.code`]="{ item }">
      <div v-if="item.status === 'active'" class="text-center">
        <v-btn
          :id="`invitation_url_copy_btn_${item.code}`"
          color="accent"
          icon
          variant="outlined"
          size="small"
          @click="copyInvitationURL(item.code)"
        >
          <v-icon>mdi-content-copy</v-icon>
          <v-tooltip activator="parent" location="bottom">クリップボードにコピー</v-tooltip>
        </v-btn>
      </div>
    </template>
    <!-- ステータス -->
    <template #[`item.status`]="{ item }">
      <template v-if="item.status === 'email_joined'">
        <v-icon :id="`icon_email_joined_${item.code}`" color="info" size="small">mdi-information</v-icon>
        {{ item.status_i18n }}
      </template>
      <a
        v-else
        :id="`invitation_update_link_${item.code}`"
        class="text-no-wrap"
        @click="$emit('showUpdate', item)"
      >
        <v-icon v-if="item.status === 'active'" :id="`icon_active_${item.code}`" color="success" size="small">mdi-check-circle</v-icon>
        <v-icon v-else :id="`icon_inactive_${item.code}`" color="error" size="small">mdi-alert</v-icon>
        {{ item.status_i18n }}
      </a>
    </template>
    <!-- メールアドレス -->
    <template #[`item.email`]="{ item }">
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
    <template #[`item.power`]="{ item }">
      <div class="text-no-wrap">
        <v-icon size="small">{{ appMemberPowerIcon(item.power) }}</v-icon>
        {{ item.power_i18n }}
      </div>
    </template>
    <!-- 期限 -->
    <template #[`item.ended_at`]="{ item }">
      <div class="text-center">
        {{ $timeFormat('ja', item.ended_at) }}
      </div>
    </template>
    <!-- 作成者 -->
    <template #[`item.created_user.name`]="{ item }">
      <template v-if="item.created_user != null">
        <div v-if="item.created_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.created_user" />
      </template>
    </template>
    <!-- 作成日時 -->
    <template #[`header.created_at`]="{ header }">
      {{ header.text }}
      <v-icon size="small">mdi-arrow-down</v-icon>
    </template>
    <template #[`item.created_at`]="{ item }">
      <div class="text-center">
        {{ $timeFormat('ja', item.created_at) }}
      </div>
    </template>
    <!-- 更新者 -->
    <template #[`item.last_updated_user.name`]="{ item }">
      <template v-if="item.last_updated_user != null">
        <div v-if="item.last_updated_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.last_updated_user" />
      </template>
    </template>
    <!-- 更新日時 -->
    <template #[`item.last_updated_at`]="{ item }">
      <div class="text-center">
        {{ $timeFormat('ja', item.last_updated_at) }}
      </div>
    </template>
  </v-data-table>
</template>

<script>
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    UsersAvatar
  },
  mixins: [Application],

  props: {
    invitations: {
      type: Array,
      default: null
    },
    hiddenItems: {
      type: Array,
      default: null
    }
  },
  emits: ['showUpdate'],

  computed: {
    headers () {
      const result = []
      for (const item of this.$tm('items.invitation')) {
        if (item.required || !this.hiddenItems.includes(item.value)) {
          result.push({ text: item.text, value: item.value, class: 'text-no-wrap', cellClass: 'px-1 py-2' })
        }
      }
      if (result.length > 0) { result[result.length - 1].cellClass = 'pl-1 pr-4 py-2' } // NOTE: スクロールバーに被らないようにする為
      return result
    },

    itemClass () {
      return (item) => {
        return item.status === 'active' ? 'row_active' : 'row_inactive'
      }
    }
  },

  methods: {
    showUpdate (event, { item }) {
      // eslint-disable-next-line no-console
      if (this.$config.public.debug) { console.log('showUpdate', event.target.innerHTML) }
      if (item.status === 'email_joined') { return }

      this.$emit('showUpdate', item)
    },

    copyInvitationURL (code) {
      navigator.clipboard.writeText(`${location.protocol}//${location.host}/users/sign_up?code=${code}`)
        .then(() => {
          this.appSetToastedMessage({ notice: this.$t('notice.invitation.copy_success') }, false, true)
        }, () => {
          this.appSetToastedMessage({ alert: this.$t('alert.invitation.copy_failure') })
        })
    }
  }
})
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
