<template>
  <v-dialog max-width="480px">
    <template #activator="{ on, attrs }">
      <v-btn
        id="member_setting_btn"
        color="accent"
        v-bind="attrs"
        v-on="on"
        @click="initialize()"
      >
        <v-icon dense>mdi-cog</v-icon>
      </v-btn>
    </template>
    <template #default="dialog">
      <v-card id="member_setting_dialog">
        <v-form autocomplete="off">
          <v-toolbar color="primary" dense dark>
            <v-icon dense>mdi-cog</v-icon>
            <span class="ml-1">表示項目変更</span>
          </v-toolbar>
          <v-card-text class="pb-0">
            <v-container>
              <template v-for="item in items">
                <v-switch
                  v-if="!item.adminOnly || currentMemberAdmin"
                  :id="'show_item_' + item.value.replace('.', '_')"
                  :key="item.value"
                  v-model="newShowItems"
                  color="primary"
                  :label="item.text"
                  :value="item.value"
                  :disabled="item.disabled"
                  hide-details
                  dense
                  @change="waiting = false"
                />
              </template>
            </v-container>
          </v-card-text>
          <v-card-actions class="justify-end mt-4">
            <v-btn
              id="member_setting_submit_btn"
              color="primary"
              :disabled="waiting || newShowItems.length === 0"
              @click="change(dialog)"
            >
              変更
            </v-btn>
            <v-btn
              id="member_setting_cancel_btn"
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
      waiting: true,
      newShowItems: null
    }
  },

  computed: {
    items () {
      return this.$t('items.members')
    }
  },

  methods: {
    initialize () {
      this.waiting = true
      this.newShowItems = this.appGetShowItems(this.showItems, this.items)
    },

    change ($dialog) {
      localStorage.setItem('members.show-items', this.newShowItems.toString())
      this.$emit('update:showItems', this.newShowItems)
      $dialog.value = false
    }
  }
}
</script>
