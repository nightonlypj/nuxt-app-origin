<template>
  <template v-if="infomations?.length > 0">
    <article
      v-for="infomation in infomations"
      :id="`infomation_list_${infomation.id}`"
      :key="infomation.id"
      @dblclick="redirectInfomation(infomation)"
    >
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
          ({{ dateFormat('ja', infomation.started_at, 'N/A') }})
        </span>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="infomation.summary" class="ma-2" v-html="infomation.summary" />
      <v-divider class="my-4" />
    </article>
  </template>
</template>

<script setup lang="ts">
import InfomationsLabel from '~/components/infomations/Label.vue'
import { dateFormat } from '~/utils/helper'

defineProps({
  infomations: {
    type: [Object],
    default: null
  }
})

function redirectInfomation (infomation: any) {
  if (!infomation.body_present) { return }

  navigateTo(`/infomations/${infomation.id}`)
}
</script>
