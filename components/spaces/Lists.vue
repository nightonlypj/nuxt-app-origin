<template>
  <v-simple-table v-if="spaces != null && spaces.length > 0">
    <template #default>
      <tbody>
        <tr v-for="space in spaces" :key="space.code">
          <td class="px-2" style="vertical-align: top; width: 35%">
            <div class="my-3">
              <v-avatar v-if="space.image_url != null" :id="'space_image_' + space.code" size="32px">
                <v-img :src="space.image_url.small" />
              </v-avatar>
              <NuxtLink :to="{ name: 'spaces-code___ja', params: { code: space.code }}" class="mx-1">{{ $textTruncate(space.name, 64) }}</NuxtLink>
              <v-tooltip v-if="space.private" :id="'private_icon_' + space.code" bottom>
                <template #activator="{ on, attrs }">
                  <v-icon dense v-bind="attrs" v-on="on">mdi-lock</v-icon>
                </template>
                非公開
              </v-tooltip>
              <Member :member="space.member" />
            </div>
          </td>
          <td class="px-2" style="vertical-align: top">
            <div class="my-4">
              <v-tooltip v-if="space.destroy_schedule_at != null" :id="'destroy_schedule_icon_' + space.code" bottom>
                <template #activator="{ on, attrs }">
                  <v-icon dense v-bind="attrs" v-on="on">mdi-delete</v-icon>
                </template>
                {{ $dateFormat(space.destroy_schedule_at, 'ja', 'N/A') }}以降に削除される予定です。
              </v-tooltip>
              {{ $textTruncate(space.description, 128) }}
            </div>
          </td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>
</template>

<script>
import Member from '~/components/spaces/Member.vue'

export default {
  components: {
    Member
  },

  props: {
    spaces: {
      type: Array,
      default: null
    }
  }
}
</script>
