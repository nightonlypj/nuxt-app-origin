<template>
  <div>
    <v-btn
      id="member_delete_btn"
      fab
      outlined
      small
      @click="showDialog()"
    >
      <v-tooltip bottom>
        <template #activator="{ on: tooltip }">
          <v-icon small v-on="tooltip">mdi-delete</v-icon>
        </template>
        メンバー解除
      </v-tooltip>
    </v-btn>
    <v-dialog v-model="dialog" max-width="640px">
      <v-card id="member_delete_dialog">
        <Processing v-if="processing" />
        <template v-if="dialog">
          <v-toolbar color="error" dense>
            <v-icon dense>mdi-delete</v-icon>
            <span class="ml-1">メンバー解除</span>
          </v-toolbar>
          <v-card-text>
            <div class="text-h6 pa-4">選択したメンバーを解除しますか？</div>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              id="member_delete_no_btn"
              color="secondary"
              @click="dialog = false"
            >
              いいえ
            </v-btn>
            <v-btn
              id="member_delete_yes_btn"
              color="error"
              @click="postMembersDelete()"
            >
              はい
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Processing from '~/components/Processing.vue'
import Application from '~/plugins/application.js'

export default {
  components: {
    Processing
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

      await this.$axios.post(this.$config.apiBaseURL + this.$config.members.deleteUrl.replace(':space_code', this.space.code), {
        codes: this.selectedMembers.map(member => member.user.code)
      })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetEmitMessage(response.data, false)
          this.$emit('clear')
          this.$emit('reload')
          this.dialog = false
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, forbidden: true, reserved: true })) { return }

          this.appSetToastedMessage(error.response.data, true)
        })

      this.processing = false
    }
  }
}
</script>
