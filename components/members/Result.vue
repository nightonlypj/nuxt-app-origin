<template>
  <div>
    <div v-if="result.email == null">
      N/A
    </div>
    <div v-else class="d-flex align-self-center">
      {{ $localeString(result.email.count, 'N/A') }}名中
      <v-icon :color="$config.enum.member.createColor.create" class="ml-1" dense>{{ $config.enum.member.createIcon.create }}</v-icon>
      招待: {{ $localeString(result.email.create_count, 'N/A') }}名
      <v-icon :color="$config.enum.member.createColor.exist" class="ml-1" dense>{{ $config.enum.member.createIcon.exist }}</v-icon>
      参加中: {{ $localeString(result.email.exist_count, 'N/A') }}名
      <v-icon :color="$config.enum.member.createColor.notfound" class="ml-1" dense>{{ $config.enum.member.createIcon.notfound }}</v-icon>
      未登録: {{ $localeString(result.email.notfound_count, 'N/A') }}名
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
        <v-icon :color="$config.enum.member.createColor[item.result]" dense>{{ $config.enum.member.createIcon[item.result] }}</v-icon>
        {{ item.result_i18n }}
      </template>
    </v-data-table>
    <v-divider class="my-2" />
  </div>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
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
}
</script>
