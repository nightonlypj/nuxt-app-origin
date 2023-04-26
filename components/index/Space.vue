<template>
  <v-card>
    <v-card-title>
      <v-row>
        <v-col>
          参加スペース
        </v-col>
        <v-col cols="auto" class="d-flex pl-0">
          <SpacesCreate btn-color="secondary">
            <template #name>作成</template>
          </SpacesCreate>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-list class="overflow-auto py-0" style="max-height: 200px">
        <template v-if="!existUserSpaces">
          <v-alert type="info" dense>
            <small>新しいスペースを作成するか、参加したいスペースの管理者に連絡して追加して貰いましょう！</small>
          </v-alert>
        </template>
        <template v-else>
          <v-list-item v-for="space in $auth.user.spaces" :id="`space_link_${space.code}`" :key="space.code" :to="`/-/${space.code}`" class="px-2" style="min-height: 42px" nuxt>
            <v-avatar v-if="space.image_url != null" size="24px">
              <v-img :id="`space_image_${space.code}`" :src="space.image_url.mini" />
            </v-avatar>
            <v-list-item-title class="text-overline ml-2">{{ space.name }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import SpacesCreate from '~/components/spaces/Create.vue'

export default {
  components: {
    SpacesCreate
  },

  computed: {
    existUserSpaces () {
      return this.$auth.user?.spaces?.length > 0
    }
  }
}
</script>
