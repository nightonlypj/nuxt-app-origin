<template>
  <v-data-table
    v-if="members != null && members.length > 0"
    v-model="syncSelectedMembers"
    :headers="headers"
    :items="members"
    item-key="user.code"
    :item-class="itemClass"
    :items-per-page="-1"
    hide-default-footer
    mobile-breakpoint="600"
    fixed-header
    :height="appTableHeight"
    must-sort
    :sort-by.sync="syncSortBy"
    :sort-desc.sync="syncSortDesc"
    :custom-sort="disableSortItem"
    :show-select="currentMemberAdmin"
    @dblclick:row="showUpdate"
  >
    <!-- メンバー -->
    <template #[`item.user.name`]="{ item }">
      <div class="ml-1">
        <UsersAvatar :user="item.user" />
      </div>
    </template>
    <!-- メールアドレス -->
    <template #[`header.user.email`]="{ header }">
      {{ header.text }}
      <OnlyIcon power="admin" />
    </template>
    <!-- 権限 -->
    <template #[`item.power`]="{ item }">
      <a
        v-if="currentMemberAdmin && item.user.code !== $auth.user.code"
        :id="'member_update_link_' + item.user.code"
        class="text-no-wrap"
        @click="$emit('showUpdate', item)"
      >
        <v-icon dense>{{ appMemberPowerIcon(item.power) }}</v-icon>
        {{ item.power_i18n }}
      </a>
      <div v-else class="text-no-wrap">
        <v-icon dense>{{ appMemberPowerIcon(item.power) }}</v-icon>
        {{ item.power_i18n }}
      </div>
    </template>
    <!-- 招待者 -->
    <template #[`header.invitation_user.name`]="{ header }">
      {{ header.text }}
      <OnlyIcon power="admin" />
    </template>
    <template #[`item.invitation_user.name`]="{ item }">
      <UsersAvatar :user="item.invitation_user" />
    </template>
    <!-- 招待者日時 -->
    <template #[`item.invitationed_at`]="{ item }">
      <span class="text-no-wrap">{{ $timeFormat(item.invitationed_at, 'ja') }}</span>
    </template>
  </v-data-table>
</template>

<script>
import OnlyIcon from '~/components/members/OnlyIcon.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    OnlyIcon,
    UsersAvatar
  },
  mixins: [Application],

  props: {
    sortBy: {
      type: String,
      required: true
    },
    sortDesc: {
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
      default: null
    },
    activeUserCodes: {
      type: Array,
      required: true
    },
    currentMemberAdmin: {
      type: Boolean,
      default: null
    }
  },

  computed: {
    headers () {
      const result = []
      if (this.currentMemberAdmin) {
        result.push({ value: 'data-table-select', class: 'pl-3 pr-0', cellClass: 'pl-3 pr-0 py-2' })
      }
      for (const item of this.$t('items.member')) {
        if ((item.required || !this.hiddenItems.includes(item.value)) && (!item.adminOnly || this.currentMemberAdmin)) {
          result.push({ text: item.text, value: item.value, class: 'text-no-wrap', cellClass: 'px-1 py-2' })
        }
      }
      if (result.length > 0) { result[result.length - 1].cellClass = 'pl-1 pr-4 py-2' } // NOTE: スクロールバーに被らないようにする為
      return result
    },

    itemClass () {
      return (item) => {
        return this.activeUserCodes.includes(item.user?.code) ? 'row_active' : null
      }
    },

    syncSortBy: {
      get () {
        return this.sortBy
      },
      set (value) {
        this.$emit('reload', { sortBy: value })
      }
    },
    syncSortDesc: {
      get () {
        return this.sortDesc
      },
      set (value) {
        this.$emit('reload', { sortDesc: value })
      }
    },
    syncSelectedMembers: {
      get () {
        return this.selectedMembers
      },
      set (value) {
        this.$emit('update:selectedMembers', value)
      }
    }
  },

  methods: {
    disableSortItem (items) {
      return items
    },

    showUpdate (event, { item }) {
      // eslint-disable-next-line no-console
      if (this.$config.debug) { console.log('showUpdate', event.target.innerHTML) }
      if (!this.currentMemberAdmin || item.user.code === this.$auth.user.code) { return }

      if (event.target.innerHTML.match(/v-ripple__animation--visible/) || event.target.innerHTML.match(/v-simple-checkbox/)) {
        // eslint-disable-next-line no-console
        if (this.$config.debug) { console.log('...Skip') }
        return
      }

      this.$emit('showUpdate', item)
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
</style>
