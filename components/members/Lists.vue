<template>
  <v-simple-table v-if="members != null && members.length > 0" fixed-header :height="Math.max(200, $vuetify.breakpoint.height - 146) + 'px'">
    <template #default>
      <thead>
        <tr class="text-no-wrap">
          <th>ユーザー名</th>
          <th v-if="currentMemberAdmin">
            メールアドレス
            <OnlyIcon power="admin" />
          </th>
          <th>権限</th>
          <th v-if="currentMemberAdmin">
            招待者
            <OnlyIcon power="admin" />
          </th>
          <th>
            招待日時
            <v-icon>mdi-triangle-small-down</v-icon>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="member in members" :key="member.user.code">
          <td class="px-1">
            <div class="my-2">
              <v-avatar v-if="member.user.image_url != null" size="32px">
                <v-img :src="member.user.image_url.small" />
              </v-avatar>
              <span class="ml-1">{{ $textTruncate(member.user.name, 32) }}</span>
            </div>
          </td>
          <td v-if="currentMemberAdmin" class="px-1">
            {{ member.user.email }}
          </td>
          <td class="text-no-wrap px-1">
            <v-icon dense>{{ $config.enum.member.powerIcon[member.power] || $config.enum.member.powerIcon.default }}</v-icon>
            {{ member.power_i18n }}
          </td>
          <td v-if="currentMemberAdmin" class="px-1">
            <div class="my-2">
              <div v-if="member.invitation_user != null" class="my-2">
                <v-avatar v-if="member.invitation_user.image_url != null" size="32px">
                  <v-img :src="member.invitation_user.image_url.small" />
                </v-avatar>
                <span class="ml-1">{{ $textTruncate(member.invitation_user.name, 32) }}</span>
              </div>
            </div>
          </td>
          <td class="text-no-wrap px-1">
            {{ $timeFormat(member.invitationed_at, 'ja') }}
          </td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>
</template>

<script>
import OnlyIcon from '~/components/members/OnlyIcon.vue'

export default {
  components: {
    OnlyIcon
  },

  props: {
    members: {
      type: Array,
      default: null
    },
    currentMemberAdmin: {
      type: Boolean,
      default: null
    }
  }
}
</script>
