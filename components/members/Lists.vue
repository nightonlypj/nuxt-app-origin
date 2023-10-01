<template>
  <v-data-table
    v-if="members != null && members.length > 0"
    v-model="syncSelectedMembers"
    v-model:sort-by="syncSort"
    v-model:sort-desc="syncDesc"
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
    :custom-sort="disableSortItem"
    :show-select="admin"
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
        v-if="admin && item.user.code !== $auth.user.code"
        :id="`member_update_link_${item.user.code}`"
        class="text-no-wrap"
        @click="$emit('showUpdate', item)"
      >
        <v-icon size="small">{{ appMemberPowerIcon(item.power) }}</v-icon>
        {{ item.power_i18n }}
      </a>
      <div v-else class="text-no-wrap">
        <v-icon size="small">{{ appMemberPowerIcon(item.power) }}</v-icon>
        {{ item.power_i18n }}
      </div>
    </template>
    <!-- 招待者 -->
    <template #[`header.invitationed_user.name`]="{ header }">
      {{ header.text }}
      <OnlyIcon power="admin" />
    </template>
    <template #[`item.invitationed_user.name`]="{ item }">
      <template v-if="item.invitationed_user != null">
        <div v-if="item.invitationed_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.invitationed_user" />
      </template>
    </template>
    <!-- 招待日時 -->
    <template #[`item.invitationed_at`]="{ item }">
      <div class="text-center">
        {{ $timeFormat('ja', item.invitationed_at) }}
      </div>
    </template>
    <!-- 更新者 -->
    <template #[`header.last_updated_user.name`]="{ header }">
      {{ header.text }}
      <OnlyIcon power="admin" />
    </template>
    <template #[`item.last_updated_user.name`]="{ item }">
      <template v-if="item.last_updated_user != null">
        <div v-if="item.last_updated_user.deleted" class="text-center">
          N/A
        </div>
        <UsersAvatar v-else :user="item.last_updated_user" />
      </template>
    </template>
    <!-- 更新日時 -->
    <template #[`header.last_updated_at`]="{ header }">
      {{ header.text }}
      <OnlyIcon power="admin" />
    </template>
    <template #[`item.last_updated_at`]="{ item }">
      <div class="text-center">
        {{ $timeFormat('ja', item.last_updated_at) }}
      </div>
    </template>
  </v-data-table>
</template>

<script>
import OnlyIcon from '~/components/members/OnlyIcon.vue'
import UsersAvatar from '~/components/users/Avatar.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    OnlyIcon,
    UsersAvatar
  },
  mixins: [Application],

  props: {
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
      default: null
    },
    activeUserCodes: {
      type: Array,
      required: true
    },
    admin: {
      type: Boolean,
      default: null
    }
  },
  emits: ['update:selectedMembers', 'reload', 'showUpdate'],

  computed: {
    headers () {
      const result = []
      if (this.admin) {
        result.push({ value: 'data-table-select', class: 'pl-3 pr-0', cellClass: 'pl-3 pr-0 py-2' })
      }
      for (const item of this.$tm('items.member')) {
        if ((item.required || !this.hiddenItems.includes(item.value)) && (!item.adminOnly || this.admin)) {
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

    syncSort: {
      get () {
        return this.sort
      },
      set (value) {
        this.$emit('reload', { sort: value })
      }
    },
    syncDesc: {
      get () {
        return this.desc
      },
      set (value) {
        this.$emit('reload', { desc: value })
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
      if (this.$config.public.debug) { console.log('showUpdate', event.target.innerHTML) }
      if (!this.admin || item.user.code === this.$auth.user.code) { return }

      if (event.target.innerHTML.match(/v-ripple__animation--visible/) || event.target.innerHTML.match(/v-simple-checkbox/)) {
        // eslint-disable-next-line no-console
        if (this.$config.public.debug) { console.log('...Skip') }
        return
      }

      this.$emit('showUpdate', item)
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
</style>
