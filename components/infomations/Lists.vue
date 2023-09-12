<template>
  <template v-if="infomations != null && infomations.length > 0">
    <article v-for="infomation in infomations" :key="infomation.id" @dblclick="redirectInfomation(infomation)">
      <div>
        <InfomationsLabel :infomation="infomation" />
        <span class="ml-1 font-weight-bold">
          <template v-if="infomation.body_present">
            <NuxtLink :to="`/infomations/${infomation.id}`">{{ infomation.title }}</NuxtLink>
          </template>
          <template v-else>
            {{ infomation.title }}
          </template>
        </span>
        <span class="ml-1">
          ({{ $dateFormat('ja', infomation.started_at, 'N/A') }})
        </span>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="infomation.summary" class="ma-2" v-html="infomation.summary" />
      <v-divider class="my-4" />
    </article>
  </template>
</template>

<script>
import InfomationsLabel from '~/components/infomations/Label.vue'

export default defineNuxtComponent({
  components: {
    InfomationsLabel
  },

  props: {
    infomations: {
      type: Array,
      default: null
    }
  },

  methods: {
    redirectInfomation (infomation) {
      if (!infomation.body_present) { return }

      navigateTo(`/infomations/${infomation.id}`)
    }
  }
})
</script>
