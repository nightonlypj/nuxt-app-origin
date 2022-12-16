<template>
  <v-card>
    <v-card-title>スペース</v-card-title>
    <v-card-text class="d-flex">
      <v-btn color="primary" to="/spaces" nuxt>
        <v-icon dense>mdi-folder-open</v-icon>
        <span class="ml-1">スペースを探す</span>
      </v-btn>
      <div class="ml-2">
        <SpacesCreate btn-color="secondary">
          <template #name>作成する</template>
        </SpacesCreate>
      </div>
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
