<template>
  <v-dialog max-width="480px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="setting_btn"
        color="accent"
        v-bind="attrs"
        v-on="on"
        @click="initialize()"
      >
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <v-icon dense small v-on="tooltip">mdi-cog</v-icon>
          </template>
          設定変更
        </v-tooltip>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="setting_dialog">
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense dark>
            <v-icon dense>mdi-cog</v-icon>
            <span class="ml-1">設定変更</span>
          </v-toolbar>
          <v-card-text>
            <v-container class="py-0">
              <h4>表示項目</h4>
              <template v-for="item in items">
                <v-switch
                  v-if="!item.adminOnly || admin"
                  :id="'setting_show_item_' + item.value.replace('.', '_')"
                  :key="item.value"
                  v-model="showItems"
                  color="primary"
                  :label="item.text"
                  :value="item.value"
                  :disabled="item.required"
                  hide-details
                  dense
                  class="mt-1"
                  @change="waiting = false"
                />
              </template>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              id="setting_submit_btn"
              color="primary"
              :disabled="waiting || showItems.length === 0"
              @click="change(dialog)"
            >
              変更
            </v-btn>
            <v-btn
              id="setting_cancel_btn"
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
    model: {
      type: String,
      required: true
    },
    hiddenItems: {
      type: Array,
      default: null
    },
    admin: {
      type: Boolean,
      default: null
    }
  },

  data () {
    return {
      waiting: true,
      showItems: null
    }
  },

  computed: {
    items () {
      return this.$t('items.' + this.model)
    }
  },

  methods: {
    initialize () {
      this.waiting = true
      this.showItems = []
      for (const item of this.items) {
        if (item.required || !this.hiddenItems.includes(item.value)) {
          this.showItems.push(item.value)
        }
      }
    },

    change ($dialog) {
      const hiddenItems = []
      for (const item of this.items) {
        if (!this.showItems.includes(item.value)) {
          hiddenItems.push(item.value)
        }
      }
      localStorage.setItem(this.model + '.hidden-items', hiddenItems.toString())
      this.$emit('update:hiddenItems', hiddenItems)
      $dialog.value = false
    }
  }
}
</script>
