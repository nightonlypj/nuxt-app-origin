<template>
  <div v-if="result.email == null">
    N/A
  </div>
  <div v-else class="d-flex align-self-center">
    {{ $localeString('ja', result.email.count, 'N/A') }}名中
    <v-icon :color="$config.public.member.createColor.create" class="ml-1" size="small">{{ $config.public.member.createIcon.create }}</v-icon>
    招待: {{ $localeString('ja', result.email.create_count, 'N/A') }}名
    <v-icon :color="$config.public.member.createColor.exist" class="ml-1" size="small">{{ $config.public.member.createIcon.exist }}</v-icon>
    参加中: {{ $localeString('ja', result.email.exist_count, 'N/A') }}名
    <v-icon :color="$config.public.member.createColor.notfound" class="ml-1" size="small">{{ $config.public.member.createIcon.notfound }}</v-icon>
    未登録: {{ $localeString('ja', result.email.notfound_count, 'N/A') }}名
  </div>
  <v-divider class="my-2" />
  <v-data-table
    :headers="headers"
    :items="result.emails"
    :items-per-page="-1"
    hide-default-footer
    mobile-breakpoint="600"
    fixed-header
    :height="appTableHeight"
  >
    <!-- 結果 -->
    <template #[`item.result`]="{ item }">
      <v-icon :color="$config.public.member.createColor[item.result]" size="small">{{ $config.public.member.createIcon[item.result] }}</v-icon>
      {{ item.result_i18n }}
    </template>
  </v-data-table>
  <v-divider class="my-2" />
</template>

<script>
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  mixins: [Application],

  props: {
    result: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      headers: [
        { text: 'メールアドレス', value: 'email', class: 'text-no-wrap' },
        { text: '結果', value: 'result', class: 'text-no-wrap' }
      ]
    }
  }
})
</script>
