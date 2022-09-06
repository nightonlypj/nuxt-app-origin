<template>
  <div v-if="infomations != null && infomations.length > 0">
    <article v-for="infomation in infomations" :key="infomation.id">
      <div>
        <Label :infomation="infomation" />
        <span class="ml-1 font-weight-bold">
          <template v-if="infomation.body_present === true">
            <NuxtLink :to="{ name: 'infomations-id___ja', params: { id: infomation.id }}">{{ infomation.title }}</NuxtLink>
          </template>
          <template v-else>
            {{ infomation.title }}
          </template>
        </span>
        <span class="ml-1">
          ({{ $dateFormat(infomation.started_at, 'ja', 'N/A') }})
        </span>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="infomation.summary" class="mx-2 my-2" v-html="infomation.summary" />
      <v-divider class="my-4" />
    </article>
  </div>
</template>

<script>
import Label from '~/components/infomations/Label.vue'

export default {
  components: {
    Label
  },

  props: {
    infomations: {
      type: Array,
      default: null
    }
  },

  methods: {
    powerIcon (power) {
      switch (power) {
        case 'Admin':
          return 'mdi-account-cog'
        case 'Writer':
          return 'mdi-account-edit'
        default:
          return 'mdi-account'
      }
    }
  }
}
</script>
