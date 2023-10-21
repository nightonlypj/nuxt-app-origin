<template>
  <v-btn
    id="member_delete_btn"
    icon
    variant="outlined"
    size="small"
    @click="showDialog()"
  >
    <v-icon>mdi-delete</v-icon>
    <v-tooltip activator="parent" location="bottom">メンバー解除</v-tooltip>
  </v-btn>
  <v-dialog v-model="dialog" max-width="640px" :attach="$config.public.env.test">
    <v-card id="member_delete_dialog">
      <AppProcessing v-if="processing" />
      <template v-if="dialog">
        <v-toolbar color="error" density="compact">
          <v-icon size="small" class="ml-4">mdi-delete</v-icon>
          <span class="ml-1">メンバー解除</span>
        </v-toolbar>
        <v-card-text>
          <div class="text-h6 pa-4">選択したメンバーを解除しますか？</div>
        </v-card-text>
        <v-card-actions class="justify-end mb-2 mr-2">
          <v-btn
            id="member_delete_no_btn"
            color="secondary"
            variant="elevated"
            @click="dialog = false"
          >
            いいえ（キャンセル）
          </v-btn>
          <v-btn
            id="member_delete_yes_btn"
            color="error"
            variant="elevated"
            @click="postMembersDelete()"
          >
            はい（解除）
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script>
import AppProcessing from '~/components/app/Processing.vue'
import Application from '~/utils/application.js'

export default defineNuxtComponent({
  components: {
    AppProcessing
  },
  mixins: [Application],

  props: {
    space: {
      type: Object,
      required: true
    },
    selectedMembers: {
      type: Array,
      required: true
    }
  },
  emits: ['clear', 'reload'],

  data () {
    return {
      processing: false,
      dialog: false
    }
  },

  methods: {
    // ダイアログ表示
    showDialog () {
      if (!this.$auth.loggedIn) { return this.appRedirectAuth() }
      if (this.$auth.user.destroy_schedule_at != null) { return this.appSetToastedMessage({ alert: this.$t('auth.destroy_reserved') }) }

      this.dialog = true
    },

    // メンバー解除
    async postMembersDelete () {
      this.processing = true

      const url = this.$config.public.members.deleteUrl.replace(':space_code', this.space.code)
      const [response, data] = await useApiRequest(this.$config.public.apiBaseURL + url, 'POST', {
        codes: this.selectedMembers.map(member => member.user.code)
      })

      if (response?.ok) {
        if (this.appCheckResponse(data, { toasted: true })) {
          this.appSetEmitMessage(data, false)
          this.$emit('clear')
          this.$emit('reload')
        }
      } else if (this.appCheckErrorResponse(response?.status, data, { toasted: true }, { auth: true, forbidden: true, reserved: true })) {
        this.appSetToastedMessage(data, true)
      }

      this.dialog = false // NOTE: 失敗しても閉じる為
      this.processing = false
    }
  }
})
</script>
