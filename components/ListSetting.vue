<template>
  <v-dialog max-width="480px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="setting_btn"
        color="secondary"
        v-bind="attrs"
        v-on="on"
        @click="initialize()"
      >
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <v-icon small v-on="tooltip">mdi-cog</v-icon>
          </template>
          設定変更
        </v-tooltip>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="setting_dialog">
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense>
            <v-icon dense>mdi-cog</v-icon>
            <span class="ml-1">設定変更</span>
          </v-toolbar>
          <v-card-text>
            <v-container class="py-0">
              <h4>
                表示項目
                <v-btn small :disabled="showItems.length >= items.length" class="ml-4" @click="setAllShowItems()">全選択</v-btn>
                <v-btn small :disabled="showItems.length <= requiredShowItems.length" @click="clearShowItems()">全解除</v-btn>
              </h4>
              <template v-for="item in items">
                <v-switch
                  :id="`setting_show_item_${item.value.replace('.', '_')}`"
                  :key="item.value"
                  v-model="showItems"
                  color="primary"
                  :label="item.text"
                  :value="item.value"
                  :disabled="item.required"
                  dense
                  hide-details
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
              :disabled="waiting"
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
    admin: {
      type: Boolean,
      default: null
    },
    model: {
      type: String,
      required: true
    },
    hiddenItems: {
      type: Array,
      required: true
    }
  },

  data () {
    return {
      waiting: null,
      showItems: null
    }
  },

  computed: {
    items () {
      return this.$t(`items.${this.model}`).filter(item => !item.adminOnly || this.admin)
    },
    requiredShowItems () {
      return this.items.filter(item => item.required).map(item => item.value)
    }
  },

  methods: {
    initialize () {
      this.waiting = true
      this.showItems = this.items.filter(item => item.required || !this.hiddenItems.includes(item.value)).map(item => item.value)
    },

    setAllShowItems () {
      this.showItems = this.items.map(item => item.value)
      this.waiting = false
    },
    clearShowItems () {
      this.showItems = this.requiredShowItems
      this.waiting = false
    },

    change ($dialog) {
      const hiddenItems = this.items.filter(item => !this.showItems.includes(item.value)).map(item => item.value)
      localStorage.setItem(`${this.model}.hidden-items`, hiddenItems.toString())
      this.$emit('update:hiddenItems', hiddenItems)
      $dialog.value = false
    }
  }
}
</script>
