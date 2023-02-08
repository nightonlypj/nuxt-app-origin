<template>
  <v-card>
    <v-card-title>
      <v-row>
        <v-col>
          スペース
        </v-col>
        <v-col cols="auto" class="d-flex pl-0">
          <v-btn v-if="$config.enablePublicSpace" color="primary" to="/spaces" class="mr-2" nuxt>
            <v-icon dense>mdi-magnify</v-icon>
            <span class="ml-1">探す</span>
          </v-btn>
          <SpacesCreate btn-color="secondary">
            <template #name>作成</template>
          </SpacesCreate>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-list class="overflow-auto py-0" style="max-height: 200px">
        <v-list-item v-for="space in $auth.user.spaces" :id="`space_link_${space.code}`" :key="space.code" :to="`/-/${space.code}`" class="px-2" style="min-height: 42px" nuxt>
          <v-avatar v-if="space.image_url != null" size="24px">
            <v-img :id="`space_image_${space.code}`" :src="space.image_url.mini" />
          </v-avatar>
          <v-list-item-title class="text-overline ml-2">{{ space.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import SpacesCreate from '~/components/spaces/Create.vue'

export default {
  components: {
    SpacesCreate
  }
}
</script>
