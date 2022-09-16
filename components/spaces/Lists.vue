<template>
  <v-simple-table v-if="spaces != null && spaces.length > 0">
    <template #default>
      <tbody>
        <tr v-for="space in spaces" :key="space.code">
          <td class="px-1" style="width: 35%">
            <div class="my-2">
              <v-avatar v-if="space.image_url != null" :id="'space_image_' + space.code" size="32px">
                <v-img :src="space.image_url.small" />
              </v-avatar>
              <NuxtLink :to="{ name: 'spaces-code___ja', params: { code: space.code }}" class="ml-1">{{ $textTruncate(space.name, 64) }}</NuxtLink>
              <SpacesIcon :space="space" />
            </div>
          </td>
          <td class="px-1">
            <div class="my-2">
              {{ $textTruncate(space.description, 128) }}
            </div>
          </td>
          <td class="px-1">
            <v-btn v-if="space.current_member != null" :to="'/members/' + space.code" fab small nuxt>
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-icon dense small v-bind="attrs" v-on="on">mdi-account-multiple</v-icon>
                </template>
                メンバー
              </v-tooltip>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>
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
    }
  }
}
</script>
