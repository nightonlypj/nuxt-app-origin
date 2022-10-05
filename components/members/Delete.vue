<template>
  <v-dialog max-width="640px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="member_delete_btn"
        fab
        outlined
        small
        v-bind="attrs"
        v-on="on"
      >
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <v-icon dense small v-on="tooltip">mdi-delete</v-icon>
          </template>
          選択メンバー解除
        </v-tooltip>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="member_delete_dialog">
        <Processing v-if="processing" />
        <v-form autocomplete="off">
          <v-toolbar color="warning" dense dark>
            <v-icon dense>mdi-delete</v-icon>
            <span class="ml-1">メンバー解除</span>
          </v-toolbar>
          <v-card-text>
            <div class="text-h6 pa-6">選択したメンバーを解除しますか？</div>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              id="member_delete_no_btn"
              color="secondary"
              @click="dialog.value = false"
            >
              いいえ
            </v-btn>
            <v-btn
              id="member_delete_yes_btn"
              color="warning"
              @click="postMembersDelete(dialog)"
            >
              はい
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </template>
  </v-dialog>
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
      processing: false
    }
  },

  methods: {
    // メンバー招待
    async postMembersDelete ($dialog) {
      this.processing = true

      const codes = []
      for (const member of this.selectedMembers) {
        codes.push(member.user.code)
      }
      await this.$axios.post(this.$config.apiBaseURL + this.$config.membersDeleteUrl.replace(':code', this.space.code), { codes })
        .then((response) => {
          if (!this.appCheckResponse(response, { toasted: true })) { return }

          this.appSetToastedMessage(response.data, false)
          this.$emit('reload')
          $dialog.value = false
        },
        (error) => {
          if (!this.appCheckErrorResponse(error, { toasted: true }, { auth: true, forbidden: true })) { return }

          this.appSetToastedMessage(error.response.data, true)
        })

      this.processing = false
    }
  }
}
</script>
