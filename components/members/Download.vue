<template>
  <v-dialog max-width="480px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="member_download_btn"
        color="accent"
        v-bind="attrs"
        v-on="on"
        @click="initialize()"
      >
        <v-icon dense>mdi-download</v-icon>
        <span class="hidden-sm-and-down ml-1">CSVダウンロード</span>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="member_download_dialog">
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense dark>
            <v-icon dense>mdi-cog</v-icon>
            <span class="ml-1">CSVダウンロード</span>
          </v-toolbar>
          <v-card-text class="pb-0">
            <v-container>
              <template v-for="item in items">
                <v-switch
                  v-if="!item.adminOnly || currentMemberAdmin"
                  :id="'show_item_' + item.value.replace('.', '_')"
                  :key="item.value"
                  v-model="outputItems"
                  color="primary"
                  :label="item.text"
                  :value="item.value"
                  :disabled="item.disabled"
                  hide-details
                  dense
                />
              </template>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mt-4">
            <v-btn
              id="member_download_submit_btn"
              color="primary"
              :disabled="outputItems.length === 0"
              @click="download(dialog)"
            >
              ダウンロード
            </v-btn>
            <v-btn
              id="member_download_cancel_btn"
              color="secondary"
              @click="dialog.value = false"
            >
              キャンセル
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import Application from '~/plugins/application.js'

export default {
  mixins: [Application],

  props: {
    params: {
      type: Object,
      default: null
    },
    showItems: {
      type: Array,
      default: null
    },
    currentMemberAdmin: {
      type: Boolean,
      default: null
    }
  },

  data () {
    return {
      outputItems: null
    }
  },

  computed: {
    items () {
      return this.$t('items.members')
    }
  },

  methods: {
    initialize () {
      this.outputItems = this.appGetShowItems(this.showItems, this.items)
    },

    download ($dialog) {
      const items = []
      for (const item of this.items) {
        if ((!item.adminOnly || this.currentMemberAdmin) && this.outputItems.includes(item.value)) {
          items.push(item.value)
        }
      }

      alert('TODO params: ' + JSON.stringify(this.params) + ', items: [' + items + ']')
      $dialog.value = false
    }
  }
}
</script>
